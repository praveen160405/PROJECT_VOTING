'use server';
/**
 * @fileOverview AI flow for detecting deepfakes and manipulated media.
 *
 * - detectDeepfake - Analyzes media for signs of AI generation or manipulation.
 * - DetectDeepfakeInput - The input type containing media data.
 * - DetectDeepfakeOutput - The structured analysis of the media integrity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectDeepfakeInputSchema = z.object({
  mediaDataUri: z.string().describe("The media to analyze as a base64 data URI."),
  contentType: z.string().describe("The MIME type of the media (image/jpeg, video/mp4, etc.)"),
  context: z.string().optional().describe("Context about the media (e.g., 'Candidate speech at rally')"),
});

export type DetectDeepfakeInput = z.infer<typeof DetectDeepfakeInputSchema>;

const DetectDeepfakeOutputSchema = z.object({
  isManipulated: z.boolean().describe("Whether the media shows signs of AI manipulation or deepfake techniques."),
  confidenceScore: z.number().min(0).max(1).describe("Confidence level of the detection (0 to 1)."),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']).describe("The security risk level assigned to this media."),
  analysis: z.string().describe("A detailed forensic breakdown of why this was flagged or cleared."),
  detectedAnomalies: z.array(z.string()).describe("List of specific artifacts or inconsistencies found."),
  metadataIntegrity: z.string().describe("Assessment of the media's metadata and origin consistency."),
});

export type DetectDeepfakeOutput = z.infer<typeof DetectDeepfakeOutputSchema>;

const detectDeepfakePrompt = ai.definePrompt({
  name: 'detectDeepfakePrompt',
  input: { schema: DetectDeepfakeInputSchema },
  output: { schema: DetectDeepfakeOutputSchema },
  prompt: `You are an expert AI forensic analyst specializing in deepfake detection for high-stakes elections.

Analyze the provided media for any signs of manipulation, including:
- Inconsistent lighting or shadows on faces.
- Unnatural blinking patterns or lip-sync errors.
- Smoothing or blurring around the jawline and neck (AI blending artifacts).
- Metadata inconsistencies or absence of camera noise.
- Neural rendering signatures (GAN or Diffusion artifacts).

Context: {{{context}}}

Analyze this media and provide a structured report on its integrity. If you detect manipulation, explain exactly what artifacts were found.

Media: {{media url=mediaDataUri}}`,
});

export async function detectDeepfake(input: DetectDeepfakeInput): Promise<DetectDeepfakeOutput> {
  const detectDeepfakeFlow = ai.defineFlow(
    {
      name: 'detectDeepfakeFlow',
      inputSchema: DetectDeepfakeInputSchema,
      outputSchema: DetectDeepfakeOutputSchema,
    },
    async (input) => {
      const { output } = await detectDeepfakePrompt(input);
      if (!output) throw new Error("AI failed to return detection results.");
      return output;
    }
  );

  return detectDeepfakeFlow(input);
}
