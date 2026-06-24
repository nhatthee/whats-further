import {execFileSync} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const TARGET_DURATION_SECONDS = 11.78;
const DURATION_TOLERANCE_SECONDS = 0.02;
const DEFAULT_CLIP_IDS = Array.from({length: 20}, (_, index) =>
	String(index + 21).padStart(3, '0'),
);

const rootDir = process.cwd();
const audioDir = path.join(rootDir, 'assets', 'audio');
const originalsDir = path.join(audioDir, 'originals');

const parseClipIds = (): string[] => {
	const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

	if (args.length === 0) {
		return DEFAULT_CLIP_IDS;
	}

	return args.map((clipId) => clipId.padStart(3, '0'));
};

const getDurationSeconds = (filePath: string): number => {
	const output = execFileSync(
		'ffprobe',
		[
			'-v',
			'error',
			'-show_entries',
			'format=duration',
			'-of',
			'default=noprint_wrappers=1:nokey=1',
			filePath,
		],
		{encoding: 'utf8'},
	);

	const duration = Number.parseFloat(output.trim());

	if (!Number.isFinite(duration)) {
		throw new Error(`Could not read duration for ${filePath}`);
	}

	return duration;
};

const buildAtempoFilter = (tempo: number): string => {
	const filters: string[] = [];
	let remaining = tempo;

	while (remaining > 2.0) {
		filters.push('atempo=2.0');
		remaining /= 2.0;
	}

	while (remaining < 0.5) {
		filters.push('atempo=0.5');
		remaining /= 0.5;
	}

	filters.push(`atempo=${remaining.toFixed(6)}`);
	return filters.join(',');
};

const backupOriginal = (clipId: string, voicePath: string): void => {
	fs.mkdirSync(originalsDir, {recursive: true});

	const backupPath = path.join(originalsDir, `${clipId}-voice.mp3`);

	if (!fs.existsSync(backupPath)) {
		fs.copyFileSync(voicePath, backupPath);
		console.log(`  backup: assets/audio/originals/${clipId}-voice.mp3`);
	}
};

const fitVoiceDuration = (
	clipId: string,
): {
	originalDuration: number;
	newDuration: number;
	tempoFactor: number;
	changed: boolean;
} => {
	const voicePath = path.join(audioDir, `${clipId}-voice.mp3`);

	if (!fs.existsSync(voicePath)) {
		throw new Error(`Missing voice file: assets/audio/${clipId}-voice.mp3`);
	}

	const originalDuration = getDurationSeconds(voicePath);

	if (originalDuration <= TARGET_DURATION_SECONDS + DURATION_TOLERANCE_SECONDS) {
		return {
			originalDuration,
			newDuration: originalDuration,
			tempoFactor: 1,
			changed: false,
		};
	}

	backupOriginal(clipId, voicePath);

	const tempoFactor = originalDuration / TARGET_DURATION_SECONDS;
	const tempPath = path.join(
		os.tmpdir(),
		`whats-further-${clipId}-voice-fitted.mp3`,
	);

	execFileSync(
		'ffmpeg',
		[
			'-y',
			'-i',
			voicePath,
			'-filter:a',
			buildAtempoFilter(tempoFactor),
			'-c:a',
			'libmp3lame',
			'-q:a',
			'2',
			tempPath,
		],
		{stdio: 'pipe'},
	);

	const newDuration = getDurationSeconds(tempPath);
	fs.copyFileSync(tempPath, voicePath);
	fs.rmSync(tempPath, {force: true});

	return {
		originalDuration,
		newDuration,
		tempoFactor,
		changed: true,
	};
};

const main = (): void => {
	const clipIds = parseClipIds();
	const results: Array<{
		clipId: string;
		originalDuration: number;
		newDuration: number;
		tempoFactor: number;
		changed: boolean;
	}> = [];

	console.log(`Fitting voice duration to ${TARGET_DURATION_SECONDS}s\n`);

	for (const clipId of clipIds) {
		const result = fitVoiceDuration(clipId);
		results.push({clipId, ...result});

		if (result.changed) {
			console.log(
				`${clipId}: ${result.originalDuration.toFixed(3)}s -> ${result.newDuration.toFixed(3)}s (tempo x${result.tempoFactor.toFixed(4)})`,
			);
		} else {
			console.log(
				`${clipId}: ${result.originalDuration.toFixed(3)}s (unchanged, already <= ${TARGET_DURATION_SECONDS}s)`,
			);
		}
	}

	console.log('\nVerification:');

	let allWithinTarget = true;

	for (const result of results) {
		const withinTarget =
			result.newDuration <= TARGET_DURATION_SECONDS + DURATION_TOLERANCE_SECONDS;

		if (!withinTarget) {
			allWithinTarget = false;
		}

		console.log(
			`  ${result.clipId}: ${result.newDuration.toFixed(3)}s ${withinTarget ? 'OK' : 'FAIL'}`,
		);
	}

	if (!allWithinTarget) {
		console.error('\nSome clips are still longer than the target duration.');
		process.exit(1);
	}

	console.log(`\nAll ${results.length} clip(s) are <= ${TARGET_DURATION_SECONDS}s.`);
};

main();
