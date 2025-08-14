
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, Calendar, TrendingUp, TrendingDown, PieChart, BarChart3, LineChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, Area, AreaChart } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, eachMonthOfInterval, getMonth, getYear, startOfDay, endOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    date: string;
    balance: number;
    isReversed: boolean;
    isDeleted?: boolean;
    payee?: string;
}

interface MonthlyChartData {
    name: string;
    income: number;
    expenses: number;
}

interface BalanceChartData {
    date: string;
    balance: number;
}

interface CategoryData {
    name: string;
    value: number;
    color: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
}

const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
    '#d084d0', '#87ceeb', '#dda0dd', '#98fb98', '#f0e68c'
];

const MonthlyTrendsChart = ({ data }: { data: MonthlyChartData[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>Monthly Income vs. Expenses</CardTitle>
            <CardDescription>A summary of your cash flow over the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${formatCurrency(value)}`} />
                    <Tooltip content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="font-bold">{label}</div>
                                    <div className="text-green-600">Income: ₹{formatCurrency(payload[0].value as number)}</div>
                                    <div className="text-red-600">Expenses: ₹{formatCurrency(payload[1].value as number)}</div>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} name="Expenses" />
                </RechartsLineChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

const CategorySpendChart = ({ data }: { data: CategoryData[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>How your money is being spent across categories.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
             <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${formatCurrency(value as number)}`} />
                </RechartsPieChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

const BalanceHistoryChart = ({ data }: { data: BalanceChartData[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>Balance History</CardTitle>
            <CardDescription>The club's total balance over the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `₹${formatCurrency(value)}`} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div>{label}</div>
                                    <div className="font-bold">Balance: ₹{formatCurrency(payload[0].value as number)}</div>
                                </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

export default function FinanceCharts() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                 const transactionsQuery = query(
                    collection(db, "transactions"),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate),
                    orderBy("date", "asc")
                );
                const snapshot = await getDocs(transactionsQuery);
                const fetchedTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
                setTransactions(fetchedTransactions.filter(t => t.isDeleted !== true));
            } catch (error) {
                console.error("Error fetching transactions:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load financial data." });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [startDate, endDate, toast]);

    const chartData = useMemo(() => {
        const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
        const categoryData: { [key: string]: number } = {};

        const interval = eachMonthOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
        interval.forEach(month => {
            const monthKey = format(month, 'MMM yyyy');
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        });

        transactions.forEach(t => {
            if (t.isReversed) return;
            const monthKey = format(parseISO(t.date), 'MMM yyyy');
            if (!monthlyData[monthKey]) return;

            if (t.type === 'income') {
                monthlyData[monthKey].income += t.amount;
            } else {
                monthlyData[monthKey].expenses += t.amount;
                categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
            }
        });

        const monthlyChartData = Object.entries(monthlyData).map(([name, { income, expenses }]) => ({ name, income, expenses }));
        
        const categoryChartData = Object.entries(categoryData)
            .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
            .sort((a, b) => b.value - a.value);

        const balanceHistoryData = transactions.map(t => ({ date: format(parseISO(t.date), 'MMM d'), balance: t.balance }));

        return { monthlyChartData, categoryChartData, balanceHistoryData };
    }, [transactions, startDate, endDate]);

    const handleExport = async () => {
        // Create CSV content
        const csvHeaders = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance', 'Payee', 'Status'];
        const csvRows = transactions.map(t => [
            t.date,
            t.type,
            `"${t.category}"`,
            `"${t.description}"`,
            t.amount,
            t.balance,
            `"${t.payee || ''}"`,
            t.isReversed ? 'Reversed' : 'Active'
        ]);
        
        const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-data-${startDate}-to-${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({ title: "Success", description: "Financial data exported successfully." });
    };

    if (loading) {
        return (
             <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
                </div>
                 <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Filter Data</CardTitle>
                        <CardDescription>Select a date range to analyze.</CardDescription>
                    </div>
                    <div className="flex gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Start Date</label>
                            <Input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                         <div className="grid gap-2">
                             <label className="text-sm font-medium">End Date</label>
                            <Input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={handleExport} className="self-end">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <MonthlyTrendsChart data={chartData.monthlyChartData} />
                <CategorySpendChart data={chartData.categoryChartData} />
            </div>
            
            <BalanceHistoryChart data={chartData.balanceHistoryData} />
        </div>
    );
}

    