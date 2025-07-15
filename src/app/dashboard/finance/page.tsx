import FinancialInsightsClient from "./financial-insights-client";

export default function FinancePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Financial Insights</h2>
          <p className="text-muted-foreground">
            Generate AI-powered financial summaries and budget forecasts.
          </p>
        </div>
      </div>
      <FinancialInsightsClient />
    </div>
  );
}
