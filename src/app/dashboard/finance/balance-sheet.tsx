"use client"

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Plus, Trash2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addAccount, deleteAccount, updateAccountsBatch, getTransactionsForExport } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, subMonths } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface Account {
    id: string;
    name: string;
    group: 'currentAssets' | 'fixedAssets' | 'ownersEquity' | 'currentLiabilities';
    balance: number;
}

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    date: string;
    balance: number;
    isReversed: boolean;
    isDeleted?: boolean;
}

interface AssetGroup {
    group: string;
    accounts: (Account | Liability)[];
    total: number;
}

interface BalanceSheetData {
    currentAssets: AssetGroup;
    currentLiabilities: AssetGroup;
    fixedAssets: AssetGroup;
    ownersEquity: AssetGroup;
    grandTotal: number;
}

interface Liability {
    name: string;
    balance: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
}

// Fetch unpaid reimbursements (status 'approved')
async function getUnpaidReimbursements() {
    const reimbursementsQuery = query(collection(db, "reimbursements"), where("status", "==", "approved"));
    const reimbursementsSnap = await getDocs(reimbursementsQuery);
    const reimbursements = reimbursementsSnap.docs.map(doc => doc.data());

    const userIds = [...new Set(reimbursements.map(r => r.submittedById))];
    const users: Record<string, string> = {};
    if (userIds.length > 0) {
        const usersQuery = query(collection(db, "users"), where("id", "in", userIds));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.forEach(doc => {
            users[doc.id] = doc.data().name;
        });
    }

    const liabilities: Record<string, number> = {};
    reimbursements.forEach(r => {
        const userName = `Reimbursement: ${users[r.submittedById] || 'Unknown User'}`;
        if (liabilities[userName]) {
            liabilities[userName] += r.amount;
        } else {
            liabilities[userName] = r.amount;
        }
    });

    return Object.entries(liabilities).map(([name, balance]) => ({ name, balance }));
}


const accountFormSchema = z.object({
  name: z.string().min(3, "Account name is required."),
  group: z.enum(['currentAssets', 'fixedAssets', 'ownersEquity', 'currentLiabilities'], { required_error: "Please select an asset group." }),
  balance: z.coerce.number().min(0, "Balance must be a positive number."),
});
type AccountFormValues = z.infer<typeof accountFormSchema>;

const AddAccountForm = ({ onAdd, closeDialog }: { onAdd: () => void, closeDialog: () => void }) => {
    const { toast } = useToast();
    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: { name: "", balance: 0 },
    });

    const onSubmit = async (values: AccountFormValues) => {
        try {
            await addAccount(values);
            toast({ title: "Success", description: "New account added." });
            form.reset();
            onAdd();
            closeDialog();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Opening Balance</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="group"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Group</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="currentAssets">Current Assets</SelectItem>
                                    <SelectItem value="fixedAssets">Fixed Assets</SelectItem>
                                    <SelectItem value="ownersEquity">Owner's Equity</SelectItem>
                                    <SelectItem value="currentLiabilities">Current Liabilities</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Account
                </Button>
            </form>
        </Form>
    );
}

