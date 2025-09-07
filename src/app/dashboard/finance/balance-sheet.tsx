"use client"

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ChartOfAccount } from "./actions";

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
    const auditTrail: Record<string, { debits: number; credits: number; transactions: number }> = {};
    
    accounts.forEach(acc => {
        balances[acc.id] = 0;
        auditTrail[acc.id] = { debits: 0, credits: 0, transactions: 0 };
    });

    const validTransactions = transactions.filter(tx => !tx.isReversed);
    
    validTransactions.forEach(tx => {
        const totalDebits = tx.lines.reduce((sum: number, line: any) => sum + (line.debitMinor || 0), 0);
        const totalCredits = tx.lines.reduce((sum: number, line: any) => sum + (line.creditMinor || 0), 0);
        
        if (totalDebits !== totalCredits) {
            console.warn(`Unbalanced transaction ${tx.entryNumber}: Debits ${totalDebits} ≠ Credits ${totalCredits}`);
            return;
        }
        
        tx.lines.forEach((line: any) => {
            const account = accounts.find(a => a.id === line.acctCode);
            if (!account) return;
            
            const hasDebit = (line.debitMinor || 0) > 0;
            const hasCredit = (line.creditMinor || 0) > 0;
            
            if (hasDebit && hasCredit) {
                console.warn(`Invalid line in transaction ${tx.entryNumber}: Line has both debit and credit`);
                return;
            }
            
            const debit = hasDebit ? line.debitMinor : 0;
            const credit = hasCredit ? line.creditMinor : 0;
            
            auditTrail[line.acctCode].debits += debit;
            auditTrail[line.acctCode].credits += credit;
            auditTrail[line.acctCode].transactions += 1;
            
            balances[line.acctCode] = account.isDebitNormal
                ? (balances[line.acctCode] || 0) + (debit - credit)
                : (balances[line.acctCode] || 0) + (credit - debit);
        });
    });

    return { balances, auditTrail };
};

export default function BalanceSheet({ chartOfAccounts, transactions }: BalanceSheetProps) {
    const { balances, auditTrail } = calculateBalances(chartOfAccounts, transactions);

    const generateSection = (group: string) => {
        const accounts = chartOfAccounts.filter(acc => acc.group === group);
        const accountsWithBalances = accounts
            .map(acc => ({ 
                ...acc, 
                balance: balances[acc.id] || 0,
                audit: auditTrail[acc.id]
            }))
            .filter(acc => acc.balance !== 0);
            
        const total = accountsWithBalances.reduce((sum, acc) => sum + acc.balance, 0);
        return { accounts: accountsWithBalances, total };
    };

    const sections = {
        'Current Assets': generateSection('Current Assets'),
        'Fixed Assets': generateSection('Fixed Assets'),
        'Current Liabilities': generateSection('Current Liabilities'),
        'Equity': generateSection('Equity')
    };

    const totalAssets = sections['Current Assets'].total + sections['Fixed Assets'].total;
    const totalLiabilitiesAndEquity = sections['Current Liabilities'].total + sections['Equity'].total;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>A snapshot of the club's financial position.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* ASSETS */}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Assets</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
                        </TableRow>
                        {sections['Current Assets'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-6">{acc.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}
                         {sections['Fixed Assets'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-6">{acc.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}

                        {/* LIABILITIES & EQUITY */}
                         <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Liabilities & Equity</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalLiabilitiesAndEquity)}</TableCell>
                        </TableRow>
                        {sections['Current Liabilities'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-6">{acc.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}
                        {sections['Equity'].accounts.map(acc => (
                            <TableRow key={acc.id}>
                                <TableCell className="pl-6">{acc.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                            </TableRow>
                        ))}
                        
                        {/* VERIFICATION */}
                        <TableRow className="border-t-2 font-bold">
                           <TableCell>
                                <div className="flex items-center gap-2">
                                     {isBalanced ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                    )}
                                    <span>Verification (Assets = L+E)</span>
                                </div>
                           </TableCell>
                           <TableCell className="text-right">
                                {isBalanced ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                                        Balanced
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        Unbalanced by {formatCurrency(totalAssets - totalLiabilitiesAndEquity)}
                                    </Badge>
                                )}
                           </TableCell>
                        </TableRow>

                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
