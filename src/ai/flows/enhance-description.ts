
'use server';

/**
 * @fileOverview AI-powered project description enhancer.
 *
 * - enhanceDescription - A function that takes a brief project description and enriches it.
 * - EnhanceDescriptionInput - The input type for the enhanceDescription function.
 * - EnhanceDescriptionOutput - The return type for the enhanceDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the project.'),
  description: z.string().describe('The user-provided initial description of the project.'),
  requestedInventory: z.string().optional().describe('A comma-separated list of requested inventory items and quantities.'),
});
export type EnhanceDescriptionInput = z.infer<typeof EnhanceDescriptionInputSchema>;

const EnhanceDescriptionOutputSchema = z.object({
  enhancedDescription: z.string().describe('The AI-enhanced, detailed description of the project.'),
});
export type EnhanceDescriptionOutput = z.infer<typeof EnhanceDescriptionOutputSchema>;

export async function enhanceDescription(input: EnhanceDescriptionInput): Promise<EnhanceDescriptionOutput> {
  return enhanceDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceDescriptionPrompt',
  input: {schema: EnhanceDescriptionInputSchema},
  output: {schema: EnhanceDescriptionOutputSchema},
  prompt: `You are an assistant for a Radio-Control (RC) hobbyist club.
  Your task is to refine a basic project idea into a concise and formal project description using simple English.
  The description should be minimal and directly related to the provided information. Do not use markdown.

  Project Title: {{{title}}}
  
  User's Description:
  {{{description}}}

  Requested Inventory:
  {{{requestedInventory}}}

  Based on the title, user's description, and requested inventory, generate a clear, formal, and minimal description for the project proposal.
  `,
});

const enhanceDescriptionFlow = ai.defineFlow(
  {
    name: 'enhanceDescriptionFlow',
    inputSchema: EnhanceDescriptionInputSchema,
    outputSchema: EnhanceDescriptionOutputSchema,
  },
  async input => {
    // If the description is already detailed, don't do anything drastic.
    if (input.description.length > 200) {
      return { enhancedDescription: input.description };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
