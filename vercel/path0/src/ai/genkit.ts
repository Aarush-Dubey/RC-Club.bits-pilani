/**
 * This file initializes and configures the Genkit AI instance.
 * It sets up the necessary plugins, such as the Google AI plugin,
 * and specifies the default generative model to be used across the application,
 * in this case, 'googleai/gemini-2.0-flash'.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

