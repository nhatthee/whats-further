import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';

const BATCH_CLIP_IDS = ['001', '002', '003', '004', '005', '006'] as const;

const rootDir = process.cwd();
const generateScriptPath = path.join(
	rootDir,
	'scripts',
	'generate-subtitles.ts',
);

const wordsJsonPath = (clipId: string): string =>
	path.join(rootDir, 'assets', 'subtitles', `${clipId}-words.json`);

const assertWordsJson = (clipId: string): void => {
	const filePath = wordsJsonPath(clipId);
	const relativePath = path.relative(rootDir, filePath);

	if (!fs.existsSync(filePath)) {
		throw new Error(`Missing word timing JSON: ${relativePath}`);
	}

	const words = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	if (!Array.isArray(words) || words.length === 0) {
		throw new Error(`Word timing JSON is empty: ${relativePath}`);
	}
};

async function generateBatch001(): Promise<void> {
	console.log('Generating Batch 001 subtitles (001-006)...\n');

	for (const clipId of BATCH_CLIP_IDS) {
		execSync(`npx tsx "${generateScriptPath}" ${clipId}`, {
			stdio: 'inherit',
			cwd: rootDir,
		});
		console.log('');
	}

	console.log('Verifying Batch 001 subtitle files...\n');

	for (const clipId of BATCH_CLIP_IDS) {
		assertWordsJson(clipId);
		console.log(`  OK assets/subtitles/${clipId}-words.json`);
	}

	console.log('\nBatch 001 subtitles complete.');
}

generateBatch001().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`\nBatch 001 subtitle generation failed: ${message}`);
	process.exit(1);
});
