
'use server';

/**
 * @fileOverview AI-powered procurement rejection reason enhancer.
 *
 * - enhanceRejectionReason - A function that takes an item name and a brief rejection reason and enriches it.
 * - EnhanceRejectionReasonInput - The input type for the enhanceRejectionReason function.
 * - EnhanceRejectionReasonOutput - The return type for the enhanceRejectionReason function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceRejectionReasonInputSchema = z.object({
  itemName: z.string().describe('The name of the item being rejected.'),
  reason: z.string().describe('The user-provided initial reason for the rejection.'),
});
export type EnhanceRejectionReasonInput = z.infer<typeof EnhanceRejectionReasonInputSchema>;

const EnhanceRejectionReasonOutputSchema = z.object({
  enhancedReason: z.string().describe('The AI-enhanced, detailed reason for the procurement rejection.'),
});
export type EnhanceRejectionReasonOutput = z.infer<typeof EnhanceRejectionReasonOutputSchema>;

export async function enhanceRejectionReason(input: EnhanceRejectionReasonInput): Promise<EnhanceRejectionReasonOutput> {
  return enhanceRejectionReasonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceRejectionReasonPrompt',
  input: {schema: EnhanceRejectionReasonInputSchema},
  output: {schema: EnhanceRejectionReasonOutputSchema},
  prompt: `You are an assistant for a Radio-Control (RC) hobbyist club.
  Your task is to refine a user's brief reason for rejecting a new item request into a more formal, polite, and clear rationale.
  The enhanced reason should be concise, directly related to the provided information, and written in simple English. Do not use markdown.

  Item Name: {{{itemName}}}
  
  User's Rejection Reason:
  {{{reason}}}

  Based on the item name and user's reason, generate a clear and formal rationale for the rejection.
  Start with a polite opening. For example, "This request is being denied because..." or "Unfortunately, this request cannot be approved at this time as...".
  `,
});

const enhanceRejectionReasonFlow = ai.defineFlow(
  {
    name: 'enhanceRejectionReasonFlow',
    inputSchema: EnhanceRejectionReasonInputSchema,
    outputSchema: EnhanceRejectionReasonOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
