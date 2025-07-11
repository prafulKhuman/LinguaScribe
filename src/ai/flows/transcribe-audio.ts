'use server';

/**
 * @fileOverview A flow to transcribe audio from a media file.
 *
 * - transcribeAudio - A function that takes an audio/video file and returns its transcription.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAudioInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A media file (audio or video) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the media file.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    const {text} = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        {
          media: {url: input.mediaDataUri},
        },
        {text: 'Transcribe the audio from this file.'},
      ],
      config: {
        responseMimeType: 'text/plain',
      },
    });

    return {transcription: text};
  }
);
