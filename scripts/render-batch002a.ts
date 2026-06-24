import fs from 'fs';
import path from 'path';
import {
	BATCH_002A_CLIP_IDS,
	readOriginalQuoteReel,
	renderClip,
	restoreQuoteReel,
} from './render-utils';

const RENDERS_DIR = path.join(process.cwd(), 'renders');

async function renderBatch002a(): Promise<void> {
	const originalQuoteReel = readOriginalQuoteReel();
	const rendered: string[] = [];

	console.log('Rendering Batch 002A (007-013)...');

	try {
		for (const clipId of BATCH_002A_CLIP_IDS) {
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

	console.log('\nBatch 002A render complete.');
}

renderBatch002a().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`\nBatch 002A render failed: ${message}`);
	process.exit(1);
});
