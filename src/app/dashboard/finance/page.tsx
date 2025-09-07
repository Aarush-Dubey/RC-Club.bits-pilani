
"use client"

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceSheet from "./balance-sheet";
import Logbook from "./logbook";
import { getChartOfAccounts, getTransactions, type ChartOfAccount } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancePage() {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [accounts, transactions] = await Promise.all([
            getChartOfAccounts(),
            getTransactions()
        ]);
        setChartOfAccounts(accounts);
        setTransactions(transactions);
    } catch (error) {
        console.error("Failed to fetch financial data:", error);
    } finally {
        setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Financial Management</h1>
          <p className="text-base text-muted-foreground mt-2">
            Manage all financial aspects of the club including transactions, and reporting.
          </p>
        </div>
      </div>
      <Tabs defaultValue="balance-sheet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="logbook">Logbook</TabsTrigger>
        </TabsList>
        
        <TabsContent value="balance-sheet" className="space-y-4">
          <BalanceSheet chartOfAccounts={chartOfAccounts} transactions={transactions} />
        </TabsContent>
        
        <TabsContent value="logbook" className="space-y-4">
          <Logbook chartOfAccounts={chartOfAccounts} transactions={transactions} onUpdate={fetchData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
