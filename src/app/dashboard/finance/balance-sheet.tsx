
"use client"

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Account {
    name: string;
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


const BalanceSheetTable = ({ data }: { data: BalanceSheetData }) => {
    const sections = [
        { title: "Current Assets", data: data.currentAssets },
        { title: "Current Liabilities", data: data.currentLiabilities },
        { title: "Fixed Assets", data: data.fixedAssets },
        { title: "Owner's Equity", data: data.ownersEquity },
    ];

    return (
         <Card>
            <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
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
                                {section.data.accounts.map((account, index) => (
                                    <TableRow key={account.name}>
                                        {index === 0 && <TableCell rowSpan={section.data.accounts.length + 1} className="align-top font-semibold">{section.title}</TableCell>}
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
    )
}


export default function BalanceSheet() {
    const [data, setData] = useState<BalanceSheetData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const unpaidReimbursements = await getUnpaidReimbursements();

            const mockData = {
                 currentAssets: {
                    group: "Current Assets",
                    accounts: [
                        { name: "Cash", balance: 635706.56 },
                        { name: "Perishables", balance: 9833 },
                        { name: "Apogee 2025", balance: 1469 },
                        { name: "BOSM24 Equipment", balance: 152.6 },
                        { name: "BOSM Receivable", balance: 0 },
                        { name: "Robofest Receivable", balance: 0 },
                    ],
                },
                fixedAssets: {
                    group: "Fixed Assets",
                    accounts: [
                        { name: "General Equipment", balance: 145766.55 },
                        { name: "Robofest24 Equipment", balance: 134690.71 },
                        { name: "Apogee 2025", balance: 32187.31 },
                        { name: "BOSM24 Equipment", balance: 21234.39 },
                    ],
                },
                ownersEquity: {
                    group: "Owner's Equity",
                    accounts: [{ name: "Stockholders' Equity", balance: -980404.12 }],
                },
            }
            
            const liabilitiesTotal = unpaidReimbursements.reduce((sum, item) => sum + item.balance, 0);
            const currentAssetsTotal = mockData.currentAssets.accounts.reduce((sum, item) => sum + item.balance, 0);
            const fixedAssetsTotal = mockData.fixedAssets.accounts.reduce((sum, item) => sum + item.balance, 0);
            const ownersEquityTotal = mockData.ownersEquity.accounts.reduce((sum, item) => sum + item.balance, 0);

            setData({
                currentAssets: { ...mockData.currentAssets, total: currentAssetsTotal },
                currentLiabilities: { 
                    group: "Current Liabilities",
                    accounts: unpaidReimbursements,
                    total: liabilitiesTotal
                },
                fixedAssets: { ...mockData.fixedAssets, total: fixedAssetsTotal },
                ownersEquity: { ...mockData.ownersEquity, total: ownersEquityTotal },
                grandTotal: currentAssetsTotal + fixedAssetsTotal - liabilitiesTotal + ownersEquityTotal
            });

            setLoading(false);
        }
        fetchData();
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

    if (!data) {
        return <p>No data available to display balance sheet.</p>
    }

    return <BalanceSheetTable data={data} />;
}