const BalanceSheetEditor = ({ accounts, onUpdate, closeDialog }: { accounts: Account[], onUpdate: () => void, closeDialog: () => void }) => {
    const [localAccounts, setLocalAccounts] = useState<Account[]>(() => JSON.parse(JSON.stringify(accounts)));
    const [isDirty, setIsDirty] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setLocalAccounts(JSON.parse(JSON.stringify(accounts)));
        setIsDirty(false);
    }, [accounts]);
    
    const handleBalanceChange = (accountId: string, newBalance: number) => {
        setLocalAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
        setIsDirty(true);
    };

    const handleDelete = async (accountId: string) => {
        setIsDeleting(accountId);
        try {
            await deleteAccount(accountId);
            toast({ title: "Success", description: "Account deleted." });
            onUpdate();
        } catch (error) {
             toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        } finally {
            setIsDeleting(null);
        }
    }
    
    const handleUpdateAll = async () => {
        setIsLoading(true);
        try {
            const updates = localAccounts
                .filter((localAcc, index) => localAcc.balance !== accounts[index].balance)
                .map(acc => ({ id: acc.id, balance: acc.balance }));
            
            if (updates.length > 0) {
                await updateAccountsBatch(updates);
                toast({ title: "Success", description: "All account changes have been saved." });
                onUpdate();
                setIsDirty(false);
            } else {
                toast({ title: "No Changes", description: "No changes were detected." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        if (isDirty) {
            setShowUnsavedAlert(true);
        } else {
            closeDialog();
        }
    }

    if (showAddForm) {
        return (
             <div>
                <CardHeader>
                    <CardTitle>Add New Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddAccountForm onAdd={onUpdate} closeDialog={() => setShowAddForm(false)} />
                </CardContent>
                <CardContent>
                     <Button variant="outline" onClick={() => setShowAddForm(false)} className="w-full">Cancel</Button>
                </CardContent>
             </div>
        )
    }

    return (
        <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
            <DialogHeader>
                <DialogTitle>Edit Balance Sheet</DialogTitle>
                <DialogDescription>Add, remove, or update accounts.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-hidden flex flex-col">
                <ScrollArea className="flex-grow pr-6 -mr-6">
                    <div className="space-y-4">
                        {localAccounts.map(acc => (
                            <div key={acc.id} className="flex items-center justify-between gap-4">
                                <span className="font-medium flex-1 truncate" title={acc.name}>{acc.name}</span>
                                <div className="w-32">
                                     <Input 
                                        type="number" 
                                        value={acc.balance} 
                                        onChange={e => handleBalanceChange(acc.id, Number(e.target.value))} 
                                        className="h-8 text-right" 
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(acc.id)} disabled={!!isDeleting}>
                                    {isDeleting === acc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter className="pt-4 border-t gap-2">
                 <Button variant="ghost" className="mr-auto" onClick={() => setShowAddForm(true)}>
                    <Plus className="mr-2 h-4 w-4"/>
                    New Account
                 </Button>
                 <Button variant="outline" onClick={handleClose}>Close</Button>
                 <Button onClick={handleUpdateAll} disabled={isLoading || !isDirty}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Accounts
                </Button>
            </DialogFooter>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to close? Your changes will be lost.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={closeDialog}>Discard Changes</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const ExportDialog = ({ balanceSheetData, allUsers, onExportPDF }: { balanceSheetData: BalanceSheetData, allUsers: any[], onExportPDF: () => void }) => {
    const { toast } = useToast();
    const [exportType, setExportType] = useState<'bs-pdf' | 'bs-xlsx' | 'tx-xlsx'>('bs-pdf');
    const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date; }>({
        from: subMonths(new Date(), 1),
        to: new Date()
    });

    const handleTransactionExport = async () => {
        toast({ title: "Generating Export...", description: "Please wait while we prepare your file." });
        try {
            const startDate = format(dateRange.from, 'yyyy-MM-dd');
            const endDate = format(dateRange.to, 'yyyy-MM-dd');
            const dataToExport = await getTransactionsForExport(startDate, endDate);
            
            const formattedData = dataToExport.map((t: any) => ({
                Date: t.date,
                Type: t.type,
                Category: t.category,
                Description: t.description,
                Amount: t.amount,
                Balance: t.balance,
                Payee: allUsers.find(u => u.id === t.payee)?.name || t.payee || 'N/A',
                'Created By': allUsers.find(u => u.id === t.createdBy)?.name || 'Unknown',
                Status: t.isReversed ? 'Reversed' : t.isReversal ? 'Reversal' : 'Normal',
                Notes: t.notes
            }));
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
            XLSX.writeFile(workbook, `rc-club-transactions-${startDate}-to-${endDate}.xlsx`);
            toast({ title: "Export Successful!", description: "Your file has been downloaded." });
        } catch (error) {
            toast({ variant: "destructive", title: "Export Failed", description: (error as Error).message });
        }
    };
    
    const handleBalanceSheetXLSXExport = () => {
        const worksheetData: (string | number)[][] = [];
        worksheetData.push(['Balance Sheet']);
        worksheetData.push([`Generated on: ${format(new Date(), 'PPP')}`]);
        worksheetData.push([]); // Spacer row
        worksheetData.push(['Account', 'Balance (₹)']);

        const sections = [
            { title: "Current Assets", data: balanceSheetData.currentAssets },
            { title: "Fixed Assets", data: balanceSheetData.fixedAssets },
            { title: "Current Liabilities", data: balanceSheetData.currentLiabilities },
            { title: "Owner's Equity", data: balanceSheetData.ownersEquity },
        ];

        sections.forEach(section => {
            worksheetData.push([section.title]);
            (section.data.accounts as any[]).forEach(account => {
                worksheetData.push([account.name, account.balance]);
            });
            worksheetData.push([`Total ${section.title}`, section.data.total]);
            worksheetData.push([]); // Spacer row
        });

        worksheetData.push(['Grand Total', balanceSheetData.grandTotal]);
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Balance Sheet");
        XLSX.writeFile(workbook, `balance-sheet-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        toast({ title: "Success", description: "Balance sheet exported as XLSX." });
    };

    const handleExport = () => {
        if (exportType === 'bs-pdf') {
            onExportPDF();
        } else if (exportType === 'bs-xlsx') {
            handleBalanceSheetXLSXExport();
        } else if (exportType === 'tx-xlsx') {
            handleTransactionExport();
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export Financial Data</DialogTitle>
                    <DialogDescription>Select the report and format you want to download.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bs-pdf">Balance Sheet (PDF)</SelectItem>
                            <SelectItem value="bs-xlsx">Balance Sheet (XLSX)</SelectItem>
                            <SelectItem value="tx-xlsx">Transactions (XLSX)</SelectItem>
                        </SelectContent>
                    </Select>

                    {exportType === 'tx-xlsx' && (
                        <DateRangePicker 
                            onUpdate={(values) => setDateRange(values.range)}
                            initialDateFrom={dateRange.from}
                            initialDateTo={dateRange.to}
                            align="center"
                            showCompare={false}
                        />
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleExport}>
                        Export Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const BalanceSheetTable = ({ data, accounts, allUsers, onUpdate }: { data: BalanceSheetData, accounts: Account[], allUsers: any[], onUpdate: () => void }) => {
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer';
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const { toast } = useToast();

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Balance Sheet", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 28);
        
        const tableData = sections.flatMap(section => {
            const sectionRows = section.data.accounts.map((account: any) => [
                { content: account.name, styles: { cellWidth: 80 } },
                { content: formatCurrency(account.balance), styles: { halign: 'right' } },
            ]);
            
            return [
                [{ content: section.title, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
                ...sectionRows,
                 [{ content: `Total ${section.title}`, styles: { fontStyle: 'bold' } }, { content: formatCurrency(section.data.total), styles: { fontStyle: 'bold', halign: 'right' } }]
            ];
        });

        tableData.push([
            { content: 'Grand Total', styles: { fontStyle: 'bold', fontSize: 12, fillColor: [200, 200, 200] } },
            { content: formatCurrency(data.grandTotal), styles: { fontStyle: 'bold', fontSize: 12, halign: 'right', fillColor: [200, 200, 200] } }
        ]);

        (doc as any).autoTable({
            startY: 35,
            head: [['Account', 'Balance (₹)']],
            body: tableData,
            theme: 'striped',
            didDrawCell: (data: any) => {
                 if (data.row.raw.length === 1) { // This is a section header
                    if (data.row.raw[0].styles.fillColor) {
                        doc.setFillColor(data.row.raw[0].styles.fillColor[0], data.row.raw[0].styles.fillColor[1], data.row.raw[0].styles.fillColor[2]);
                    }
                }
            }
        });

        doc.save(`balance-sheet-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast({ title: "Success", description: "Balance sheet exported as PDF." });
    };

    const sections = [
        { title: "Current Assets", data: data.currentAssets },
        { title: "Fixed Assets", data: data.fixedAssets },
        { title: "Current Liabilities", data: data.currentLiabilities },
        { title: "Owner's Equity", data: data.ownersEquity },
    ];
    
    return (
        <div className="space-y-6">
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Balance Sheet</CardTitle>
                        <div className="flex gap-2">
                            <ExportDialog balanceSheetData={data} allUsers={allUsers} onExportPDF={handleExportPDF} />
                            {isTreasurer && (
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </DialogTrigger>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Group</TableHead>
                                    <TableHead>Accounts</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sections.map(section => (
                                    <React.Fragment key={section.title}>
                                        <TableRow>
                                            <TableCell colSpan={2} className="font-bold">{section.title}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(section.data.total)}</TableCell>
                                        </TableRow>
                                        {(section.data.accounts as any[]).map(account => (
                                            <TableRow key={account.name} className="hover:bg-muted/50">
                                                <TableCell className="pl-8"></TableCell>
                                                <TableCell>{account.name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))}
                                <TableRow className="border-t-2 border-primary">
                                    <TableCell colSpan={2} className="font-bold text-lg">Grand Total</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(data.grandTotal)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DialogContent className="h-[90vh] flex flex-col">
                    <BalanceSheetEditor accounts={accounts} onUpdate={onUpdate} closeDialog={() => setIsEditorOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function BalanceSheet() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [unpaidLiabilities, setUnpaidLiabilities] = useState<Liability[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [reimbursements, usersSnap] = await Promise.all([
                getUnpaidReimbursements(),
                getDocs(collection(db, "users"))
            ]);
            setUnpaidLiabilities(reimbursements);
            setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching financial data:", error);
        }
    };

    useEffect(() => {
        fetchData(); // Initial fetch
        // Listen for real-time updates on accounts
        const unsubscribe = onSnapshot(query(collection(db, "accounts"), orderBy("name")), (snapshot) => {
            const fetchedAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
            setAccounts(fetchedAccounts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }
    
    const data = (() => {
        const currentAssets = accounts.filter(a => a.group === 'currentAssets');
        const fixedAssets = accounts.filter(a => a.group === 'fixedAssets');
        const ownersEquity = accounts.filter(a => a.group === 'ownersEquity');
        const manualLiabilities = accounts.filter(a => a.group === 'currentLiabilities');

        const manualLiabilitiesTotal = manualLiabilities.reduce((sum, item) => sum + item.balance, 0);
        const unpaidReimbursementsTotal = unpaidLiabilities.reduce((sum, item) => sum + item.balance, 0);
        const allLiabilities = [...manualLiabilities, ...unpaidLiabilities];
        const liabilitiesTotal = manualLiabilitiesTotal + unpaidReimbursementsTotal;
        
        const currentAssetsTotal = currentAssets.reduce((sum, item) => sum + item.balance, 0);
        const fixedAssetsTotal = fixedAssets.reduce((sum, item) => sum + item.balance, 0);
        const ownersEquityTotal = ownersEquity.reduce((sum, item) => sum + item.balance, 0);
        
        return {
            currentAssets: { group: "Current Assets", accounts: currentAssets, total: currentAssetsTotal },
            currentLiabilities: { 
                group: "Current Liabilities",
                accounts: allLiabilities,
                total: liabilitiesTotal
            },
            fixedAssets: { group: "Fixed Assets", accounts: fixedAssets, total: fixedAssetsTotal },
            ownersEquity: { group: "Owner's Equity", accounts: ownersEquity, total: ownersEquityTotal },
            grandTotal: currentAssetsTotal + fixedAssetsTotal - liabilitiesTotal + ownersEquityTotal,
        };
    })();

    if (!data) {
        return <p>No data available to display balance sheet.</p>
    }

    return <BalanceSheetTable data={data} accounts={accounts} allUsers={allUsers} onUpdate={fetchData} />;
}
