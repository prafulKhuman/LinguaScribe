import { config } from 'dotenv';
config();

import '@/ai/flows/improve-transcription.ts';
import '@/ai/flows/generate-summary.ts';
import '@/ai/flows/generate-keywords.ts';
import '@/ai/flows/transcribe-audio.ts';
