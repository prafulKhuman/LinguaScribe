// src/ai/flows/improve-transcription.ts
'use server';

/**
 * @fileOverview A flow to improve the accuracy of a given transcription using GenAI.
 *
 * - improveTranscription - A function that takes a transcription and returns an improved version.
 * - ImproveTranscriptionInput - The input type for the improveTranscription function.
 * - ImproveTranscriptionOutput - The return type for the improveTranscription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveTranscriptionInputSchema = z.object({
  transcription: z
    .string()
    .describe('The original transcription text that needs improvement.'),
});
export type ImproveTranscriptionInput = z.infer<typeof ImproveTranscriptionInputSchema>;

const ImproveTranscriptionOutputSchema = z.object({
  improvedTranscription: z
    .string()
    .describe('The improved and corrected transcription text.'),
});
export type ImproveTranscriptionOutput = z.infer<typeof ImproveTranscriptionOutputSchema>;

export async function improveTranscription(
  input: ImproveTranscriptionInput
): Promise<ImproveTranscriptionOutput> {
  return improveTranscriptionFlow(input);
}

const improveTranscriptionPrompt = ai.definePrompt({
  name: 'improveTranscriptionPrompt',
  input: {schema: ImproveTranscriptionInputSchema},
  output: {schema: ImproveTranscriptionOutputSchema},
  prompt: `You are an expert transcription editor. Review the following transcription and correct any errors in spelling, grammar, punctuation, and clarity. Return only the corrected transcription.\n\nOriginal Transcription: {{{transcription}}}`,
});

const improveTranscriptionFlow = ai.defineFlow(
  {
    name: 'improveTranscriptionFlow',
    inputSchema: ImproveTranscriptionInputSchema,
    outputSchema: ImproveTranscriptionOutputSchema,
  },
  async input => {
    const {output} = await improveTranscriptionPrompt(input);
    return output!;
  }
);
