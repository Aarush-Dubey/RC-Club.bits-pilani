
'use server';

/**
 * @fileOverview An AI agent for providing financial insights.
 *
 * - generateFinancialInsights - A function that analyzes financial data and returns a summary and forecast.
 * - FinancialInsightsInput - The input type for the generateFinancialInsights function.
 * - FinancialInsightsOutput - The return type for the generateFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialInsightsInputSchema = z.object({
  transactionLog: z.string().describe('A CSV string of all financial transactions.'),
  accountBalances: z.string().describe('A summary of current account balances.'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the club's recent spending patterns, highlighting key income sources and expense categories."),
  forecast: z.string().describe("A brief, actionable budget forecast for the next quarter, identifying potential savings and areas for financial focus."),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function generateFinancialInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  return financialInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `You are a financial analyst for a student-run Radio-Control (RC) hobbyist club.
  Your task is to analyze the club's financial data and provide a clear, concise summary and a forward-looking budget forecast.
  The audience is the club treasurer and student leadership, so use simple, direct language. Avoid jargon.

  Analyze the following financial data:
  
  CURRENT ACCOUNT BALANCES:
  {{{accountBalances}}}

  TRANSACTION LOG (CSV):
  {{{transactionLog}}}

  Based on the data, provide:
  1.  **Spending Summary**: Briefly summarize the key spending patterns from the transaction log. What are the largest expense categories? Where is the income coming from?
  2.  **Budget Forecast**: Provide a simple, actionable forecast for the next 3 months. What are the expected major expenses or income? Suggest 1-2 specific areas where the club could be more mindful of its spending.
  `,
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
