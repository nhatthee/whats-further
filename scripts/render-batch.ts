import fs from 'fs';
import path from 'path';
import {
	BATCH_001_CLIP_IDS,
	readOriginalQuoteReel,
	renderClip,
	restoreQuoteReel,
} from './render-utils';

const RENDERS_DIR = path.join(process.cwd(), 'renders');

async function renderBatch001(): Promise<void> {
	const originalQuoteReel = readOriginalQuoteReel();
	const rendered: string[] = [];

	console.log('Rendering Batch 001 (001-006)...');

	try {
		for (const clipId of BATCH_001_CLIP_IDS) {
			renderClip(clipId, originalQuoteReel);
			rendered.push(`${clipId}.mp4`);
		}
	} finally {
		restoreQuoteReel(originalQuoteReel);
	}

	console.log('\nRendered:');
	for (const file of rendered) {
		const outputPath = path.join(RENDERS_DIR, file);
		if (!fs.existsSync(outputPath)) {
			throw new Error(`Missing render output: renders/${file}`);
		}
		console.log(`  renders/${file}`);
	}

	console.log('\nBatch 001 render complete.');
}

renderBatch001().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`\nBatch 001 render failed: ${message}`);
	process.exit(1);
});
