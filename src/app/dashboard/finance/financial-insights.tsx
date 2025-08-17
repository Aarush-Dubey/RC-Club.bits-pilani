
"use client";

import { useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Sparkles, Loader2, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";

import { db } from "@/lib/firebase";
import { generateFinancialInsights } from "@/ai/flows/financial-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FinancialData {
  transactionLog: string;
  accountBalances: string;
}

interface Insights {
  summary: string;
  forecast: string;
}

// Helper to convert an array of objects to a CSV string
const toCSV = (data: any[], headers: string[]) => {
  const headerRow = headers.join(",");
  const rows = data.map(obj => 
    headers.map(header => {
        const value = obj[header] || '';
        const stringValue = typeof value === 'string' ? value.replace(/"/g, '""') : value;
        return `"${stringValue}"`;
    }).join(",")
  );
  return [headerRow, ...rows].join("\n");
};


async function getFinancialData(): Promise<FinancialData> {
  const transactionsQuery = query(
    collection(db, "transactions"),
    orderBy("date", "desc")
  );
  const transactionsSnap = await getDocs(transactionsQuery);
  const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const accountsQuery = query(collection(db, "accounts"), orderBy("name"));
  const accountsSnap = await getDocs(accountsQuery);
  const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const transactionHeaders = ['date', 'type', 'category', 'description', 'amount', 'payee'];
  const transactionLog = toCSV(transactions, transactionHeaders);
  
  const accountBalances = accounts.map(acc => `${acc.name} (${acc.group}): ${acc.balance.toFixed(2)}`).join("\n");

  return { transactionLog, accountBalances };
}

export default function FinancialInsights() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    try {
      const financialData = await getFinancialData();
      if (!financialData.transactionLog || financialData.transactionLog.split('\n').length < 2) {
        throw new Error("Not enough transaction data to generate insights.");
      }
      const result = await generateFinancialInsights(financialData);
      setInsights(result);
    } catch (e) {
      const errorMessage = (e instanceof Error) ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Failed to Generate Insights",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Insights</CardTitle>
        <CardDescription>
          Use AI to get a summary of the club's spending habits and a forecast for the next quarter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-start">
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Generating..." : "Generate Insights"}
          </Button>
        </div>
        
        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <BarChart3 className="h-6 w-6 text-primary"/>
                    <CardTitle className="text-lg">Spending Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {insights?.summary || "Click 'Generate Insights' to see a summary of recent financial activity."}
                        </p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <TrendingUp className="h-6 w-6 text-primary"/>
                    <CardTitle className="text-lg">Budget Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {insights?.forecast || "Click 'Generate Insights' to get a forward-looking budget forecast."}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}
