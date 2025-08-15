
"use client"

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 items-start">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2">
                        <FormLabel>Account Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="balance" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Opening Balance</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="group" render={({ field }) => (
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
                )} />
                <Button type="submit" className="col-span-2" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Account
                </Button>
            </form>
        </Form>
    )
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

const ExportDialog = ({ onExport }: { onExport: (startDate: string, endDate: string) => void }) => {
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
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
                    <DialogDescription>Select date range for export</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Start Date</label>
                        <Input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">End Date</label>
                        <Input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onExport(startDate, endDate)}>
                        Export CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const BalanceSheetTable = ({ data, accounts, onUpdate }: { data: BalanceSheetData, accounts: Account[], onUpdate: () => void }) => {
    const sections = [
        { title: "Current Assets", data: data.currentAssets },
        { title: "Current Liabilities", data: data.currentLiabilities },
        { title: "Fixed Assets", data: data.fixedAssets },
        { title: "Owner's Equity", data: data.ownersEquity },
    ];
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer';
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const { toast } = useToast();

    const handleExport = async (startDate: string, endDate: string) => {
        try {
            const transactions = await getTransactionsForExport(startDate, endDate);
            
            // Create CSV content
            const csvHeaders = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance', 'Payee', 'Status'];
            const csvRows = transactions.map((t: any) => [
                t.date,
                t.type,
                t.category,
                `"${t.description}"`,
                t.amount,
                t.balance,
                t.payee || '',
                t.isReversed ? 'Reversed' : 'Active'
            ]);
            
            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.join(','))
                .join('\n');
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-data-${startDate}-to-${endDate}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            toast({ title: "Success", description: "Financial data exported successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to export data." });
        }
    };

    return (
        <div className="space-y-6">
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Balance Sheet</CardTitle>
                        <div className="flex gap-2">
                            <ExportDialog onExport={handleExport} />
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
                                    <TableHead className="font-bold">Asset Group</TableHead>
                                    <TableHead className="font-bold">Accounts</TableHead>
                                    <TableHead className="text-right font-bold">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sections.map(section => (
                                    <React.Fragment key={section.title}>
                                        <TableRow>
                                            <TableCell rowSpan={(section.data.accounts as any[]).length + 2} className="align-top font-semibold">{section.title}</TableCell>
                                        </TableRow>
                                        {(section.data.accounts as any[]).map((account, index) => (
                                            <TableRow key={account.name}>
                                                <TableCell>{account.name}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-bold">
                                             <TableCell>Total {section.title}</TableCell>
                                             <TableCell className="text-right font-mono">{formatCurrency(section.data.total)}</TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                                 <TableRow className="bg-primary/10 font-bold text-lg">
                                     <TableCell colSpan={2}>Grand Total</TableCell>
                                     <TableCell className="text-right font-mono">{formatCurrency(data.grandTotal)}</TableCell>
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
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const reimbursements = await getUnpaidReimbursements();
            setUnpaidLiabilities(reimbursements);
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

    return <BalanceSheetTable data={data} accounts={accounts} onUpdate={fetchData} />;
}
