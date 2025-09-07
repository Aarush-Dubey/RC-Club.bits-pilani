"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, FileText, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
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

// AUDIT-SAFE TYPES
interface TransactionLine {
    acctCode: string;
    debitMinor: number;
    creditMinor: number;
    description?: string;
}

interface Transaction {
    id: string;
    entryNumber: string;
    date: string;
    narration: string;
    lines: TransactionLine[];
    isReversed: boolean;
    reversalOf?: string; // ID of original transaction if this is a reversal
    reversalReason?: string;
    createdBy: string;
    createdAt: string;
    modifiedAt?: string;
}

interface LogbookProps {
    chartOfAccounts: ChartOfAccount[];
    transactions: Transaction[];
    onUpdate: () => void;
}

const formatCurrency = (minorAmount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(minorAmount / 100);

// AUDIT VALIDATION FUNCTIONS
const validateTransactionLine = (line: TransactionLine): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // CRITICAL: Each line must have EITHER debit OR credit, never both
    if (line.debitMinor > 0 && line.creditMinor > 0) {
        errors.push('Line cannot have both debit and credit amounts');
    }
    
    // Must have at least one non-zero amount
    if (line.debitMinor <= 0 && line.creditMinor <= 0) {
        errors.push('Line must have either debit or credit amount');
    }
    
    // Negative amounts not allowed
    if (line.debitMinor < 0 || line.creditMinor < 0) {
        errors.push('Negative amounts not allowed');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateTransaction = (transaction: Transaction): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validate each line
    const lineValidations = transaction.lines.map(validateTransactionLine);
    lineValidations.forEach((validation, index) => {
        if (!validation.isValid) {
            errors.push(`Line ${index + 1}: ${validation.errors.join(', ')}`);
        }
    });
    
    // CRITICAL: Total debits must equal total credits
    const totalDebits = transaction.lines.reduce((sum, line) => sum + line.debitMinor, 0);
    const totalCredits = transaction.lines.reduce((sum, line) => sum + line.creditMinor, 0);
    
    if (totalDebits !== totalCredits) {
        errors.push(`Transaction not balanced: Debits ₹${formatCurrency(totalDebits)} ≠ Credits ₹${formatCurrency(totalCredits)}`);
    }
    
    // Must have at least 2 lines (double-entry)
    if (transaction.lines.length < 2) {
        errors.push('Transaction must have at least 2 lines for double-entry');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const TransactionValidationWarning = ({ transaction }: { transaction: Transaction }) => {
    const validation = validateTransaction(transaction);
    
    if (validation.isValid) return null;
    
    return (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">AUDIT WARNING: {validation.errors.join('; ')}</span>
        </div>
    );
};

const ReverseTransactionDialog = ({ transaction, onSuccess }: { transaction: Transaction, onSuccess: () => void }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    
    // AUDIT CHECK: Cannot reverse already reversed transactions
    const canReverse = !transaction.isReversed && !transaction.reversalOf;
    
    const handleReverse = async () => {
        if (!reason.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Please provide a reason for reversal." });
            return;
        }
        if (!currentUser) return;
        
        // Additional validation
        const validation = validateTransaction(transaction);
        if (!validation.isValid) {
            toast({ 
                variant: "destructive", 
                title: "Cannot Reverse Invalid Transaction", 
                description: validation.errors.join('; ') 
            });
            return;
        }
        
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
                <Button variant="ghost" size="icon" disabled={!canReverse || isLoading}>
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reverse Transaction #{transaction.entryNumber}</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will create a new entry to reverse this transaction. This action creates an audit trail and cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <TransactionValidationWarning transaction={transaction} />
                
                <div className="py-4">
                    <Label htmlFor="reversal-reason">Reason for reversal (required for audit):</Label>
                    <Textarea
                        id="reversal-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Incorrect amount entered, duplicate transaction, wrong account selected"
                        className="mt-2"
                        required
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
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer' || currentUser?.role === 'admin';

    const handleFormSubmit = () => {
        onUpdate();
        setIsFormOpen(false);
    };

    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction Logbook</CardTitle>
                        <CardDescription>Immutable ledger of all financial activities with audit trail.</CardDescription>
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
                                <TableHead>Created By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Details</TableHead>
                                {isTreasurer && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => {
                                const validation = validateTransaction(tx);
                                return (
                                    <React.Fragment key={tx.id}>
                                        <TableRow className={tx.isReversed ? 'bg-red-50' : (!validation.isValid ? 'bg-yellow-50' : '')}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{tx.entryNumber}</span>
                                                    {!validation.isValid && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>{tx.date ? format(new Date(tx.date), "MMM d, yyyy") : 'N/A'}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {tx.narration}
                                                {tx.reversalReason && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Reversal: {tx.reversalReason}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{tx.createdBy}</TableCell>
                                            <TableCell>
                                                {tx.isReversed && <Badge variant="destructive">Reversed</Badge>}
                                                {tx.reversalOf && <Badge variant="secondary">Reversal Entry</Badge>}
                                                {!validation.isValid && <Badge variant="outline" className="text-yellow-600">Invalid</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => setSelectedTxId(selectedTxId === tx.id ? null : tx.id)}>
                                                    <FileText className="h-4 w-4"/>
                                                </Button>
                                            </TableCell>
                                            {isTreasurer && (
                                                <TableCell>
                                                    {!tx.isReversed && !tx.reversalOf && (
                                                        <ReverseTransactionDialog transaction={tx} onSuccess={onUpdate} />
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                        {selectedTxId === tx.id && (
                                            <TableRow>
                                                <TableCell colSpan={isTreasurer ? 7 : 6} className="p-0">
                                                    <div className="p-4 bg-muted/50">
                                                        <div className="mb-4">
                                                            <TransactionValidationWarning transaction={tx} />
                                                        </div>
                                                        
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
                                                                {tx.lines.map((line: TransactionLine, index: number) => {
                                                                    const account = chartOfAccounts.find(a => a.id === line.acctCode);
                                                                    const lineValidation = validateTransactionLine(line);
                                                                    
                                                                    return (
                                                                        <TableRow key={index} className={!lineValidation.isValid ? 'bg-red-50' : ''}>
                                                                            <TableCell>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span>{account?.name || line.acctCode}</span>
                                                                                    {!lineValidation.isValid && (
                                                                                        <AlertTriangle className="h-3 w-3 text-red-600" />
                                                                                    )}
                                                                                </div>
                                                                                {line.description && (
                                                                                    <div className="text-xs text-gray-500">{line.description}</div>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-mono">
                                                                                {line.debitMinor > 0 ? formatCurrency(line.debitMinor) : '-'}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-mono">
                                                                                {line.creditMinor > 0 ? formatCurrency(line.creditMinor) : '-'}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                                <TableRow className="font-semibold border-t-2">
                                                                    <TableCell>TOTALS</TableCell>
                                                                    <TableCell className="text-right font-mono">
                                                                        {formatCurrency(tx.lines.reduce((sum, line) => sum + line.debitMinor, 0))}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono">
                                                                        {formatCurrency(tx.lines.reduce((sum, line) => sum + line.creditMinor, 0))}
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                        
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            Created: {format(new Date(tx.createdAt), "PPpp")} by {tx.createdBy}
                                                            {tx.modifiedAt && ` • Modified: ${format(new Date(tx.modifiedAt), "PPpp")}`}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <DialogContent className="w-full sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Logbook Entry</DialogTitle>
                    <DialogDescription>Create a new double-entry transaction. Ensure debits equal credits for audit compliance.</DialogDescription>
                </DialogHeader>
                <NewTransactionForm chartOfAccounts={chartOfAccounts} onFormSubmit={handleFormSubmit} />
            </DialogContent>
        </Dialog>
    )
}
