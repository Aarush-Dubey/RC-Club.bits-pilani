
'use server';

/**
 * @fileOverview AI-powered project update enhancer.
 *
 * - enhanceUpdate - A function that takes a brief update and enriches it.
 * - EnhanceUpdateInput - The input type for the enhanceUpdate function.
 * - EnhanceUpdateOutput - The return type for the enhanceUpdate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceUpdateInputSchema = z.object({
  projectTitle: z.string().describe('The title of the project.'),
  projectDescription: z.string().describe('The overall description of the project for context.'),
  updateText: z.string().describe('The user-provided text for the project update.'),
  updateImage: z
    .string()
    .optional()
    .describe(
      "An optional image for the update, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceUpdateInput = z.infer<typeof EnhanceUpdateInputSchema>;

const EnhanceUpdateOutputSchema = z.object({
  enhancedUpdateText: z.string().describe('The AI-enhanced, detailed text for the project update.'),
});
export type EnhanceUpdateOutput = z.infer<typeof EnhanceUpdateOutputSchema>;

export async function enhanceUpdate(input: EnhanceUpdateInput): Promise<EnhanceUpdateOutput> {
  return enhanceUpdateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceUpdatePrompt',
  input: {schema: EnhanceUpdateInputSchema},
  output: {schema: EnhanceUpdateOutputSchema},
  prompt: `You are an expert project manager writing a status update for a Radio-Control (RC) hobbyist club project.
  Your task is to refine a user's update into a concise, formal, and clear status report using simple English.
  Use the project context to inform the update. If an image is provided, analyze it and incorporate relevant details into the text. Do not use markdown.

  Project Title: {{{projectTitle}}}
  Project Description: {{{projectDescription}}}
  
  User's Update Text:
  {{{updateText}}}

  {{#if updateImage}}
  Image attached to the update:
  {{media url=updateImage}}
  {{/if}}

  Based on all the information, generate a clear and formal summary of the update.
  `,
});

const enhanceUpdateFlow = ai.defineFlow(
  {
    name: 'enhanceUpdateFlow',
    inputSchema: EnhanceUpdateInputSchema,
    outputSchema: EnhanceUpdateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return { enhancedUpdateText: output!.enhancedUpdateText };
  }
);
