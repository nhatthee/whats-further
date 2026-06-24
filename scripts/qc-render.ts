import {execFileSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {getImageAssetRelativePath} from '../src/lib/getImagePath';
import {QUOTES, type QuoteLine} from '../src/quotes';
import {countWordsInText} from '../src/SubtitleAnimationV2';

const BLOCK_COUNT = 5;
const VIDEO_DURATION_SECONDS = 11.78;
const DURATION_TOLERANCE_SECONDS = 0.02;
const TIME_TOLERANCE_SECONDS = 0.001;
const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;
const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, 'assets');

type WordTiming = {
	text: string;
	start: number;
	end: number;
};

type ClipStatus = 'pass' | 'warn' | 'fail';

type ClipQcResult = {
	clipId: string;
	status: ClipStatus;
	failures: string[];
	warnings: string[];
	quoteOk: boolean;
	imageOk: boolean;
	voiceOk: boolean;
	subtitlesOk: boolean;
	ready: boolean;
};

const parseClipIds = (): string[] => {
	const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

	if (args.length > 0) {
		return args.map((clipId) => clipId.padStart(3, '0'));
	}

	return Object.keys(QUOTES).sort();
};

const dedupe = (items: string[]): string[] => [...new Set(items)];

const resolveStatus = (
	failures: string[],
	warnings: string[],
): ClipStatus => {
	if (failures.length > 0) {
		return 'fail';
	}

	if (warnings.length > 0) {
		return 'warn';
	}

	return 'pass';
};

const statusIcon = (status: ClipStatus): string => {
	switch (status) {
		case 'pass':
			return '✅ PASS';
		case 'warn':
			return '⚠️ WARN';
		case 'fail':
			return '❌ FAIL';
	}
};

const getAudioDurationSeconds = (filePath: string): number => {
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
		throw new Error(`Could not read audio duration for ${filePath}`);
	}

	return duration;
};

const checkQuote = (
	clipId: string,
): {failures: string[]; warnings: string[]; ok: boolean} => {
	const failures: string[] = [];
	const lines = QUOTES[clipId];

	if (!lines) {
		failures.push('QUOTES entry missing');
		return {failures, warnings: [], ok: false};
	}

	if (lines.length !== BLOCK_COUNT) {
		failures.push(
			`Expected ${BLOCK_COUNT} subtitle blocks, found ${lines.length}`,
		);
	}

	return {
		failures,
		warnings: [],
		ok: failures.length === 0,
	};
};

const checkBlockTiming = (lines: QuoteLine[]): {
	failures: string[];
	warnings: string[];
} => {
	const failures: string[] = [];
	const warnings: string[] = [];

	if (lines.length === 0) {
		return {failures, warnings};
	}

	if (Math.abs(lines[0].startSeconds - 0) > TIME_TOLERANCE_SECONDS) {
		failures.push(
			`First block must start at 0.0s, found ${lines[0].startSeconds}s`,
		);
	}

	for (let index = 0; index < lines.length - 1; index++) {
		const current = lines[index];
		const next = lines[index + 1];

		if (current.endSeconds > next.startSeconds + TIME_TOLERANCE_SECONDS) {
			failures.push(
				`Blocks ${index + 1} and ${index + 2} overlap (${current.endSeconds}s > ${next.startSeconds}s)`,
			);
		}

		if (current.endSeconds < next.startSeconds - TIME_TOLERANCE_SECONDS) {
			failures.push(
				`Blocks ${index + 1} and ${index + 2} are not sequential (${current.endSeconds}s -> ${next.startSeconds}s)`,
			);
		}
	}

	const lastBlock = lines[lines.length - 1];
	if (lastBlock.endSeconds > VIDEO_DURATION_SECONDS + TIME_TOLERANCE_SECONDS) {
		failures.push(
			`Final block ends at ${lastBlock.endSeconds}s (max ${VIDEO_DURATION_SECONDS}s)`,
		);
	}

	return {failures, warnings};
};

const loadWordTimings = (clipId: string): WordTiming[] | undefined => {
	const wordsPath = path.join(
		assetsDir,
		'subtitles',
		`${clipId}-words.json`,
	);

	if (!fs.existsSync(wordsPath)) {
		return undefined;
	}

	const raw = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

	if (!Array.isArray(raw)) {
		throw new Error(`Invalid word timing JSON: assets/subtitles/${clipId}-words.json`);
	}

	return raw as WordTiming[];
};

const checkWordTimings = (
	lines: QuoteLine[],
	words: WordTiming[],
): {failures: string[]; warnings: string[]} => {
	const failures: string[] = [];
	const warnings: string[] = [];

	let wordIndex = 0;

	for (let blockIndex = 0; blockIndex < lines.length; blockIndex++) {
		const block = lines[blockIndex];
		const blockWordCount = countWordsInText(block.text);

		for (let index = 0; index < blockWordCount; index++) {
			const timing = words[wordIndex];

			if (!timing) {
				warnings.push(
					`Missing word timing for block ${blockIndex + 1}, word ${index + 1}`,
				);
				break;
			}

			if (
				timing.start < 0 ||
				timing.end > VIDEO_DURATION_SECONDS + DURATION_TOLERANCE_SECONDS
			) {
				warnings.push(
					`Word "${timing.text}" timing ${timing.start.toFixed(3)}-${timing.end.toFixed(3)}s is outside video duration`,
				);
			}

			if (timing.start < block.startSeconds - TIME_TOLERANCE_SECONDS) {
				warnings.push(
					`Word "${timing.text}" starts at ${timing.start.toFixed(3)}s before block ${blockIndex + 1} (${block.startSeconds}s)`,
				);
			}

			if (timing.end > block.endSeconds + TIME_TOLERANCE_SECONDS) {
				warnings.push(
					`Word "${timing.text}" ends at ${timing.end.toFixed(3)}s after block ${blockIndex + 1} (${block.endSeconds}s)`,
				);
			}

			wordIndex++;
		}
	}

	if (wordIndex < words.length) {
		warnings.push(
			`Word timing file has ${words.length - wordIndex} extra entries beyond quote blocks`,
		);
	}

	return {failures, warnings};
};

