import {execFileSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {QUOTES, type QuoteLine} from '../src/quotes';
import {
	getActiveQuoteIndex,
	getBlockWordOffset,
	isWordActiveInBlock,
	type WordTiming,
} from '../src/SubtitleAnimationV2';

const DEFAULT_CLIP_IDS = ['026', '028', '031', '033', '035', '036', '039'];

const VOICE_PASS_MIN_SECONDS = 10.8;
const VOICE_PASS_MAX_SECONDS = 12.2;
const VOICE_HARD_FAIL_MIN_SECONDS = 10.5;
const VOICE_HARD_FAIL_MAX_SECONDS = 12.5;
const BLOCK5_MIN_START_SECONDS = 9.75;
const FINAL_SPOKEN_MIN_END_SECONDS = 10.8;
const BLOCK_COUNT = 5;
const FPS = 30;
const FADE_FRAMES = 6;
const HIGHLIGHT_SAMPLE_STEP_SECONDS = 0.05;
const TIME_TOLERANCE_SECONDS = 0.001;
const EXPECTED_VIDEO_DURATION_SECONDS = 11.78;

const rootDir = process.cwd();
const rendersDir = path.join(rootDir, 'renders');
const subtitlesDir = path.join(rootDir, 'assets', 'subtitles');
const whisperxDir = path.join(subtitlesDir, 'whisperx');
const audioDir = path.join(rootDir, 'assets', 'audio');

type WhisperXWord = {
	word: string;
	start: number;
	end: number;
};

type WhisperXJson = {
	word_segments?: WhisperXWord[];
	segments?: Array<{words?: WhisperXWord[]}>;
};

type UploadQcResult = {
	clipId: string;
	uploadReady: boolean;
	failures: string[];
	voiceDurationSeconds: number | null;
	block5SpokenStartSeconds: number | null;
	finalSpokenEndSeconds: number | null;
	blockCoverage: boolean[];
};

const parseClipIds = (): string[] => {
	const clipArgs = process.argv
		.slice(2)
		.filter((arg) => !arg.startsWith('--'))
		.map((clipId) => clipId.padStart(3, '0'));

	return clipArgs.length > 0 ? clipArgs : DEFAULT_CLIP_IDS;
};

const splitIntoWords = (text: string): string[] =>
	text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0);

