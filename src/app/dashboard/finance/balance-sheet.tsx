
"use client"

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addAccount, deleteAccount, updateAccount } from "./actions";

interface Account {
    id: string;
    name: string;
    group: 'currentAssets' | 'fixedAssets' | 'ownersEquity';
    balance: number;
}

interface AssetGroup {
    group: string;
    accounts: Account[];
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
        const userName = users[r.submittedById] || 'Unknown User';
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
  group: z.enum(['currentAssets', 'fixedAssets', 'ownersEquity'], { required_error: "Please select an asset group." }),
  balance: z.coerce.number().min(0, "Balance must be a positive number."),
});
type AccountFormValues = z.infer<typeof accountFormSchema>;

const EditAccountForm = ({ account, onUpdate }: { account: Account, onUpdate: () => void }) => {
    const [balance, setBalance] = useState(account.balance);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            await updateAccount(account.id, balance);
            toast({ title: "Success", description: "Account balance updated." });
            onUpdate();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex items-center gap-2">
            <Input type="number" value={balance} onChange={e => setBalance(Number(e.target.value))} className="h-8" />
            <Button onClick={handleUpdate} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
        </div>
    );
};

const AddAccountForm = ({ onAdd }: { onAdd: () => void }) => {
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

const BalanceSheetEditor = ({ accounts, onUpdate }: { accounts: Account[], onUpdate: () => void }) => {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();
    
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
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Manage Accounts</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {accounts.map(acc => (
                         <div key={acc.id} className="flex items-center justify-between gap-4">
                            <span className="font-medium flex-1">{acc.name}</span>
                            <div className="flex-1">
                                <EditAccountForm account={acc} onUpdate={onUpdate} />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(acc.id)} disabled={!!isDeleting}>
                                {isDeleting === acc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                         </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Add New Account</CardTitle></CardHeader>
                <CardContent>
                    <AddAccountForm onAdd={onUpdate} />
                </CardContent>
            </Card>
        </div>
    )
}


const BalanceSheetTable = ({ data, accounts, onUpdate }: { data: BalanceSheetData, accounts: Account[], onUpdate: () => void }) => {
    const sections = [
        { title: "Current Assets", data: data.currentAssets },
        { title: "Current Liabilities", data: data.currentLiabilities },
        { title: "Fixed Assets", data: data.fixedAssets },
        { title: "Owner's Equity", data: data.ownersEquity },
    ];
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer';

    return (
        <Dialog>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Balance Sheet</CardTitle>
                     {isTreasurer && (
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </DialogTrigger>
                    )}
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Balance Sheet</DialogTitle>
                    <DialogDescription>Add, remove, or update accounts.</DialogDescription>
                </DialogHeader>
                <BalanceSheetEditor accounts={accounts} onUpdate={onUpdate} />
            </DialogContent>
        </Dialog>
    )
}


export default function BalanceSheet() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [unpaidLiabilities, setUnpaidLiabilities] = useState<Liability[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const reimbursements = await getUnpaidReimbursements();
        setUnpaidLiabilities(reimbursements);
    };

    useEffect(() => {
        fetchData(); // Initial fetch
        // Listen for real-time updates on accounts
        const unsubscribe = onSnapshot(collection(db, "accounts"), (snapshot) => {
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
        
        const liabilitiesTotal = unpaidLiabilities.reduce((sum, item) => sum + item.balance, 0);
        const currentAssetsTotal = currentAssets.reduce((sum, item) => sum + item.balance, 0);
        const fixedAssetsTotal = fixedAssets.reduce((sum, item) => sum + item.balance, 0);
        const ownersEquityTotal = ownersEquity.reduce((sum, item) => sum + item.balance, 0);
        
        return {
            currentAssets: { group: "Current Assets", accounts: currentAssets, total: currentAssetsTotal },
            currentLiabilities: { 
                group: "Current Liabilities",
                accounts: unpaidLiabilities,
                total: liabilitiesTotal
            },
            fixedAssets: { group: "Fixed Assets", accounts: fixedAssets, total: fixedAssetsTotal },
            ownersEquity: { group: "Owner's Equity", accounts: ownersEquity, total: ownersEquityTotal },
            grandTotal: currentAssetsTotal + fixedAssetsTotal - liabilitiesTotal + ownersEquityTotal
        };
    })();


    if (!data) {
        return <p>No data available to display balance sheet.</p>
    }

    return <BalanceSheetTable data={data} accounts={accounts} onUpdate={fetchData} />;
}
