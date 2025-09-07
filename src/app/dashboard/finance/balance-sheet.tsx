
"use client"

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ChartOfAccount } from "./actions";

interface BalanceSheetProps {
    chartOfAccounts: ChartOfAccount[];
    transactions: any[];
}

const formatCurrency = (minorAmount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(minorAmount / 100);
}

const calculateBalances = (accounts: ChartOfAccount[], transactions: any[]) => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => balances[acc.id] = 0);

    transactions.forEach(tx => {
        tx.lines.forEach((line: any) => {
            if (balances[line.acctCode] !== undefined) {
                 const account = accounts.find(a => a.id === line.acctCode);
                 if(account) {
                    if (account.isDebitNormal) {
                        balances[line.acctCode] += line.debitMinor - line.creditMinor;
                    } else {
                        balances[line.acctCode] += line.creditMinor - line.debitMinor;
                    }
                 }
            }
        });
    });

    return balances;
};


export default function BalanceSheet({ chartOfAccounts, transactions }: BalanceSheetProps) {
    const balances = calculateBalances(chartOfAccounts, transactions);

    const generateSection = (group: string) => {
        const accounts = chartOfAccounts.filter(acc => acc.group === group);
        const total = accounts.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0);
        
        return {
            accounts: accounts.map(acc => ({ ...acc, balance: balances[acc.id] || 0 })),
            total
        };
    };

    const sections = {
        'Current Assets': generateSection('Current Assets'),
        'Fixed Assets': generateSection('Fixed Assets'),
        'Current Liabilities': generateSection('Current Liabilities'),
        'Equity': generateSection('Equity')
    };

    const totalAssets = sections['Current Assets'].total + sections['Fixed Assets'].total;
    const totalLiabilities = sections['Current Liabilities'].total;
    const totalEquity = sections['Equity'].total;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>An automated financial statement based on the logbook entries.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-2/3">Account</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Assets */}
                        <TableRow className="font-bold bg-muted/50">
                            <TableCell>Assets</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
                        </TableRow>
                        {Object.entries(sections).map(([groupName, sectionData]) => {
                             if (!groupName.includes('Assets')) return null;
                             return (
                                <React.Fragment key={groupName}>
                                    <TableRow>
                                        <TableCell className="pl-8 font-semibold">{groupName}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    {sectionData.accounts.map(account => (
                                         <TableRow key={account.id}>
                                            <TableCell className="pl-16">{account.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                     <TableRow>
                                        <TableCell className="pl-8 font-semibold">Total {groupName}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(sectionData.total)}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                             )
                        })}
                        {/* Liabilities and Equity */}
                        <TableRow className="font-bold bg-muted/50">
                            <TableCell>Liabilities & Equity</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalLiabilitiesAndEquity)}</TableCell>
                        </TableRow>
                         {Object.entries(sections).map(([groupName, sectionData]) => {
                             if (groupName.includes('Assets')) return null;
                             return (
                                <React.Fragment key={groupName}>
                                    <TableRow>
                                        <TableCell className="pl-8 font-semibold">{groupName}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    {sectionData.accounts.map(account => (
                                         <TableRow key={account.id}>
                                            <TableCell className="pl-16">{account.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                     <TableRow>
                                        <TableCell className="pl-8 font-semibold">Total {groupName}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(sectionData.total)}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                             )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