const normalizeSpokenWord = (word: string): string =>
	word.replace(/[^\w']/g, '').toLowerCase();

const buildFrameLines = (schedule: QuoteLine[]) =>
	schedule.map(({startSeconds, endSeconds, text}) => ({
		start: Math.round(startSeconds * FPS),
		end: Math.round(endSeconds * FPS),
		text,
	}));

const getFormatDurationSeconds = (filePath: string): number => {
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
		throw new Error(`Could not read format duration for ${filePath}`);
	}

	return duration;
};

const getStreamDurationSeconds = (
	filePath: string,
	streamSelector: 'v:0' | 'a:0',
): number => {
	const output = execFileSync(
		'ffprobe',
		[
			'-v',
			'error',
			'-select_streams',
			streamSelector,
			'-show_entries',
			'stream=duration',
			'-of',
			'default=noprint_wrappers=1:nokey=1',
			filePath,
		],
		{encoding: 'utf8'},
	);

	const duration = Number.parseFloat(output.trim());

	if (!Number.isFinite(duration)) {
		throw new Error(
			`Could not read ${streamSelector} duration for ${filePath}`,
		);
	}

	return duration;
};

const loadWordTimings = (clipId: string): WordTiming[] | undefined => {
	const wordsPath = path.join(subtitlesDir, `${clipId}-words.json`);

	if (!fs.existsSync(wordsPath)) {
		return undefined;
	}

	return JSON.parse(fs.readFileSync(wordsPath, 'utf8')) as WordTiming[];
};

const loadWhisperXWords = (clipId: string): WhisperXWord[] | undefined => {
	const whisperxPath = path.join(whisperxDir, `${clipId}-voice.json`);

	if (!fs.existsSync(whisperxPath)) {
		return undefined;
	}

	const payload = JSON.parse(
		fs.readFileSync(whisperxPath, 'utf8'),
	) as WhisperXJson;

	if (payload.word_segments && payload.word_segments.length > 0) {
		return payload.word_segments;
	}

	const fromSegments =
		payload.segments?.flatMap((segment) => segment.words ?? []) ?? [];

	return fromSegments.length > 0 ? fromSegments : undefined;
};

const getVoiceDurationSeconds = (clipId: string): number | null => {
	const voicePath = path.join(audioDir, `${clipId}-voice.mp3`);

	if (!fs.existsSync(voicePath)) {
		return null;
	}

	try {
		return getFormatDurationSeconds(voicePath);
	} catch {
		try {
			return getStreamDurationSeconds(voicePath, 'a:0');
		} catch {
			return null;
		}
	}
};

const getQuoteWordSequence = (lines: QuoteLine[]): string[] =>
	lines.flatMap((line) =>
		splitIntoWords(line.text).map((word) => normalizeSpokenWord(word)),
	);

const getSpokenWordSequence = (spokenWords: WhisperXWord[]): string[] =>
	spokenWords.map((word) => normalizeSpokenWord(word.word));

const getBlock5SpokenStart = (
	lines: QuoteLine[],
	spokenWords: WhisperXWord[],
): number | null => {
	let offset = 0;

	for (let blockIndex = 0; blockIndex < lines.length; blockIndex++) {
		const quoteWords = splitIntoWords(lines[blockIndex].text);

		if (blockIndex === lines.length - 1) {
			const block5Spoken = spokenWords.slice(offset, offset + quoteWords.length);
			return block5Spoken[0]?.start ?? null;
		}

		offset += quoteWords.length;
	}

	return null;
};

const checkTranscriptMismatch = (
	lines: QuoteLine[],
	spokenWords: WhisperXWord[],
): string[] => {
	const failures: string[] = [];
	const quoteWords = getQuoteWordSequence(lines);
	const transcriptWords = getSpokenWordSequence(spokenWords);

	if (quoteWords.length !== transcriptWords.length) {
		failures.push(
			`Transcript mismatch: quote has ${quoteWords.length} words, WhisperX has ${transcriptWords.length}`,
		);
		return failures;
	}

	const mismatches: string[] = [];

	for (let index = 0; index < quoteWords.length; index++) {
		if (quoteWords[index] !== transcriptWords[index]) {
			mismatches.push(`"${quoteWords[index]}" vs spoken "${transcriptWords[index]}"`);
		}
	}

	if (mismatches.length > 0) {
		const preview = mismatches.slice(0, 4).join(', ');
		const suffix = mismatches.length > 4 ? '...' : '';
		failures.push(
			`Transcript mismatch: quote words differ from spoken transcript (${preview}${suffix})`,
		);
	}

	return failures;
};

const analyzeGoldHighlights = (
	lines: QuoteLine[],
	wordTimings: WordTiming[] | undefined,
	videoDurationSeconds: number,
): boolean[] => {
	const blockCoverage = Array.from({length: lines.length}, () => false);

	if (!wordTimings) {
		return blockCoverage;
	}

	const frameLines = buildFrameLines(lines);

	for (
		let currentSeconds = 0;
		currentSeconds <= videoDurationSeconds + TIME_TOLERANCE_SECONDS;
		currentSeconds += HIGHLIGHT_SAMPLE_STEP_SECONDS
	) {
		const frame = Math.round(currentSeconds * FPS);
		const activeBlockIndex = getActiveQuoteIndex(
			frame,
			FADE_FRAMES,
			frameLines,
		);

		if (activeBlockIndex < 0) {
			continue;
		}

		const block = lines[activeBlockIndex];
		const words = splitIntoWords(block.text);
		const wordTimingStartIndex = getBlockWordOffset(lines, activeBlockIndex);
		const isLastBlock = activeBlockIndex === lines.length - 1;

		for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
			const highlighted = isWordActiveInBlock(
				words[wordIndex],
				wordIndex,
				currentSeconds,
				wordTimings,
				block.startSeconds,
				block.endSeconds,
				wordTimingStartIndex,
				isLastBlock,
				wordIndex === words.length - 1,
				words,
			);

			if (highlighted) {
				blockCoverage[activeBlockIndex] = true;
			}
		}
	}

	return blockCoverage;
};

