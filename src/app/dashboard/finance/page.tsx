import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceSheet from "./balance-sheet";
import Logbook from "./logbook";
import FinanceCharts from "./finance-charts";

export default function FinancePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Financial Management</h2>
          <p className="text-muted-foreground">
            Manage all financial aspects of the club including transactions, and reporting.
          </p>
        </div>
      </div>
      <Tabs defaultValue="balance-sheet" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="balance-sheet" className="space-y-4">
          <BalanceSheet />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Logbook />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <FinanceCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
