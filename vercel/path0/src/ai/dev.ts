/**
 * This file serves as the entry point for the Genkit AI development server.
 * It imports and registers all the AI flows defined in the application,
 * making them available for local testing and execution through the Genkit developer UI.
 */
import { config } from 'dotenv';
config();

import '@/ai/flows/enhance-description.ts';
import '@/ai/flows/enhance-update.ts';
import '@/ai/flows/enhance-justification.ts';
import '@/ai/flows/enhance-rejection-reason.ts';
import '@/ai/flows/generate-item-description.ts';

