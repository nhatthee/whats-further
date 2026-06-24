import {execFileSync, execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {getImageAssetRelativePath} from '../src/lib/getImagePath';
import {QUOTES} from '../src/quotes';
import {buildMfaQuoteSchedule, MFA_END_PADDING_SECONDS} from '../src/subtitle-schedule';

export const BATCH_001_CLIP_IDS = [
	'001',
	'002',
	'003',
	'004',
	'005',
	'006',
] as const;

export const BATCH_002A_CLIP_IDS = [
	'007',
	'008',
	'009',
	'010',
	'011',
	'012',
	'013',
] as const;

export const BATCH_002B_CLIP_IDS = [
	'014',
	'015',
	'016',
	'017',
	'018',
	'019',
	'020',
] as const;

const QUOTE_REEL_PATH = path.join(process.cwd(), 'src', 'QuoteReel.tsx');
const ROOT_PATH = path.join(process.cwd(), 'src', 'Root.tsx');
const CACHE_DIR = path.join(process.cwd(), 'node_modules', '.cache');
const ASSETS_DIR = path.join(process.cwd(), 'assets');
const RENDERS_DIR = path.join(process.cwd(), 'renders');
const DEFAULT_DURATION_FRAMES = 354;
const FPS = 30;

/** Clip-specific composition length overrides (frame count at 30fps). */
const CLIP_DURATION_FRAMES: Partial<Record<string, number>> = {
	'007': 363,
	'015': 367,
};

const getVoiceDurationSeconds = (voicePath: string): number | undefined => {
	try {
		const output = execFileSync(
			'ffprobe',
			[
				'-v',
				'error',
				'-show_entries',
				'format=duration',
				'-of',
				'default=noprint_wrappers=1:nokey=1',
				voicePath,
			],
			{encoding: 'utf8'},
		);
		const duration = Number.parseFloat(output.trim());

		if (!Number.isFinite(duration)) {
			return undefined;
		}

		return duration;
	} catch {
		return undefined;
	}
};

const getWordsJsonDurationSeconds = (clipId: string): number | undefined => {
	const wordsPath = path.join(ASSETS_DIR, 'subtitles', `${clipId}-words.json`);

	if (!fs.existsSync(wordsPath)) {
		return undefined;
	}

	try {
		const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8')) as Array<{
			end?: number;
		}>;
		const lastEnd = words[words.length - 1]?.end;

		if (typeof lastEnd !== 'number' || !Number.isFinite(lastEnd)) {
			return undefined;
		}

		return lastEnd + MFA_END_PADDING_SECONDS;
	} catch {
		return undefined;
	}
};

const getDurationFrames = (clipId: string): number => {
	if (CLIP_DURATION_FRAMES[clipId]) {
		return CLIP_DURATION_FRAMES[clipId]!;
	}

	const voicePath = path.join(ASSETS_DIR, 'audio', `${clipId}-voice.mp3`);
	const voiceDuration = fs.existsSync(voicePath)
		? getVoiceDurationSeconds(voicePath)
		: undefined;
	const wordsDuration = getWordsJsonDurationSeconds(clipId);
	const measuredDuration = Math.max(voiceDuration ?? 0, wordsDuration ?? 0);

	if (measuredDuration > 0) {
		return Math.max(1, Math.ceil(measuredDuration * FPS));
	}

	return DEFAULT_DURATION_FRAMES;
};

const setClipId = (content: string, clipId: string): string =>
	content.replace(/const CLIP_ID = '[^']+';/, `const CLIP_ID = '${clipId}';`);

const setDurationFrames = (content: string, frames: number): string =>
	content.replace(
		/durationInFrames=\{\d+\}/,
		`durationInFrames={${frames}}`,
	);

const clearBundleCache = (): void => {
	fs.rmSync(CACHE_DIR, {recursive: true, force: true});
};

const assertClipAssets = (clipId: string): void => {
	const imageRelativePath = getImageAssetRelativePath(clipId);
	const imagePath = path.join(ASSETS_DIR, imageRelativePath);
	const voicePath = path.join(ASSETS_DIR, 'audio', `${clipId}-voice.mp3`);

	if (!fs.existsSync(imagePath)) {
		throw new Error(`Missing image: assets/${imageRelativePath}`);
	}

	if (!fs.existsSync(voicePath)) {
		throw new Error(`Missing voice: assets/audio/${clipId}-voice.mp3`);
	}

	if (!QUOTES[clipId]) {
		throw new Error(`Missing QUOTES entry: QUOTES["${clipId}"]`);
	}
};

const logSubtitleTimingDebug = (clipId: string): void => {
	if (process.env.DEBUG_SUBTITLE_TIMING !== 'true') {
		return;
	}

	const wordsPath = path.join(ASSETS_DIR, 'subtitles', `${clipId}-words.json`);

	if (!fs.existsSync(wordsPath)) {
		console.warn(
			`[subtitle-timing] Missing word timings: assets/subtitles/${clipId}-words.json`,
		);
		return;
	}

	const wordTimings = JSON.parse(fs.readFileSync(wordsPath, 'utf8')) as Array<{
		text: string;
		start: number;
		end: number;
	}>;

	buildMfaQuoteSchedule(QUOTES[clipId], wordTimings, clipId);
};

export const renderClip = (
	clipId: string,
	originalQuoteReel: string,
	originalRoot?: string,
): void => {
	assertClipAssets(clipId);

	const imageRelativePath = getImageAssetRelativePath(clipId);
	const subtitles = QUOTES[clipId];
	const durationFrames = getDurationFrames(clipId);
	console.log(`\nRendering clip ${clipId}...`);
	console.log(`  image: ${imageRelativePath}`);
	console.log(`  voice: audio/${clipId}-voice.mp3`);
	console.log(`  subtitles: QUOTES["${clipId}"] (${subtitles.length} blocks)`);
	console.log(`  duration: ${durationFrames} frames`);

	logSubtitleTimingDebug(clipId);

	fs.writeFileSync(
		QUOTE_REEL_PATH,
		setClipId(originalQuoteReel, clipId),
		'utf8',
	);

	if (originalRoot) {
		fs.writeFileSync(
			ROOT_PATH,
			setDurationFrames(originalRoot, durationFrames),
			'utf8',
		);
	}

	clearBundleCache();

	fs.mkdirSync(RENDERS_DIR, {recursive: true});

	execSync(
		`npx remotion render src/index.ts QuoteReel renders/${clipId}.mp4 --crf=28`,
		{stdio: 'inherit', cwd: process.cwd()},
	);
};

export const readOriginalQuoteReel = (): string =>
	fs.readFileSync(QUOTE_REEL_PATH, 'utf8');

export const readOriginalRoot = (): string =>
	fs.readFileSync(ROOT_PATH, 'utf8');

export const restoreQuoteReel = (originalQuoteReel: string): void => {
	fs.writeFileSync(QUOTE_REEL_PATH, originalQuoteReel, 'utf8');
};

export const restoreRoot = (originalRoot: string): void => {
	fs.writeFileSync(ROOT_PATH, originalRoot, 'utf8');
};
