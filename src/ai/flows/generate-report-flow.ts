'use server';
/**
 * @fileOverview AI flow for synthesizing election transparency reports.
 * 
 * - generateTransparencyReport - Summarizes ledger data into a professional audit report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReportInputSchema = z.object({
  totalVoters: z.number(),
  totalVotes: z.number(),
  threatCount: z.number(),
  topThreats: z.array(z.string()),
  participationRate: z.string(),
});

export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  executiveSummary: z.string().describe("A professional summary of the election's integrity."),
  securityAssessment: z.string().describe("Evaluation of the network resilience during the window."),
  anomalyAnalysis: z.string().describe("A breakdown of the detected threats and how they were mitigated."),
  conclusion: z.string().describe("Final statement on the validity of the results."),
  auditHash: z.string().describe("A simulated SHA-256 hash for the report integrity."),
});

export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

const generateReportPrompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: { schema: GenerateReportInputSchema },
  output: { schema: GenerateReportOutputSchema },
  prompt: `You are an independent digital election auditor for the OOTU protocol.
Your task is to synthesize a professional Transparency & Audit Report based on the provided system metrics.

Metrics:
- Total Verified Voters: {{totalVoters}}
- Total Ballots Cast: {{totalVotes}}
- Participation Rate: {{participationRate}}
- Security Incidents Logged: {{threatCount}}
- Recent Threat Vectors: {{#each topThreats}}{{{this}}}, {{/each}}

The report must be technical yet accessible, emphasizing transparency and cryptographic integrity. Use a formal, objective tone. Include an executive summary, a security assessment, an anomaly analysis, and a conclusion.`,
});

export async function generateTransparencyReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  const generateReportFlow = ai.defineFlow(
    {
      name: 'generateReportFlow',
      inputSchema: GenerateReportInputSchema,
      outputSchema: GenerateReportOutputSchema,
    },
    async (input) => {
      const { output } = await generateReportPrompt(input);
      if (!output) throw new Error("AI failed to synthesize the audit report.");
      return output;
    }
  );

  return generateReportFlow(input);
}
