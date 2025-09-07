
"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { NewTransactionForm } from './new-transaction-form';
import type { ChartOfAccount } from './actions';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { reverseTransaction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface LogbookProps {
    chartOfAccounts: ChartOfAccount[];
    transactions: any[];
    onUpdate: () => void;
}

const formatCurrency = (minorAmount: number) => {
    return (minorAmount / 100).toFixed(2);
}

const ReverseTransactionDialog = ({ transaction, onSuccess }: { transaction: any, onSuccess: () => void }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    const handleReverse = async () => {
        if (!reason.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Please provide a reason for reversal." });
            return;
        }
        if (!currentUser) return;
        setIsLoading(true);
        try {
            await reverseTransaction(transaction.id, currentUser.uid, reason);
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
                    <AlertDialogTitle>Reverse Transaction #{transaction.entryNumber}</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will create a new entry to reverse this transaction. Provide a reason for the audit log.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="reversal-reason">Reason for reversal:</Label>
                    <Textarea
                        id="reversal-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Incorrect amount entered"
                        className="mt-2"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReverse} disabled={isLoading || !reason.trim()}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Reversal
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default function Logbook({ chartOfAccounts, transactions, onUpdate }: LogbookProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer' || currentUser?.role === 'admin';


    const handleFormSubmit = () => {
        onUpdate();
        setIsFormOpen(false);
    }
    
    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction Logbook</CardTitle>
                        <CardDescription>Immutable ledger of all financial activities.</CardDescription>
                    </div>
                     {isTreasurer && (
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Entry
                            </Button>
                        </DialogTrigger>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entry #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Narration</TableHead>
                                <TableHead>Details</TableHead>
                                {isTreasurer && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <React.Fragment key={tx.id}>
                                <TableRow className={tx.isReversed ? 'bg-muted/30' : ''}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                           <span>{tx.entryNumber}</span>
                                           {tx.isReversed && <Badge variant="destructive">Reversed</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{tx.date ? format(new Date(tx.date), "MMM d, yyyy") : 'N/A'}</TableCell>
                                    <TableCell className="max-w-xs truncate">{tx.narration}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}>
                                            <FileText className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                     <TableCell>
                                        {isTreasurer && !tx.isReversed && (
                                            <ReverseTransactionDialog transaction={tx} onSuccess={onUpdate} />
                                        )}
                                    </TableCell>
                                </TableRow>
                                 {selectedTx?.id === tx.id && (
                                     <TableRow>
                                         <TableCell colSpan={5} className="p-0">
                                             <div className="p-4 bg-muted/50">
                                                  <h4 className="font-semibold mb-2">Transaction Lines</h4>
                                                 <Table>
                                                     <TableHeader>
                                                         <TableRow>
                                                             <TableHead>Account</TableHead>
                                                             <TableHead className="text-right">Debit</TableHead>
                                                             <TableHead className="text-right">Credit</TableHead>
                                                         </TableRow>
                                                     </TableHeader>
                                                     <TableBody>
                                                         {tx.lines.map((line: any, index: number) => {
                                                             const account = chartOfAccounts.find(a => a.id === line.acctCode);
                                                             return (
                                                                <TableRow key={index}>
                                                                    <TableCell>{account?.name || line.acctCode}</TableCell>
                                                                    <TableCell className="text-right font-mono">{line.debitMinor > 0 ? formatCurrency(line.debitMinor) : '-'}</TableCell>
                                                                    <TableCell className="text-right font-mono">{line.creditMinor > 0 ? formatCurrency(line.creditMinor) : '-'}</TableCell>
                                                                </TableRow>
                                                             )
                                                         })}
                                                     </TableBody>
                                                 </Table>
                                             </div>
                                         </TableCell>
                                     </TableRow>
                                 )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>New Logbook Entry</DialogTitle>
                    <DialogDescription>Create a new double-entry transaction. Ensure debits equal credits.</DialogDescription>
                </DialogHeader>
                <NewTransactionForm chartOfAccounts={chartOfAccounts} onFormSubmit={handleFormSubmit} />
            </DialogContent>
        </Dialog>
    )
}
