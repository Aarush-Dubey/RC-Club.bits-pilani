'use server';

/**
 * @fileOverview AI-powered financial insights for the RC Club.
 *
 * - getFinancialInsights - A function that generates financial summaries and budget forecasts.
 * - FinancialInsightsInput - The input type for the getFinancialInsights function.
 * - FinancialInsightsOutput - The return type for the getFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialInsightsInputSchema = z.object({
  procurementLogs: z.string().describe('Historical procurement logs data.'),
  expensesData: z.string().describe('Historical expenses data.'),
  reimbursementData: z.string().describe('Historical reimbursement data.'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the club\'s financial health.'),
  budgetForecast: z.string().describe('A budget forecast based on the provided data.'),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function getFinancialInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  return financialInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `You are an expert financial analyst for a Radio-Control (RC) Club.

  Your task is to provide a summary of the club\'s financial health and a budget forecast based on the provided data.

  Procurement Logs: {{{procurementLogs}}}
  Expenses Data: {{{expensesData}}}
  Reimbursement Data: {{{reimbursementData}}}

  Summary:
  Budget Forecast: `,
});

const financialInsightsFlow = ai.defineFlow(
  {
    name: 'financialInsightsFlow',
    inputSchema: FinancialInsightsInputSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
