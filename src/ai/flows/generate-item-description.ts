
'use server';

/**
 * @fileOverview AI-powered inventory item description generator.
 *
 * - generateItemDescription - A function that takes an item name and generates a description.
 * - GenerateItemDescriptionInput - The input type for the generateItemDescription function.
 * - GenerateItemDescriptionOutput - The return type for the generateItemDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItemDescriptionInputSchema = z.object({
  itemName: z.string().describe('The name of the inventory item.'),
});
export type GenerateItemDescriptionInput = z.infer<typeof GenerateItemDescriptionInputSchema>;

const GenerateItemDescriptionOutputSchema = z.object({
  description: z.string().describe('The AI-generated description for the item.'),
});
export type GenerateItemDescriptionOutput = z.infer<typeof GenerateItemDescriptionOutputSchema>;

export async function generateItemDescription(input: GenerateItemDescriptionInput): Promise<GenerateItemDescriptionOutput> {
  return generateItemDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItemDescriptionPrompt',
  input: {schema: GenerateItemDescriptionInputSchema},
  output: {schema: GenerateItemDescriptionOutputSchema},
  prompt: `You are an assistant for a Radio-Control (RC) hobbyist club.
  Your task is to generate a brief, clear, and informative description for a new inventory item based on its name.
  The description should be concise and written in simple English. Do not use markdown.

  Item Name: {{{itemName}}}

  Based on the item name, generate a description.
  If the item is a technical RC component (like an IMU, ESC, Flight Controller, FPV Camera, etc.), briefly explain its primary function as part of the description. For example, for an IMU, you might generate "An Inertial Measurement Unit used for determining orientation and angular velocity, critical for flight stabilization." For a simple item like 'Lipo Battery', you can just say "A rechargeable battery pack to power RC models."
  `,
});

const generateItemDescriptionFlow = ai.defineFlow(
  {
    name: 'generateItemDescriptionFlow',
    inputSchema: GenerateItemDescriptionInputSchema,
    outputSchema: GenerateItemDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
