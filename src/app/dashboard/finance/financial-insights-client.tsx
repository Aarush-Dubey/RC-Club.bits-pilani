"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { getFinancialInsights, type FinancialInsightsOutput } from "@/ai/flows/financial-insights"
import { sampleLogs } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function FinancialInsightsClient() {
  const [procurementLogs, setProcurementLogs] = useState(sampleLogs.procurement)
  const [expensesData, setExpensesData] = useState(sampleLogs.expenses)
  const [reimbursementData, setReimbursementData] = useState(sampleLogs.reimbursement)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<FinancialInsightsOutput | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const output = await getFinancialInsights({
        procurementLogs,
        expensesData,
        reimbursementData,
      })
      setResult(output)
    } catch (error) {
      console.error("Error generating insights:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate financial insights. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="procurement-logs">Procurement Logs (CSV)</Label>
          <Textarea
            id="procurement-logs"
            value={procurementLogs}
            onChange={(e) => setProcurementLogs(e.target.value)}
            rows={10}
            className="font-code"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenses-data">Expenses Data (CSV)</Label>
          <Textarea
            id="expenses-data"
            value={expensesData}
            onChange={(e) => setExpensesData(e.target.value)}
            rows={10}
            className="font-code"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reimbursement-data">Reimbursement Data (CSV)</Label>
          <Textarea
            id="reimbursement-data"
            value={reimbursementData}
            onChange={(e) => setReimbursementData(e.target.value)}
            rows={10}
            className="font-code"
          />
        </div>
        <div className="lg:col-span-3">
          <Button type="submit" disabled={isLoading} className="w-full lg:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Insights"
            )}
          </Button>
        </div>
      </form>

      {result && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
          <div>
            <h3 className="text-xl font-headline font-semibold">Financial Summary</h3>
            <p className="whitespace-pre-wrap mt-2 text-muted-foreground">{result.summary}</p>
          </div>
          <div>
            <h3 className="text-xl font-headline font-semibold">Budget Forecast</h3>
            <p className="whitespace-pre-wrap mt-2 text-muted-foreground">{result.budgetForecast}</p>
          </div>
        </div>
      )}
    </div>
  )
}
