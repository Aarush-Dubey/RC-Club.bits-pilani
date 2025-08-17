
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceSheet from "./balance-sheet";
import Logbook from "./logbook";
import FinancialInsights from "./financial-insights";

export default function FinancePage() {
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
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="space-y-4">
          <FinancialInsights />
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <BalanceSheet />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Logbook />
        </TabsContent>
      </Tabs>
    </div>
  );
}
