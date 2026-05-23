import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization for the OOTU Protocol.
 * Using gemini-1.5-flash for the best balance of speed and multimodal accuracy.
 * We use the 'googleai/' provider prefix as required by the plugin.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});
