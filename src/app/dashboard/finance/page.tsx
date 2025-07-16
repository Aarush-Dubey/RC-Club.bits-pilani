import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceSheet from "./balance-sheet";
import Logbook from "./logbook";

export default function FinancePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Financial Reports</h2>
          <p className="text-muted-foreground">
            View financial statements and reports for the club.
          </p>
        </div>
      </div>
      <Tabs defaultValue="balance-sheet">
        <TabsList>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="logbook">Logbook</TabsTrigger>
        </TabsList>
        <TabsContent value="balance-sheet" className="mt-4">
            <BalanceSheet />
        </TabsContent>
        <TabsContent value="logbook" className="mt-4">
            <Logbook />
        </TabsContent>
      </Tabs>
    </div>
  );
}
