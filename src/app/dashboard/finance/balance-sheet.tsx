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
    
    // Initialize balances
    accounts.forEach(acc => {
        balances[acc.id] = 0;
        auditTrail[acc.id] = { debits: 0, credits: 0, transactions: 0 };
    });

    // Process only valid, non-reversed transactions
    const validTransactions = transactions.filter(tx => !tx.isReversed);
    
    validTransactions.forEach(tx => {
        // Validate transaction balance before processing
        const totalDebits = tx.lines.reduce((sum: number, line: any) => sum + (line.debitMinor || 0), 0);
        const totalCredits = tx.lines.reduce((sum: number, line: any) => sum + (line.creditMinor || 0), 0);
        
        if (totalDebits !== totalCredits) {
            console.warn(`Unbalanced transaction ${tx.entryNumber}: Debits ${totalDebits} ≠ Credits ${totalCredits}`);
            return; // Skip unbalanced transactions
        }
        
        tx.lines.forEach((line: any) => {
            const account = accounts.find(a => a.id === line.acctCode);
            if (!account) return;
            
            // Validate line integrity
            const hasDebit = (line.debitMinor || 0) > 0;
            const hasCredit = (line.creditMinor || 0) > 0;
            
            if (hasDebit && hasCredit) {
                console.warn(`Invalid line in transaction ${tx.entryNumber}: Line has both debit and credit`);
                return; // Skip invalid lines
            }
            
            const debit = hasDebit ? line.debitMinor : 0;
            const credit = hasCredit ? line.creditMinor : 0;
            
            // Update audit trail
            auditTrail[line.acctCode].debits += debit;
            auditTrail[line.acctCode].credits += credit;
            auditTrail[line.acctCode].transactions += 1;
            
            // Calculate balance based on account normal balance
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
            .filter(acc => acc.balance !== 0); // Filter zero balances
            
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
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1; // Allow for minor rounding

    return (
        <div className="space-y-6">
            {/* AUDIT STATUS */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Balance Sheet Audit Status</CardTitle>
                            <CardDescription>Verification of accounting equation integrity</CardDescription>
                        </div>
                        {isBalanced ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Balanced
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Unbalanced
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">{formatCurrency(totalAssets)}</div>
                            <div className="text-sm text-muted-foreground">Total Assets</div>
                        </div>
                        <div className="text-xl self-center">=</div>
                        <div>
                            <div className="text-2xl font-bold">{formatCurrency(totalLiabilitiesAndEquity)}</div>
                            <div className="text-sm text-muted-foreground">Liabilities + Equity</div>
                        </div>
                    </div>
                    {!isBalanced && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-semibold">AUDIT ALERT: Balance Sheet Does Not Balance</span>
                            </div>
                            <div className="text-sm text-destructive/80 mt-1">
                                Difference: {formatCurrency(totalAssets - totalLiabilitiesAndEquity)}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* BALANCE SHEET */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ASSETS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Current Assets */}
                                <TableRow className="bg-muted/50">
                                    <TableCell className="font-semibold">Current Assets</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(sections['Current Assets'].total)}
                                    </TableCell>
                                </TableRow>
                                {sections['Current Assets'].accounts.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell className="pl-6">{acc.name}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                                    </TableRow>
                                ))}
                                
                                {/* Fixed Assets */}
                                <TableRow className="bg-muted/50">
                                    <TableCell className="font-semibold">Fixed Assets</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(sections['Fixed Assets'].total)}
                                    </TableCell>
                                </TableRow>
                                {sections['Fixed Assets'].accounts.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell className="pl-6">{acc.name}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                                    </TableRow>
                                ))}
                                
                                {/* Total Assets */}
                                <TableRow className="border-t-2 border-border">
                                    <TableCell className="font-bold">TOTAL ASSETS</TableCell>
                                    <TableCell className="text-right font-bold text-lg">
                                        {formatCurrency(totalAssets)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* LIABILITIES & EQUITY */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liabilities & Equity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Current Liabilities */}
                                <TableRow className="bg-muted/50">
                                    <TableCell className="font-semibold">Current Liabilities</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(sections['Current Liabilities'].total)}
                                    </TableCell>
                                </TableRow>
                                {sections['Current Liabilities'].accounts.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell className="pl-6">{acc.name}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                                    </TableRow>
                                ))}
                                
                                {/* Equity */}
                                <TableRow className="bg-muted/50">
                                    <TableCell className="font-semibold">Equity</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(sections['Equity'].total)}
                                    </TableCell>
                                </TableRow>
                                {sections['Equity'].accounts.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell className="pl-6">{acc.name}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                                    </TableRow>
                                ))}
                                
                                {/* Total Liabilities & Equity */}
                                <TableRow className="border-t-2 border-border">
                                    <TableCell className="font-bold">TOTAL LIABILITIES & EQUITY</TableCell>
                                    <TableCell className="text-right font-bold text-lg">
                                        {formatCurrency(totalLiabilitiesAndEquity)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
