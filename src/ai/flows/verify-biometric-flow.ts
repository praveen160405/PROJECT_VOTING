'use server';
/**
 * @fileOverview AI flow for biometric facial verification.
 *
 * - verifyBiometric - Compares a live capture against a registered reference image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyBiometricInputSchema = z.object({
  referenceImageUri: z.string().describe("The registered biometric photo from the user profile."),
  liveCaptureUri: z.string().describe("The live photo captured during the current login attempt."),
});

export type VerifyBiometricInput = z.infer<typeof VerifyBiometricInputSchema>;

const VerifyBiometricOutputSchema = z.object({
  isMatch: z.boolean().describe("Whether the live capture matches the registered reference."),
  confidence: z.number().min(0).max(1).describe("The AI's confidence level in the match (0 to 1)."),
  analysis: z.string().describe("A brief explanation of the matching results."),
});

export type VerifyBiometricOutput = z.infer<typeof VerifyBiometricOutputSchema>;

const verifyBiometricPrompt = ai.definePrompt({
  name: 'verifyBiometricPrompt',
  input: { schema: VerifyBiometricInputSchema },
  output: { schema: VerifyBiometricOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
  prompt: `You are a biometric security system. Your task is to compare two facial images and determine if they belong to the same person.

Reference Image (Registered ID): {{media url=referenceImageUri}}
Live Capture (Current Session): {{media url=liveCaptureUri}}

Perform a detailed forensic comparison of facial geometry, feature placement, and bone structure. Account for differences in head pose, facial expression, and image quality. Ignore differences in lighting or background.

Analysis Requirements:
1. isMatch: true if the faces belong to the same person, false otherwise.
2. confidence: a score from 0 to 1.
3. analysis: a one-sentence summary of the decision (e.g., "Facial landmarks and eye spacing match the registered profile with high precision.")`,
});

const verifyBiometricFlow = ai.defineFlow(
  {
    name: 'verifyBiometricFlow',
    inputSchema: VerifyBiometricInputSchema,
    outputSchema: VerifyBiometricOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await verifyBiometricPrompt(input);
      if (!output) {
        throw new Error("Biometric AI engine failed to return a valid forensic result.");
      }
      return output;
    } catch (error: any) {
      console.error("Verify Biometric Error:", error);
      
      const errorMessage = error.message || "";
      
      // Handle model availability or capacity errors
      if (errorMessage.includes('503') || errorMessage.includes('capacity') || errorMessage.includes('demand') || errorMessage.includes('Unavailable')) {
        throw new Error("503: Forensic AI nodes are currently at capacity. Please retry in 30 seconds.");
      }
      
      // Handle model not found errors
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        throw new Error("Biometric engine configuration mismatch. Please contact protocol administrators.");
      }

      // Catch safety blocks
      if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
        throw new Error("Biometric input was blocked by safety filters. Ensure your face is clearly visible and centered.");
      }
      
      throw new Error(`Biometric engine error: ${errorMessage || "Unknown error"}`);
    }
  }
);

export async function verifyBiometric(input: VerifyBiometricInput): Promise<VerifyBiometricOutput> {
  return verifyBiometricFlow(input);
}
