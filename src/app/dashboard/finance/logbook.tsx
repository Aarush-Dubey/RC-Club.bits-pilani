"use client"

import React, { useState, useEffect } from 'react';
import Image from "next/image"
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Plus, Trash2, ArrowUpDown, RotateCcw, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, reverseTransaction } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

async function getRelatedFinanceData() {
    const reimbursementsSnap = await getDocs(collection(db, "reimbursements"));
    const reimbursements = reimbursementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const newItemsSnap = await getDocs(collection(db, "new_item_requests"));
    const newItems = newItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { reimbursements, users, newItems };
}

const transactionFormSchema = z.object({
    type: z.enum(['income', 'expense'], { required_error: "Please select transaction type." }),
    category: z.string().min(2, "Category is required."),
    description: z.string().min(3, "Description is required."),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
    payee: z.string().optional(),
    notes: z.string().optional(),
    proofUrl: z.string().url().optional().or(z.literal('')),
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
            proofUrl: transaction.proofUrl || '',
        } : {
            type: 'expense',
            category: '',
            description: '',
            amount: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
            payee: '',
            notes: '',
            proofUrl: '',
        }
    });

    const onSubmit: SubmitHandler<TransactionFormValues> = async (values) => {
        try {
            if (transaction) {
                toast({ 
                    variant: "destructive", 
                    title: "Cannot Edit", 
                    description: "Transactions cannot be edited. Please create a reversing entry instead." 
                });
                return;
            } else {
                await addTransaction(values);
                toast({ title: "Success", description: "Transaction added to ledger." });
            }
            onSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <FormField control={form.control} name="proofUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Proof URL (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="Link to receipt or proof" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Additional details" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <DialogFooter className="pt-4 border-t gap-2 sm:justify-between">
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
                <Button variant="ghost" size="icon" disabled={transaction.isReversed}>
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
    onUpdate 
}: { 
    transactions: Transaction[], 
    onUpdate: () => void 
}) => {
    const [isAddingOpen, setIsAddingOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer';

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
                
                {isTreasurer && (
                    <Button onClick={() => setIsAddingOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                    </Button>
                )}
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
                                        transaction.reimbursementId && "cursor-pointer hover:bg-muted/50",
                                        transaction.isReversed && "opacity-60",
                                        transaction.isReversal && "bg-yellow-50 dark:bg-yellow-900/10"
                                    )}
                                    onClick={() => transaction.reimbursementId && setSelectedTransaction(transaction)}
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
                <DialogContent className="max-w-2xl">
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
        </div>
    );
};

export default function Logbook() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [allReimbursements, setAllReimbursements] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
         getRelatedFinanceData().then(({ reimbursements, users, newItems }) => {
            setAllReimbursements(reimbursements);
            setAllUsers(users);
            setAllItems(newItems);
        }).catch(error => {
            console.error("Error fetching related data: ", error);
        });
    }

    useEffect(() => {
        fetchData();

        // Listen to both collections for backward compatibility
        const transactionsQuery = query(
            collection(db, "transactions"), 
            where("isDeleted", "!=", true),
            orderBy("date", "desc")
        );
        
        const legacyLogbookQuery = query(
            collection(db, "logbook"), 
            orderBy("date", "desc")
        );

        const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const newTransactions = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            } as Transaction));
            
            setTransactions(newTransactions);
            setLoading(false);
        });

        // Also listen to legacy logbook for backward compatibility
        const unsubscribeLegacy = onSnapshot(legacyLogbookQuery, (snapshot) => {
            const legacyTransactions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: data.debit ? 'income' as const : 'expense' as const,
                    category: data.assetGroup || 'Legacy',
                    description: data.description,
                    amount: data.debit || data.credit || 0,
                    date: data.date,
                    balance: data.balance,
                    payee: data.account,
                    isReversed: false,
                    createdBy: 'legacy',
                    reimbursementId: data.reimbursementId
                } as Transaction;
            });
            
            // Merge with new transactions (avoid duplicates)
            setTransactions(prev => {
                const existingIds = new Set(prev.map(t => t.id));
                const newLegacy = legacyTransactions.filter(t => !existingIds.has(t.id));
                return [...prev, ...newLegacy].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
        });

        return () => {
            unsubscribeTransactions();
            unsubscribeLegacy();
        };
    }, []);

    const selectedReimbursement = selectedTransaction?.reimbursementId
        ? allReimbursements.find(r => r.id === selectedTransaction.reimbursementId)
        : null;

    const selectedProcurementItem = selectedReimbursement?.newItemRequestId
        ? allItems.find(item => item.id === selectedReimbursement.newItemRequestId)
        : null;
    
    const procurementRequester = selectedProcurementItem
        ? allUsers.find(u => u.id === selectedProcurementItem.requestedById)
        : null;

    const procurementApprover = selectedProcurementItem
        ? allUsers.find(u => u.id === selectedProcurementItem.approvedById)
        : null;

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
                        Immutable record of all financial transactions. Click on reimbursement entries for details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionLogbook transactions={transactions} onUpdate={fetchData} />
                </CardContent>
            </Card>

            {/* Reimbursement Details Dialog */}
            <Dialog open={!!selectedReimbursement} onOpenChange={(isOpen) => !isOpen && setSelectedTransaction(null)}>
                {selectedReimbursement && (
                    <DialogContent className="sm:max-w-sm">
                         <DialogHeader>
                            <DialogTitle>Reimbursement Details</DialogTitle>
                            <p className="text-2xl font-bold font-mono pt-2">₹{selectedReimbursement.amount.toFixed(2)}</p>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] -mx-6">
                            <div className="px-6 space-y-4">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Submitted by: </span>
                                    <span className="font-medium">{allUsers.find((u: any) => u.id === selectedReimbursement.submittedById)?.name}</span>
                                </div>

                                {selectedProcurementItem && (
                                    <Card className="bg-muted/50">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base">Associated Procurement Request</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 text-sm space-y-2">
                                        <p><span className="font-medium text-muted-foreground">Item:</span> {selectedProcurementItem.itemName} (x{selectedProcurementItem.quantity})</p>
                                        <p><span className="font-medium text-muted-foreground">Justification:</span> {selectedProcurementItem.justification}</p>
                                        <p><span className="font-medium text-muted-foreground">Requested by:</span> {procurementRequester?.name || 'N/A'}</p>
                                        <p><span className="font-medium text-muted-foreground">Approved by:</span> {procurementApprover?.name || 'N/A'}</p>
                                    </CardContent>
                                    </Card>
                                )}
                                
                                {!selectedProcurementItem && (
                                    <div>
                                        <h4 className="font-medium mb-1 text-sm text-muted-foreground">Notes/Reason</h4>
                                        <p className="text-sm">{selectedReimbursement.notes || 'No notes provided.'}</p>
                                    </div>
                                )}

                                <div>
                                    <h4 className="font-medium mb-1 text-sm text-muted-foreground">Receipt</h4>
                                    {selectedReimbursement.proofImageUrls?.[0] ? (
                                    <a href={selectedReimbursement.proofImageUrls[0]} target="_blank" rel="noopener noreferrer">
                                        <Image 
                                        src={selectedReimbursement.proofImageUrls[0]}
                                        alt="Receipt"
                                        width={400}
                                        height={400}
                                        className="w-full h-auto rounded-md border object-contain"
                                        />
                                    </a>
                                    ) : (
                                    <p className="text-sm text-muted-foreground">No receipt image uploaded.</p>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
