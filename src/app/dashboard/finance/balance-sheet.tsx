
"use client"

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, HandCoins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartOfAccount } from "./actions";
import { getPayableSummary } from "../reimbursements/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BalanceSheetProps {
    chartOfAccounts: ChartOfAccount[];
    transactions: any[];
}

const formatCurrency = (minorAmount: number) => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 2 
    }).format(minorAmount / 100);
}

const calculateBalances = (accounts: ChartOfAccount[], transactions: any[]) => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => {
        balances[acc.id] = 0;
    });

    const validTransactions = transactions.filter(tx => !tx.isReversed);
    
    validTransactions.forEach(tx => {
        const totalDebits = tx.lines.reduce((sum: number, line: any) => sum + (line.debitMinor || 0), 0);
        const totalCredits = tx.lines.reduce((sum: number, line: any) => sum + (line.creditMinor || 0), 0);
        
        if (Math.abs(totalDebits - totalCredits) > 1) { // Allow for rounding differences
            console.warn(`Unbalanced transaction ${tx.entryNumber}: Debits ${totalDebits} ≠ Credits ${totalCredits}`);
            return;
        }
        
        tx.lines.forEach((line: any) => {
            const account = accounts.find(a => a.id === line.acctCode);
            if (!account) return;
            
            const debit = line.debitMinor || 0;
            const credit = line.creditMinor || 0;
            
            balances[line.acctCode] = (balances[line.acctCode] || 0) + (account.isDebitNormal ? (debit - credit) : (credit - debit));
        });
    });

    return balances;
};

const PayableSummaryDialog = () => {
    const [summary, setSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleOpen = async () => {
        setLoading(true);
        try {
            const payableSummary = await getPayableSummary();
            setSummary(payableSummary);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Dialog onOpenChange={(open) => open && handleOpen()}>
            <DialogTrigger asChild>
                <button className="text-left w-full hover:underline">Member Reimbursements Payable</button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reimbursements Payable Summary</DialogTitle>
                    <DialogDescription>A breakdown of approved reimbursements waiting to be paid.</DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="text-right">Amount Owed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.length > 0 ? summary.map(item => (
                                <TableRow key={item.userId}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(item.totalOwed * 100)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center h-24">No pending payments.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default function BalanceSheet({ chartOfAccounts, transactions }: BalanceSheetProps) {
    const balances = calculateBalances(chartOfAccounts, transactions);

    const generateSection = (group: string) => {
        const accounts = chartOfAccounts.filter(acc => acc.group === group);
        const accountsWithBalances = accounts
            .map(acc => ({ 
                ...acc, 
                balance: balances[acc.id] || 0,
            }))
            .filter(acc => acc.balance !== 0);
            
        const total = accountsWithBalances.reduce((sum, acc) => sum + acc.balance, 0);
        return { accounts: accountsWithBalances, total };
    };

    const sections = {
        'Current Assets': generateSection('Current Assets'),
        'Fixed Assets': generateSection('Fixed Assets'),
        'Current Liabilities': generateSection('Current Liabilities'),
        'Equity': generateSection('Equity'),
    };

    const totalAssets = sections['Current Assets'].total + sections['Fixed Assets'].total;
    const totalLiabilities = sections['Current Liabilities'].total;
    const totalEquity = sections['Equity'].total;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>A snapshot of the club's financial position as of today.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Account</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* ASSETS */}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Assets</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow className="font-semibold">
                            <TableCell className="pl-6">Current Assets</TableCell>
                            <TableCell className="text-right">{formatCurrency(sections['Current Assets'].total)}</TableCell>
                        </TableRow>
                        {sections['Current Assets'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-12">{acc.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="font-semibold">
                            <TableCell className="pl-6">Fixed Assets</TableCell>
                            <TableCell className="text-right">{formatCurrency(sections['Fixed Assets'].total)}</TableCell>
                        </TableRow>
                        {sections['Fixed Assets'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-12">{acc.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="font-bold border-y-2 border-primary/50">
                            <TableCell>Total Assets</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
                        </TableRow>

                        {/* SPACER */}
                        <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                      
                        {/* LIABILITIES & EQUITY */}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Liabilities & Equity</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                         <TableRow className="font-semibold">
                            <TableCell className="pl-6">Current Liabilities</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalLiabilities)}</TableCell>
                        </TableRow>
                        {sections['Current Liabilities'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-12">
                                     {acc.id === '2020' ? <PayableSummaryDialog /> : acc.name}
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="font-semibold">
                            <TableCell className="pl-6">Equity</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalEquity)}</TableCell>
                        </TableRow>
                        {sections['Equity'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-12">{acc.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="font-bold border-y-2 border-primary/50">
                            <TableCell>Total Liabilities & Equity</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalLiabilitiesAndEquity)}</TableCell>
                        </TableRow>

                        {/* VERIFICATION */}
                        <TableRow className="border-none">
                            <TableCell colSpan={2} className="pt-6">
                                <div className={cn(
                                    "flex items-center justify-center gap-2 rounded-lg p-3 text-sm",
                                    isBalanced ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                )}>
                                    {isBalanced ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                    <span>
                                        Assets ({formatCurrency(totalAssets)}) = Liabilities + Equity ({formatCurrency(totalLiabilitiesAndEquity)})
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
