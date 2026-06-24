import {execFileSync} from 'child_process';
import {setTimeout} from 'node:timers/promises';

const BATCH_DELAY_MS = 20_000;

const startClipId = process.argv[2];
const endClipId = process.argv[3];

if (!startClipId || !endClipId) {
	throw new Error('Usage: npm run build-batch -- <startClipId> <endClipId>');
}

const parseClipNumber = (value: string): number => {
	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`Invalid clip ID "${value}". Expected a numeric clip ID.`);
	}

	return parsed;
};

const formatClipId = (clipNumber: number): string =>
	String(clipNumber).padStart(3, '0');

const start = parseClipNumber(startClipId);
const end = parseClipNumber(endClipId);

if (start > end) {
	throw new Error(
		`Invalid range: start clip ID "${formatClipId(start)}" is after end "${formatClipId(end)}".`,
	);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const clipIds = Array.from({length: end - start + 1}, (_, index) =>
	formatClipId(start + index),
);

const runBuildClip = (clipId: string): void => {
	execFileSync(npmCmd, ['run', 'build-clip', '--', clipId], {
		stdio: 'inherit',
		cwd: process.cwd(),
	});
};

const rangeLabel = `${formatClipId(start)}–${formatClipId(end)}`;

async function main(): Promise<void> {
	console.log(`\nBuilding batch ${rangeLabel}\n`);

	for (let index = 0; index < clipIds.length; index++) {
		const clipId = clipIds[index];

		console.log(`[${clipId}] Starting...`);
		runBuildClip(clipId);
		console.log(`[${clipId}] Complete`);

		if (index < clipIds.length - 1) {
			console.log('Waiting 20 seconds...');
			await setTimeout(BATCH_DELAY_MS);
		}
	}

	console.log(`\nBatch complete: ${rangeLabel}`);
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
