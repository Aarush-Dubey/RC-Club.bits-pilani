
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import Image from "next/image"
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Plus, Trash2, ArrowUpDown, RotateCcw, Eye, ArrowUp, ArrowDown, Upload, Link as LinkIcon, Download } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, getTransactionsForExport, reverseTransaction } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { format, subMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { upload } from "@imagekit/next"
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import * as XLSX from 'xlsx';


interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    date: string;
    balance: number;
    payee?: string;
    notes?: string;
    proofUrl?: string;
    isReversed: boolean;
    isReversal?: boolean;
    originalTransactionId?: string;
    reimbursementId?: string;
    createdAt: any;
    createdBy: string;
    isDeleted?: boolean;
}

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

const transactionFormSchema = z.object({
    type: z.enum(['income', 'expense'], { required_error: "Please select transaction type." }),
    category: z.string().min(2, "Category is required."),
    description: z.string().min(3, "Description is required."),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
    payee: z.string().optional(),
    notes: z.string().optional(),
    proofImage: z.instanceof(File).optional(),
});
type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const TransactionForm = ({
    transaction,
    onSuccess,
    onCancel
}: {
    transaction?: Transaction | null,
    onSuccess: () => void,
    onCancel: () => void
}) => {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [preview, setPreview] = useState<string | null>(null);
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: transaction ? {
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            amount: transaction.amount,
            date: transaction.date,
            payee: transaction.payee || '',
            notes: transaction.notes || '',
        } : {
            type: 'expense',
            category: '',
            description: '',
            amount: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
            payee: '',
            notes: '',
        }
    });
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.type.startsWith('image/')) {
                form.setValue('proofImage', file);
                setPreview(URL.createObjectURL(file))
            } else {
                toast({ variant: "destructive", title: "Invalid File", description: "Please select a valid image file." });
                setPreview(null)
            }
        }
    }
    
    const authenticator = async () => {
        try {
          const response = await fetch('/api/upload-auth');
          if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
          const data = await response.json();
          return { signature: data.signature, expire: data.expire, token: data.token };
        } catch (error) {
          throw new Error("Authentication request failed. Check your server logs.");
        }
    };

    const onSubmit: SubmitHandler<TransactionFormValues> = async (values) => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Error", description: "Not authenticated" });
            return;
        }

        try {
            if (transaction) {
                toast({ 
                    variant: "destructive", 
                    title: "Cannot Edit", 
                    description: "Transactions cannot be edited. Please create a reversing entry instead." 
                });
                return;
            } else {
                let proofUrl: string | undefined = undefined;
                if (values.proofImage) {
                    const authParams = await authenticator();
                    const uploadResponse = await upload({
                        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
                        ...authParams,
                        file: values.proofImage,
                        fileName: values.proofImage.name,
                    });
                    proofUrl = uploadResponse.url;
                }
                
                await addTransaction({ ...values, proofUrl, createdBy: currentUser.uid });
                toast({ title: "Success", description: "Transaction added to ledger." });
            }
            onSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col h-full">
                <ScrollArea className="flex-grow pr-6 -mr-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="income">
                                                <div className="flex items-center gap-2">
                                                    <ArrowUp className="h-4 w-4 text-green-600" />
                                                    Income
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="expense">
                                                <div className="flex items-center gap-2">
                                                    <ArrowDown className="h-4 w-4 text-red-600" />
                                                    Expense
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Input {...field} placeholder="Brief description of transaction" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g., Events, Equipment, Sponsorship" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (₹)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="payee" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payee/Source</FormLabel>
                                <FormControl><Input {...field} placeholder="Who paid or received money" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField
                            control={form.control}
                            name="proofImage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proof of Purchase (Optional)</FormLabel>
                                    <FormControl>
                                        <div className="mt-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="proof-upload"
                                            />
                                            <label
                                                htmlFor="proof-upload"
                                                className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
                                            >
                                                {preview ? (
                                                <Image
                                                    src={preview}
                                                    alt="Proof Preview"
                                                    width={200}
                                                    height={160}
                                                    className="h-full w-full object-contain rounded-md p-1"
                                                />
                                                ) : (
                                                <div className="text-center text-muted-foreground">
                                                    <Upload className="mx-auto h-8 w-8" />
                                                    <p className="mt-2 text-sm">Click to select a receipt</p>
                                                </div>
                                                )}
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl><Textarea {...field} placeholder="Additional details" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4 border-t gap-2 sm:justify-between flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {transaction ? 'Update Transaction' : 'Add Transaction'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

const ReverseTransactionDialog = ({ 
    transaction, 
    onSuccess 
}: { 
    transaction: Transaction, 
    onSuccess: () => void 
}) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleReverse = async () => {
        if (!reason.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Please provide a reason for reversal." });
            return;
        }

        setIsLoading(true);
        try {
            await reverseTransaction(transaction.id, reason);
            toast({ title: "Success", description: "Transaction reversed successfully." });
            onSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={transaction.isReversed || !!transaction.reimbursementId}>
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reverse Transaction</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will create a reversing entry for: <strong>{transaction.description}</strong> (₹{formatCurrency(transaction.amount)})
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <label className="text-sm font-medium">Reason for reversal:</label>
                    <Textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain why this transaction is being reversed"
                        className="mt-2"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReverse} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reverse Transaction
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const TransactionLogbook = ({ 
    transactions,
    allUsers,
    onUpdate 
}: { 
    transactions: Transaction[], 
    allUsers: any[],
    onUpdate: () => void 
}) => {
    const [isAddingOpen, setIsAddingOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer' || currentUser?.role === 'admin' || currentUser?.role === 'coordinator';

    const filteredTransactions = transactions
        .filter(t => filterType === 'all' || t.type === filterType)
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Transactions</SelectItem>
                            <SelectItem value="income">Income Only</SelectItem>
                            <SelectItem value="expense">Expenses Only</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                    </Button>
                </div>
                
                <div className="flex items-center gap-2">
                    {isTreasurer && (
                        <Button onClick={() => setIsAddingOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Transaction
                        </Button>
                    )}
                </div>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead>Status</TableHead>
                                {isTreasurer && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((transaction) => (
                                <TableRow 
                                    key={transaction.id}
                                    className={cn(
                                        "cursor-pointer hover:bg-muted/50",
                                        transaction.isReversed && "opacity-60",
                                        transaction.isReversal && "bg-yellow-50 dark:bg-yellow-900/10"
                                    )}
                                    onClick={() => isTreasurer && setSelectedTransaction(transaction)}
                                >
                                    <TableCell className="whitespace-nowrap">{transaction.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                                            {transaction.type === 'income' ? (
                                                <ArrowUp className="mr-1 h-3 w-3" />
                                            ) : (
                                                <ArrowDown className="mr-1 h-3 w-3" />
                                            )}
                                            {transaction.type.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{transaction.category}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-mono",
                                        transaction.type === 'income' ? "text-green-600" : "text-red-600"
                                    )}>
                                        {transaction.type === 'income' ? '+' : '-'}₹{formatCurrency(transaction.amount)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">₹{formatCurrency(transaction.balance)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {transaction.isReversed && (
                                                <Badge variant="destructive">Reversed</Badge>
                                            )}
                                            {transaction.isReversal && (
                                                <Badge variant="secondary">Reversal</Badge>
                                            )}
                                            {transaction.proofUrl && (
                                                <Badge variant="outline">
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    Proof
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    {isTreasurer && (
                                        <TableCell>
                                            <ReverseTransactionDialog 
                                                transaction={transaction}
                                                onSuccess={onUpdate}
                                            />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Transaction Dialog */}
            <Dialog open={isAddingOpen} onOpenChange={setIsAddingOpen}>
                <DialogContent className="max-w-2xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Add New Transaction</DialogTitle>
                        <DialogDescription>
                            Add a new income or expense transaction to the ledger.
                        </DialogDescription>
                    </DialogHeader>
                    <TransactionForm
                        onSuccess={() => {
                            onUpdate();
                            setIsAddingOpen(false);
                        }}
                        onCancel={() => setIsAddingOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Transaction Details Dialog */}
            <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
                <DialogContent className="sm:max-w-md">
                    {selectedTransaction && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Transaction Details</DialogTitle>
                                <DialogDescription>{selectedTransaction.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="flex justify-between"><span>Amount</span><span className="font-mono">₹{formatCurrency(selectedTransaction.amount)}</span></div>
                                <div className="flex justify-between"><span>Date</span><span>{selectedTransaction.date}</span></div>
                                <div className="flex justify-between"><span>Payee/Source</span><span>{allUsers.find(u => u.id === selectedTransaction.payee)?.name || selectedTransaction.payee || 'N/A'}</span></div>
                                <div className="flex justify-between"><span>Category</span><Badge variant="outline">{selectedTransaction.category}</Badge></div>
                                <div className="flex justify-between"><span>Created By</span><span>{allUsers.find(u => u.id === selectedTransaction.createdBy)?.name || 'Unknown'}</span></div>
                                 {selectedTransaction.reimbursementId && (
                                    <Link href={`/dashboard/reimbursements?id=${selectedTransaction.reimbursementId}`} className="text-sm text-primary hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <LinkIcon className="h-4 w-4" />
                                        View Associated Reimbursement
                                    </Link>
                                )}
                                <div className="space-y-1">
                                    <Label>Notes</Label>
                                    <p className="text-sm text-muted-foreground">{selectedTransaction.notes || 'No notes provided.'}</p>
                                </div>
                                {selectedTransaction.proofUrl && (
                                    <div className="space-y-2">
                                        <Label>Proof</Label>
                                        <a href={selectedTransaction.proofUrl} target="_blank" rel="noopener noreferrer">
                                            <Image 
                                                src={selectedTransaction.proofUrl} 
                                                alt="Proof of transaction" 
                                                width={400} 
                                                height={400} 
                                                className="rounded-md border object-contain w-full h-auto"
                                            />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function Logbook() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const usersSnap = await getDocs(collection(db, "users"));
            setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching users: ", error);
        }
    }, []);

    useEffect(() => {
        const transactionsQuery = query(
            collection(db, "transactions"), 
            orderBy("date", "desc"),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribeTransactions = onSnapshot(transactionsQuery, async (snapshot) => {
            setLoading(true);
            const newTransactions = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            } as Transaction));
            
            setTransactions(newTransactions.filter(t => !t.isDeleted));
            await fetchData(); // Fetch users every time transactions update
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
            setLoading(false);
        });

        return () => {
            unsubscribeTransactions();
        };
    }, [fetchData]);

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Ledger</CardTitle>
                    <CardDescription>
                        Immutable record of all financial transactions. Click on an entry for details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionLogbook transactions={transactions} allUsers={allUsers} onUpdate={fetchData} />
                </CardContent>
            </Card>
        </div>
    );
}
