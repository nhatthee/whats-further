import dotenv from "dotenv";

dotenv.config({
	path: ".env.local",
});

import fs from 'fs/promises';
import path from 'path';
import {QUOTES} from '../src/quotes';

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npx tsx scripts/generate-voice.ts 041');
}

const quote = QUOTES[clipId];

if (!quote) {
	throw new Error(`Missing QUOTES entry: QUOTES["${clipId}"]`);
}

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
	throw new Error('Missing ELEVENLABS_API_KEY environment variable');
}

const voiceId = process.env.ELEVENLABS_VOICE_ID;

if (!voiceId) {
	throw new Error('Missing ELEVENLABS_VOICE_ID environment variable');
}

const quoteText = quote.map((line) => line.text).join(' ');

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'assets', 'audio');
const outputPath = path.join(outputDir, `${clipId}-voice.mp3`);

async function generateVoice(): Promise<void> {
	console.log(`Generating voice for ${clipId}...`);

	const response = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
		{
			method: 'POST',
			headers: {
				'xi-api-key': apiKey,
				'Content-Type': 'application/json',
				Accept: 'audio/mpeg',
			},
			body: JSON.stringify({
				text: quoteText,
				model_id: 'eleven_multilingual_v2',
				voice_settings: {
					stability: 0.5,
					similarity_boost: 0.75,
				},
			}),
		},
	);

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`ElevenLabs API error (${response.status}): ${errorBody}`);
	}

	await fs.mkdir(outputDir, {recursive: true});
	await fs.writeFile(outputPath, Buffer.from(await response.arrayBuffer()));

	console.log(`Saved assets/audio/${clipId}-voice.mp3`);
}

generateVoice().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`\nVoice generation failed: ${message}`);
	process.exit(1);
});