const checkImage = async (
	clipId: string,
): Promise<{failures: string[]; warnings: string[]; ok: boolean}> => {
	const imageRelativePath = getImageAssetRelativePath(clipId);
	const imagePath = path.join(assetsDir, imageRelativePath);
	const failures: string[] = [];
	const warnings: string[] = [];

	if (!fs.existsSync(imagePath)) {
		failures.push(`Missing image: assets/${imageRelativePath}`);
		return {failures, warnings, ok: false};
	}

	try {
		const metadata = await sharp(imagePath).metadata();
		const width = metadata.width ?? 0;
		const height = metadata.height ?? 0;

		if (width === 0 || height === 0) {
			failures.push('Image has invalid dimensions');
			return {failures, warnings, ok: false};
		}

		const aspectRatio = width / height;
		if (Math.abs(aspectRatio - TARGET_ASPECT_RATIO) > 0.01) {
			warnings.push(
				`Image aspect ratio is ${width}x${height}, expected 1080x1920`,
			);
		}
	} catch {
		failures.push('Image failed to load');
		return {failures, warnings, ok: false};
	}

	return {failures, warnings, ok: true};
};

const checkVoice = (
	clipId: string,
): {failures: string[]; warnings: string[]; ok: boolean; duration?: number} => {
	const voicePath = path.join(assetsDir, 'audio', `${clipId}-voice.mp3`);
	const failures: string[] = [];
	const warnings: string[] = [];

	if (!fs.existsSync(voicePath)) {
		failures.push('Missing voice: assets/audio/<clipId>-voice.mp3');
		return {failures, warnings, ok: false};
	}

	const duration = getAudioDurationSeconds(voicePath);

	if (duration > VIDEO_DURATION_SECONDS + DURATION_TOLERANCE_SECONDS) {
		failures.push(
			`Voice duration is ${duration.toFixed(3)}s (max ${VIDEO_DURATION_SECONDS}s)`,
		);
	}

	return {
		failures,
		warnings,
		ok: failures.length === 0,
		duration,
	};
};

const checkClip = async (clipId: string): Promise<ClipQcResult> => {
	const failures: string[] = [];
	const warnings: string[] = [];

	const quoteCheck = checkQuote(clipId);
	failures.push(...quoteCheck.failures);

	const lines = QUOTES[clipId];
	let quoteOk = quoteCheck.ok;

	if (lines) {
		const blockTiming = checkBlockTiming(lines);
		failures.push(...blockTiming.failures);
		warnings.push(...blockTiming.warnings);
		quoteOk = quoteOk && blockTiming.failures.length === 0;
	}

	const imageCheck = await checkImage(clipId);
	failures.push(...imageCheck.failures);
	warnings.push(...imageCheck.warnings);

	const voiceCheck = checkVoice(clipId);
	failures.push(...voiceCheck.failures);
	warnings.push(...voiceCheck.warnings);

	let subtitlesOk = false;
	const words = loadWordTimings(clipId);

	if (!words) {
		warnings.push('Missing word timings: assets/subtitles/<clipId>-words.json');
	} else {
		subtitlesOk = true;
		if (lines) {
			const wordTimingCheck = checkWordTimings(lines, words);
			warnings.push(...wordTimingCheck.warnings);
		}
	}

	const uniqueFailures = dedupe(failures);
	const uniqueWarnings = dedupe(warnings);
	const status = resolveStatus(uniqueFailures, uniqueWarnings);

	return {
		clipId,
		status,
		failures: uniqueFailures,
		warnings: uniqueWarnings,
		quoteOk,
		imageOk: imageCheck.ok,
		voiceOk: voiceCheck.ok,
		subtitlesOk,
		ready: status !== 'fail',
	};
};

const main = async (): Promise<void> => {
	const clipIds = parseClipIds();
	const results: ClipQcResult[] = [];

	for (const clipId of clipIds) {
		results.push(await checkClip(clipId));
	}

	console.log('Pre-Render QC\n');

	for (const result of results) {
		console.log(`${statusIcon(result.status)} ${result.clipId}`);
		for (const failure of result.failures) {
			console.log(`  ❌ ${failure}`);
		}
		for (const warning of result.warnings) {
			console.log(`  ⚠️  ${warning}`);
		}
	}

	const total = results.length;
	const quotePass = results.filter((result) => result.quoteOk).length;
	const imagePass = results.filter((result) => result.imageOk).length;
	const voicePass = results.filter((result) => result.voiceOk).length;
	const subtitlePass = results.filter((result) => result.subtitlesOk).length;
	const readyPass = results.filter((result) => result.ready).length;
	const failed = results.filter((result) => result.status === 'fail').length;

	console.log('');
	console.log('Summary:');
	console.log(`Quotes: ${quotePass}/${total}`);
	console.log(`Images: ${imagePass}/${total}`);
	console.log(`Voice: ${voicePass}/${total}`);
	console.log(`Subtitles: ${subtitlePass}/${total}`);
	console.log(`Ready to render: ${readyPass}/${total}`);

	if (failed > 0) {
		console.log('\nRender blocked: fix failed clips before rendering.');
		process.exit(1);
	}
};

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`\nPre-render QC failed: ${message}`);
	process.exit(1);
});
