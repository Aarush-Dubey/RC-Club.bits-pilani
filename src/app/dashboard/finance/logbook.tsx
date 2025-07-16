
"use client"

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';

interface LogbookEntry {
    id: string;
    date: string;
    assetGroup: string;
    account: string;
    description: string;
    debit?: number;
    credit?: number;
    balance: number;
}

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export default function Logbook() {
    const [logbookData, setLogbookData] = useState<LogbookEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogbookData = async () => {
            setLoading(true);
            try {
                const logbookQuery = query(collection(db, "logbook"), orderBy("date", "desc"));
                const querySnapshot = await getDocs(logbookQuery);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogbookEntry));
                setLogbookData(data);
            } catch (error) {
                console.error("Error fetching logbook data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogbookData();
    }, []);

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
        <Card>
            <CardHeader>
                <CardTitle>Financial Logbook</CardTitle>
                <CardDescription>A detailed record of all financial transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Asset Group</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logbookData.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                                <TableCell>{entry.assetGroup}</TableCell>
                                <TableCell>{entry.account}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(entry.debit)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(entry.credit)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(entry.balance)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
