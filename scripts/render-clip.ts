import fs from 'fs';
import path from 'path';
import {QUOTES} from '../src/quotes';
import {
	readOriginalQuoteReel,
	readOriginalRoot,
	renderClip,
	restoreQuoteReel,
	restoreRoot,
} from './render-utils';

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npx tsx scripts/render-clip.ts 001');
}

if (!QUOTES[clipId]) {
	throw new Error(`Unsupported clip ID "${clipId}". No QUOTES entry found.`);
}

const outputPath = path.join(process.cwd(), 'renders', `${clipId}.mp4`);
const originalQuoteReel = readOriginalQuoteReel();
const originalRoot = readOriginalRoot();

try {
	renderClip(clipId, originalQuoteReel, originalRoot);
} finally {
	restoreQuoteReel(originalQuoteReel);
	restoreRoot(originalRoot);
}

if (!fs.existsSync(outputPath)) {
	throw new Error(`Missing render output: renders/${clipId}.mp4`);
}

console.log(`\nOutput: renders/${clipId}.mp4`);