const checkClip = (clipId: string): UploadQcResult => {
	const failures: string[] = [];
	const renderPath = path.join(rendersDir, `${clipId}.mp4`);

	if (!fs.existsSync(renderPath)) {
		return {
			clipId,
			uploadReady: false,
			failures: ['Missing render: renders/<clipId>.mp4'],
			voiceDurationSeconds: null,
			block5SpokenStartSeconds: null,
			finalSpokenEndSeconds: null,
			blockCoverage: Array.from({length: BLOCK_COUNT}, () => false),
		};
	}

	const lines = QUOTES[clipId];
	if (!lines) {
		failures.push('QUOTES entry missing');
	}

	const voiceDurationSeconds = getVoiceDurationSeconds(clipId);
	const whisperWords = loadWhisperXWords(clipId);
	const finalSpokenEndSeconds =
		whisperWords && whisperWords.length > 0
			? whisperWords[whisperWords.length - 1].end
			: null;
	const block5SpokenStartSeconds =
		lines && whisperWords
			? getBlock5SpokenStart(lines, whisperWords)
			: null;

	if (voiceDurationSeconds === null) {
		failures.push(`Missing voice audio: assets/audio/${clipId}-voice.mp3`);
	} else {
		if (voiceDurationSeconds < VOICE_HARD_FAIL_MIN_SECONDS) {
			failures.push(
				`Voice duration ${voiceDurationSeconds.toFixed(3)}s is below hard minimum ${VOICE_HARD_FAIL_MIN_SECONDS}s`,
			);
		} else if (voiceDurationSeconds > VOICE_HARD_FAIL_MAX_SECONDS) {
			failures.push(
				`Voice duration ${voiceDurationSeconds.toFixed(3)}s exceeds hard maximum ${VOICE_HARD_FAIL_MAX_SECONDS}s`,
			);
		} else if (
			voiceDurationSeconds < VOICE_PASS_MIN_SECONDS ||
			voiceDurationSeconds > VOICE_PASS_MAX_SECONDS
		) {
			failures.push(
				`Voice duration ${voiceDurationSeconds.toFixed(3)}s is outside upload range ${VOICE_PASS_MIN_SECONDS}-${VOICE_PASS_MAX_SECONDS}s`,
			);
		}
	}

	if (!whisperWords || whisperWords.length === 0) {
		failures.push(
			`Missing WhisperX timing: assets/subtitles/whisperx/${clipId}-voice.json`,
		);
	} else {
		if (finalSpokenEndSeconds !== null) {
			if (finalSpokenEndSeconds < FINAL_SPOKEN_MIN_END_SECONDS) {
				failures.push(
					`Final spoken word ends at ${finalSpokenEndSeconds.toFixed(3)}s (must be >= ${FINAL_SPOKEN_MIN_END_SECONDS}s)`,
				);
			}
		}

		if (block5SpokenStartSeconds === null) {
			failures.push('Block 5 has no real spoken words');
		} else if (block5SpokenStartSeconds < BLOCK5_MIN_START_SECONDS) {
			failures.push(
				`Block 5 first spoken word starts at ${block5SpokenStartSeconds.toFixed(3)}s (must be >= ${BLOCK5_MIN_START_SECONDS}s)`,
			);
		}

		if (lines) {
			failures.push(...checkTranscriptMismatch(lines, whisperWords));
		}
	}

	const wordTimings = loadWordTimings(clipId);
	const blockCoverage = lines
		? analyzeGoldHighlights(lines, wordTimings, EXPECTED_VIDEO_DURATION_SECONDS)
		: Array.from({length: BLOCK_COUNT}, () => false);

	if (!wordTimings) {
		failures.push('Missing word timings: assets/subtitles/<clipId>-words.json');
	}

	for (let blockIndex = 0; blockIndex < blockCoverage.length; blockIndex++) {
		if (!blockCoverage[blockIndex]) {
			failures.push(`Block ${blockIndex + 1} has no gold highlight coverage`);
		}
	}

	const uniqueFailures = [...new Set(failures)];

	return {
		clipId,
		uploadReady: uniqueFailures.length === 0,
		failures: uniqueFailures,
		voiceDurationSeconds,
		block5SpokenStartSeconds,
		finalSpokenEndSeconds,
		blockCoverage,
	};
};

const main = (): void => {
	const clipIds = parseClipIds();
	const results = clipIds.map((clipId) => checkClip(clipId));

	console.log('Upload QC — Production Gate\n');

	for (const result of results) {
		const status = result.uploadReady ? 'UPLOAD READY ✅' : 'UPLOAD BLOCKED ❌';
		console.log(`${status} ${result.clipId}`);

		if (result.voiceDurationSeconds !== null) {
			console.log(`  Voice duration: ${result.voiceDurationSeconds.toFixed(3)}s`);
		}

		if (result.block5SpokenStartSeconds !== null) {
			console.log(
				`  Block 5 spoken start: ${result.block5SpokenStartSeconds.toFixed(3)}s`,
			);
		}

		if (result.finalSpokenEndSeconds !== null) {
			console.log(
				`  Final spoken word end: ${result.finalSpokenEndSeconds.toFixed(3)}s`,
			);
		}

		if (result.blockCoverage.length > 0) {
			const coverage = result.blockCoverage
				.map((covered, index) => `Block ${index + 1} ${covered ? '✓' : '✗'}`)
				.join('  ');
			console.log(`  ${coverage}`);
		}

		for (const failure of result.failures) {
			console.log(`  ❌ ${failure}`);
		}
	}

	const readyCount = results.filter((result) => result.uploadReady).length;
	const blockedCount = results.length - readyCount;

	console.log('');
	console.log('Summary:');
	console.log(`Upload Ready: ${readyCount}/${results.length}`);
	console.log(`Upload Blocked: ${blockedCount}/${results.length}`);

	if (blockedCount > 0) {
		process.exit(1);
	}
};

main();
