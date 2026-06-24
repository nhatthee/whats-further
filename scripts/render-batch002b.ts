import fs from 'fs';
import path from 'path';
import {
	BATCH_002B_CLIP_IDS,
	readOriginalQuoteReel,
	readOriginalRoot,
	renderClip,
	restoreQuoteReel,
	restoreRoot,
} from './render-utils';

const RENDERS_DIR = path.join(process.cwd(), 'renders');

async function renderBatch002b(): Promise<void> {
	const originalQuoteReel = readOriginalQuoteReel();
	const originalRoot = readOriginalRoot();
	const rendered: string[] = [];

	console.log('Rendering Batch 002B (014-020)...');

	try {
		for (const clipId of BATCH_002B_CLIP_IDS) {
			renderClip(clipId, originalQuoteReel, originalRoot);
			rendered.push(`${clipId}.mp4`);
		}
	} finally {
		restoreQuoteReel(originalQuoteReel);
		restoreRoot(originalRoot);
	}

	console.log('\nRendered:');
	for (const file of rendered) {
		const outputPath = path.join(RENDERS_DIR, file);
		if (!fs.existsSync(outputPath)) {
			throw new Error(`Missing render output: renders/${file}`);
		}
		console.log(`  renders/${file}`);
	}

	console.log('\nBatch 002B render complete.');
}

renderBatch002b().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`\nBatch 002B render failed: ${message}`);
	process.exit(1);
});
