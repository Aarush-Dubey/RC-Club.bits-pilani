
'use server';

/**
 * @fileOverview AI-powered procurement justification enhancer.
 *
 * - enhanceJustification - A function that takes an item name and a brief justification and enriches it.
 * - EnhanceJustificationInput - The input type for the enhanceJustification function.
 * - EnhanceJustificationOutput - The return type for the enhanceJustification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceJustificationInputSchema = z.object({
  itemName: z.string().describe('The name of the item being requested.'),
  justification: z.string().describe('The user-provided initial justification for the request.'),
});
export type EnhanceJustificationInput = z.infer<typeof EnhanceJustificationInputSchema>;

const EnhanceJustificationOutputSchema = z.object({
  enhancedJustification: z.string().describe('The AI-enhanced, detailed justification for the procurement request.'),
});
export type EnhanceJustificationOutput = z.infer<typeof EnhanceJustificationOutputSchema>;

export async function enhanceJustification(input: EnhanceJustificationInput): Promise<EnhanceJustificationOutput> {
  return enhanceJustificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceJustificationPrompt',
  input: {schema: EnhanceJustificationInputSchema},
  output: {schema: EnhanceJustificationOutputSchema},
  prompt: `You are an assistant for a Radio-Control (RC) hobbyist club.
  Your task is to refine a user's brief justification for a new item request into a more formal and clear rationale.
  The enhanced justification should be concise, directly related to the provided information, and written in simple English. Do not use markdown.

  Item Name: {{{itemName}}}
  
  User's Justification:
  {{{justification}}}

  Based on the item name and user's justification, generate a clear and formal rationale for the procurement request.
  If the item is a technical RC component (like an IMU, ESC, Flight Controller, etc.), briefly explain its function as part of the justification. For example, for an IMU, you might start with "This is an Inertial Measurement Unit, used for determining orientation and angular velocity..."
  `,
});

const enhanceJustificationFlow = ai.defineFlow(
  {
    name: 'enhanceJustificationFlow',
    inputSchema: EnhanceJustificationInputSchema,
    outputSchema: EnhanceJustificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
