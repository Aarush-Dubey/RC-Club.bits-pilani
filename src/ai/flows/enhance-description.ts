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
  type: z.string().describe('The type of the project (e.g., plane, drone, other).'),
  description: z.string().describe('The user-provided initial description of the project.'),
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
  prompt: `You are a creative assistant for a Radio-Control (RC) hobbyist club.
  Your task is to take a user's basic project idea and expand it into a more detailed and exciting project description.
  Make it sound ambitious but achievable for a hobbyist club. Mention potential technologies or goals. Do not use markdown.

  Project Title: {{{title}}}
  Project Type: {{{type}}}
  
  User's Description:
  {{{description}}}

  Now, generate an enhanced, more detailed description based on this input.
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
