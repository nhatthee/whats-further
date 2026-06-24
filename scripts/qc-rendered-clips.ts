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

const DEFAULT_CLIP_IDS = Array.from({length: 20}, (_, index) =>
	String(index + 21).padStart(3, '0'),
);

const EXPECTED_VIDEO_DURATION_SECONDS = 11.78;
const VIDEO_DURATION_TOLERANCE_SECONDS = 0.15;
const AUDIO_MUX_TOLERANCE_SECONDS = 0.1;
const TIME_TOLERANCE_SECONDS = 0.001;
const BLOCK_COUNT = 5;
const FPS = 30;
const FADE_FRAMES = 6;
const HIGHLIGHT_SAMPLE_STEP_SECONDS = 0.05;

const TEMPLATE_BLOCKS = [
	{startSeconds: 0.0, endSeconds: 1.4},
	{startSeconds: 1.4, endSeconds: 4.6},
	{startSeconds: 4.6, endSeconds: 6.7},
	{startSeconds: 6.7, endSeconds: 10.0},
	{startSeconds: 10.0, endSeconds: 11.78},
] as const;

const STRICT_VOICE_FAIL_MAX_SECONDS = 10.8;
const STRICT_VOICE_WARN_MAX_SECONDS = 11.2;
const STRICT_VOICE_PASS_MAX_SECONDS = 11.78;
const STRICT_FINAL_END_FAIL_MAX_SECONDS = 10.8;
const STRICT_FINAL_END_WARN_MAX_SECONDS = 11.1;
const STRICT_BLOCK_START_EARLY_MAX_SECONDS = 0.65;
const STRICT_BLOCK_START_LATE_MAX_SECONDS = 0.85;
const STRICT_BLOCK_END_EARLY_MAX_SECONDS = 0.85;
const STRICT_BLOCK_END_LATE_MAX_SECONDS = 0.35;
const STRICT_BLOCK5_MIN_START_SECONDS = 9.75;
const MANUAL_TIMING_DIVERGENCE_SECONDS = 0.25;

const rootDir = process.cwd();
const rendersDir = path.join(rootDir, 'renders');
const subtitlesDir = path.join(rootDir, 'assets', 'subtitles');
const whisperxDir = path.join(subtitlesDir, 'whisperx');
const audioDir = path.join(rootDir, 'assets', 'audio');

type ClipStatus = 'pass' | 'warn' | 'fail';

type WhisperXWord = {
	word: string;
	start: number;
	end: number;
	score?: number;
};

type WhisperXJson = {
	word_segments?: WhisperXWord[];
	segments?: Array<{words?: WhisperXWord[]}>;
};

type BlockSpokenMapping = {
	blockIndex: number;
	block: QuoteLine;
	quoteWords: string[];
	spokenWords: WhisperXWord[];
};

type StrictAlignmentResult = {
	ok: boolean;
	failures: string[];
	warnings: string[];
	diagnosisLines: string[];
	diagnosis: string;
	voiceDurationSeconds: number | null;
	finalSpokenEndSeconds: number | null;
	blockSpokenStarts: Array<{
		blockIndex: number;
		spokenStart: number | null;
		expectedStart: number;
	}>;
};

type ClipQcResult = {
	clipId: string;
	status: ClipStatus;
	failures: string[];
	warnings: string[];
	renderExists: boolean;
	videoDurationOk: boolean;
	audioOk: boolean;
	quoteBlocksOk: boolean;
	goldHighlightsOk: boolean;
	strictAlignmentOk: boolean;
	readyForUpload: boolean;
	blockCoverage: boolean[];
	strictDiagnosisLines: string[];
	strictDiagnosis: string;
};

const parseArgs = (): {clipIds: string[]; strictMode: boolean} => {
	const argv = process.argv.slice(2);
	let strictMode = true;

	if (argv.includes('--no-strict') || argv.includes('--legacy')) {
		strictMode = false;
	} else if (argv.includes('--strict')) {
		strictMode = true;
	}

	const clipArgs = argv
		.filter((arg) => !arg.startsWith('--'))
		.map((clipId) => clipId.padStart(3, '0'));

	return {
		clipIds: clipArgs.length > 0 ? clipArgs : DEFAULT_CLIP_IDS,
		strictMode,
	};
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

const mapBlocksToSpokenWords = (
	lines: QuoteLine[],
	spokenWords: WhisperXWord[],
): BlockSpokenMapping[] => {
	let offset = 0;

	return lines.map((block, blockIndex) => {
		const quoteWords = splitIntoWords(block.text);
		const blockSpoken = spokenWords.slice(offset, offset + quoteWords.length);
		offset += quoteWords.length;

		return {
			blockIndex,
			block,
			quoteWords,
			spokenWords: blockSpoken,
		};
	});
};

const getQuoteWordSequence = (lines: QuoteLine[]): string[] =>
	lines.flatMap((line) =>
		splitIntoWords(line.text).map((word) => normalizeSpokenWord(word)),
	);

const getSpokenWordSequence = (spokenWords: WhisperXWord[]): string[] =>
	spokenWords.map((word) => normalizeSpokenWord(word.word));

const detectManualTimingDivergence = (
	manualWords: WordTiming[] | undefined,
	whisperWords: WhisperXWord[] | undefined,
): string[] => {
	if (!manualWords || !whisperWords) {
		return [];
	}

	const warnings: string[] = [];
	const comparableCount = Math.min(manualWords.length, whisperWords.length);
	let divergentCount = 0;

	for (let index = 0; index < comparableCount; index++) {
		const manual = manualWords[index];
		const whisper = whisperWords[index];

		if (
			Math.abs(manual.start - whisper.start) >
				MANUAL_TIMING_DIVERGENCE_SECONDS ||
			Math.abs(manual.end - whisper.end) > MANUAL_TIMING_DIVERGENCE_SECONDS
		) {
			divergentCount++;
		}
	}

	if (divergentCount > 0) {
		warnings.push(
			`Manual words.json diverges from WhisperX on ${divergentCount} word(s); strict alignment uses WhisperX only`,
		);
	}

	return warnings;
};

const buildStrictDiagnosis = (
	voiceDurationSeconds: number | null,
	finalSpokenEndSeconds: number | null,
	failures: string[],
): string => {
	const reasons: string[] = [];

	if (
		voiceDurationSeconds !== null &&
		voiceDurationSeconds < STRICT_VOICE_FAIL_MAX_SECONDS
	) {
		reasons.push('Voice too fast / regenerate voice');
	}

	if (
		finalSpokenEndSeconds !== null &&
		finalSpokenEndSeconds < STRICT_FINAL_END_FAIL_MAX_SECONDS
	) {
		if (!reasons.includes('Voice too fast / regenerate voice')) {
			reasons.push('Voice ends before subtitles finish');
		}
	}

	if (
		failures.some((failure) => failure.includes('Transcript mismatch')) ||
		failures.some((failure) => failure.includes('spoken transcript mismatch'))
	) {
		reasons.push('Quote text does not match spoken transcript');
	}

	if (
		failures.some((failure) =>
			failure.includes('Block 5 first spoken word must start'),
		)
	) {
		reasons.push('Final block speech too early');
	}

	if (
		failures.some((failure) => failure.startsWith('Block ') && failure.includes('start'))
	) {
		if (!reasons.includes('Voice too fast / regenerate voice')) {
			reasons.push('Block speech starts outside subtitle windows');
		}
	}

	if (
		failures.some((failure) => failure.startsWith('Block ') && failure.includes('end'))
	) {
		if (!reasons.includes('Voice ends before subtitles finish')) {
			reasons.push('Block speech ends outside subtitle windows');
		}
	}

	if (reasons.length === 0) {
		return 'Strict voice/block alignment failed';
	}

	return reasons.join(' / ');
};

const checkStrictVoiceAlignment = (
	clipId: string,
	lines: QuoteLine[],
): StrictAlignmentResult => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const diagnosisLines: string[] = [];

	const whisperWords = loadWhisperXWords(clipId);
	if (!whisperWords || whisperWords.length === 0) {
		return {
			ok: false,
			failures: [`Missing WhisperX timing: assets/subtitles/whisperx/${clipId}-voice.json`],
			warnings: [],
			diagnosisLines: [],
			diagnosis: 'Missing WhisperX voice timing',
			voiceDurationSeconds: null,
			finalSpokenEndSeconds: null,
			blockSpokenStarts: [],
		};
	}

	const voiceDurationSeconds = getVoiceDurationSeconds(clipId);
	const finalSpokenEndSeconds =
		whisperWords[whisperWords.length - 1]?.end ?? null;

	if (voiceDurationSeconds !== null) {
		diagnosisLines.push(
			`Voice duration: ${voiceDurationSeconds.toFixed(3)}s`,
		);

		if (voiceDurationSeconds < STRICT_VOICE_FAIL_MAX_SECONDS) {
			failures.push(
				`Voice duration ${voiceDurationSeconds.toFixed(3)}s is below ${STRICT_VOICE_FAIL_MAX_SECONDS}s`,
			);
		} else if (voiceDurationSeconds < STRICT_VOICE_WARN_MAX_SECONDS) {
			warnings.push(
				`Voice duration ${voiceDurationSeconds.toFixed(3)}s is short (${STRICT_VOICE_FAIL_MAX_SECONDS}-${STRICT_VOICE_WARN_MAX_SECONDS}s)`,
			);
		} else if (voiceDurationSeconds > STRICT_VOICE_PASS_MAX_SECONDS) {
			failures.push(
				`Voice duration ${voiceDurationSeconds.toFixed(3)}s exceeds ${STRICT_VOICE_PASS_MAX_SECONDS}s`,
			);
		}
	} else {
		failures.push(`Missing voice audio: assets/audio/${clipId}-voice.mp3`);
	}

	if (finalSpokenEndSeconds !== null) {
		diagnosisLines.push(
			`Final spoken word end: ${finalSpokenEndSeconds.toFixed(3)}s`,
		);

		if (finalSpokenEndSeconds < STRICT_FINAL_END_FAIL_MAX_SECONDS) {
			failures.push(
				`Final spoken word ends at ${finalSpokenEndSeconds.toFixed(3)}s (must be >= ${STRICT_FINAL_END_FAIL_MAX_SECONDS}s)`,
			);
		} else if (finalSpokenEndSeconds < STRICT_FINAL_END_WARN_MAX_SECONDS) {
			warnings.push(
				`Final spoken word ends at ${finalSpokenEndSeconds.toFixed(3)}s (warn below ${STRICT_FINAL_END_WARN_MAX_SECONDS}s)`,
			);
		}
	}

	const quoteWords = getQuoteWordSequence(lines);
	const spokenWords = getSpokenWordSequence(whisperWords);

	if (quoteWords.length !== spokenWords.length) {
		failures.push(
			`Transcript mismatch: quote has ${quoteWords.length} words, WhisperX has ${spokenWords.length}`,
		);
	} else {
		const mismatches: string[] = [];

		for (let index = 0; index < quoteWords.length; index++) {
			if (quoteWords[index] !== spokenWords[index]) {
				mismatches.push(`"${quoteWords[index]}" vs spoken "${spokenWords[index]}"`);
			}
		}

		if (mismatches.length > 0) {
			const preview = mismatches.slice(0, 4).join(', ');
			const suffix = mismatches.length > 4 ? '...' : '';
			failures.push(
				`Transcript mismatch: quote words and spoken transcript differ (${preview}${suffix})`,
			);
		}
	}

	const blockMappings = mapBlocksToSpokenWords(lines, whisperWords);
	const blockSpokenStarts: StrictAlignmentResult['blockSpokenStarts'] = [];

	for (const mapping of blockMappings) {
		const blockNumber = mapping.blockIndex + 1;
		const firstSpoken = mapping.spokenWords[0];
		const lastSpoken = mapping.spokenWords[mapping.spokenWords.length - 1];
		const expectedStart = mapping.block.startSeconds;
		const expectedEnd = mapping.block.endSeconds;

		blockSpokenStarts.push({
			blockIndex: mapping.blockIndex,
			spokenStart: firstSpoken?.start ?? null,
			expectedStart,
		});

		if (!firstSpoken || !lastSpoken) {
			failures.push(
				`Block ${blockNumber} has no spoken words mapped from WhisperX`,
			);
			diagnosisLines.push(
				`Block ${blockNumber} spoken start: missing vs expected ${expectedStart.toFixed(1)}s`,
			);
			continue;
		}

		const startDelta = firstSpoken.start - expectedStart;
		const endDelta = lastSpoken.end - expectedEnd;

		if (startDelta < -STRICT_BLOCK_START_EARLY_MAX_SECONDS) {
			failures.push(
				`Block ${blockNumber} spoken start ${firstSpoken.start.toFixed(3)}s is ${Math.abs(startDelta).toFixed(3)}s before block start ${expectedStart.toFixed(3)}s`,
			);
		} else if (startDelta > STRICT_BLOCK_START_LATE_MAX_SECONDS) {
			failures.push(
				`Block ${blockNumber} spoken start ${firstSpoken.start.toFixed(3)}s is ${startDelta.toFixed(3)}s after block start ${expectedStart.toFixed(3)}s`,
			);
		}

		if (endDelta < -STRICT_BLOCK_END_EARLY_MAX_SECONDS) {
			failures.push(
				`Block ${blockNumber} spoken end ${lastSpoken.end.toFixed(3)}s is ${Math.abs(endDelta).toFixed(3)}s before block end ${expectedEnd.toFixed(3)}s`,
			);
		} else if (endDelta > STRICT_BLOCK_END_LATE_MAX_SECONDS) {
			failures.push(
				`Block ${blockNumber} spoken end ${lastSpoken.end.toFixed(3)}s is ${endDelta.toFixed(3)}s after block end ${expectedEnd.toFixed(3)}s`,
			);
		}

		if (blockNumber >= 3) {
			const expectedLabel =
				blockNumber === 5
					? `>= ${STRICT_BLOCK5_MIN_START_SECONDS.toFixed(2)}s`
					: `${expectedStart.toFixed(1)}s`;
			diagnosisLines.push(
				`Block ${blockNumber} spoken start: ${firstSpoken.start.toFixed(3)}s vs expected ${expectedLabel}`,
			);
		}
	}

	const block5 = blockMappings[4];
	const block5FirstSpoken = block5?.spokenWords[0];

	if (!block5FirstSpoken) {
		failures.push('Block 5 has no real spoken words');
	} else if (block5FirstSpoken.start < STRICT_BLOCK5_MIN_START_SECONDS) {
		failures.push(
			`Block 5 first spoken word must start >= ${STRICT_BLOCK5_MIN_START_SECONDS}s (got ${block5FirstSpoken.start.toFixed(3)}s)`,
		);
	}

	if (block5 && block5.spokenWords.length > 0 && block5FirstSpoken) {
		const block5Start = block5.block.startSeconds;
		const spokenDuringBlock5 = block5.spokenWords.some(
			(word) => word.start >= block5Start - TIME_TOLERANCE_SECONDS,
		);

		if (!spokenDuringBlock5) {
			failures.push(
				`Block 5 text is not spoken during block 5 window (first spoken at ${block5FirstSpoken.start.toFixed(3)}s, block starts ${block5Start.toFixed(3)}s)`,
			);
		}
	}

	const manualWords = loadWordTimings(clipId);
	warnings.push(...detectManualTimingDivergence(manualWords, whisperWords));

	const diagnosis = buildStrictDiagnosis(
		voiceDurationSeconds,
		finalSpokenEndSeconds,
		failures,
	);

	if (failures.length > 0) {
		diagnosisLines.push(`Diagnosis: ${diagnosis}`);
	}

	return {
		ok: failures.length === 0,
		failures,
		warnings,
		diagnosisLines,
		diagnosis,
		voiceDurationSeconds,
		finalSpokenEndSeconds,
		blockSpokenStarts,
	};
};

const checkQuoteBlocks = (lines: QuoteLine[]): {
	failures: string[];
	warnings: string[];
	ok: boolean;
} => {
	const failures: string[] = [];
	const warnings: string[] = [];

	if (lines.length !== BLOCK_COUNT) {
		failures.push(
			`Expected ${BLOCK_COUNT} quote blocks, found ${lines.length}`,
		);
		return {failures, warnings, ok: false};
	}

	for (let index = 0; index < BLOCK_COUNT; index++) {
		const actual = lines[index];
		const expected = TEMPLATE_BLOCKS[index];

		if (
			Math.abs(actual.startSeconds - expected.startSeconds) >
			TIME_TOLERANCE_SECONDS
		) {
			failures.push(
				`Block ${index + 1} starts at ${actual.startSeconds}s (expected ${expected.startSeconds}s)`,
			);
		}

		if (
			Math.abs(actual.endSeconds - expected.endSeconds) >
			TIME_TOLERANCE_SECONDS
		) {
			failures.push(
				`Block ${index + 1} ends at ${actual.endSeconds}s (expected ${expected.endSeconds}s)`,
			);
		}
	}

	return {failures, warnings, ok: failures.length === 0};
};

type HighlightAnalysis = {
	blockCoverage: boolean[];
	firstHighlightTime: number | null;
	lastHighlightTime: number | null;
	finalWordHighlighted: boolean;
	warnings: string[];
};

const analyzeHighlights = (
	lines: QuoteLine[],
	wordTimings: WordTiming[] | undefined,
	videoDurationSeconds: number,
): HighlightAnalysis => {
	const warnings: string[] = [];
	const blockCoverage = Array.from({length: lines.length}, () => false);
	let firstHighlightTime: number | null = null;
	let lastHighlightTime: number | null = null;
	let finalWordHighlighted = false;

	if (!wordTimings) {
		warnings.push('Missing word timings — cannot verify gold highlights');
		return {
			blockCoverage,
			firstHighlightTime,
			lastHighlightTime,
			finalWordHighlighted: false,
			warnings,
		};
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
		let blockHighlighted = false;

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

			if (!highlighted) {
				continue;
			}

			blockHighlighted = true;
			firstHighlightTime =
				firstHighlightTime === null
					? currentSeconds
					: Math.min(firstHighlightTime, currentSeconds);
			lastHighlightTime =
				lastHighlightTime === null
					? currentSeconds
					: Math.max(lastHighlightTime, currentSeconds);

			if (isLastBlock && wordIndex === words.length - 1) {
				finalWordHighlighted = true;
			}

			const timing = wordTimings[wordTimingStartIndex + wordIndex];
			const spokenOverlap =
				timing &&
				currentSeconds >= timing.start - 0.18 &&
				currentSeconds <= timing.end + 0.18;

			if (timing && !spokenOverlap) {
				warnings.push(
					`Gold highlight at ${currentSeconds.toFixed(3)}s for "${words[wordIndex]}" does not overlap spoken timing ${timing.start.toFixed(3)}-${timing.end.toFixed(3)}s`,
				);
			}
		}

		if (blockHighlighted) {
			blockCoverage[activeBlockIndex] = true;
		}
	}

	if (
		firstHighlightTime !== null &&
		firstHighlightTime < lines[0].startSeconds - TIME_TOLERANCE_SECONDS
	) {
		warnings.push(
			`First gold highlight begins at ${firstHighlightTime.toFixed(3)}s before block 1 start`,
		);
	}

	if (
		lastHighlightTime !== null &&
		lastHighlightTime > videoDurationSeconds + TIME_TOLERANCE_SECONDS
	) {
		warnings.push(
			`Last gold highlight occurs at ${lastHighlightTime.toFixed(3)}s after video end`,
		);
	}

	for (let blockIndex = 0; blockIndex < blockCoverage.length; blockIndex++) {
		if (!blockCoverage[blockIndex]) {
			warnings.push(`Block ${blockIndex + 1} has no gold highlight coverage`);
		}
	}

	const lastBlock = lines[lines.length - 1];
	const lastWords = splitIntoWords(lastBlock.text);
	const lastWord = lastWords[lastWords.length - 1] ?? '';

	if (!finalWordHighlighted) {
		warnings.push(
			`Final word "${lastWord}" has no gold highlight before video end`,
		);
	}

	return {
		blockCoverage,
		firstHighlightTime,
		lastHighlightTime,
		finalWordHighlighted,
		warnings,
	};
};

const checkClip = (clipId: string, strictMode: boolean): ClipQcResult => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const renderPath = path.join(rendersDir, `${clipId}.mp4`);

	if (!fs.existsSync(renderPath)) {
		return {
			clipId,
			status: 'fail',
			failures: ['Missing render: renders/<clipId>.mp4'],
			warnings: [],
			renderExists: false,
			videoDurationOk: false,
			audioOk: false,
			quoteBlocksOk: false,
			goldHighlightsOk: false,
			strictAlignmentOk: false,
			readyForUpload: false,
			blockCoverage: Array.from({length: BLOCK_COUNT}, () => false),
			strictDiagnosisLines: [],
			strictDiagnosis: '',
		};
	}

	const lines = QUOTES[clipId];
	if (!lines) {
		failures.push('QUOTES entry missing');
	}

	let videoDurationSeconds = getFormatDurationSeconds(renderPath);
	let videoStreamDurationSeconds: number | null = null;
	try {
		videoStreamDurationSeconds = getStreamDurationSeconds(renderPath, 'v:0');
	} catch {
		// use container duration
	}

	const measuredVideoDuration =
		videoStreamDurationSeconds ?? videoDurationSeconds;

	const minDuration =
		EXPECTED_VIDEO_DURATION_SECONDS - VIDEO_DURATION_TOLERANCE_SECONDS;
	const maxDuration =
		EXPECTED_VIDEO_DURATION_SECONDS + VIDEO_DURATION_TOLERANCE_SECONDS;

	let videoDurationOk = true;
	if (
		measuredVideoDuration < minDuration ||
		measuredVideoDuration > maxDuration
	) {
		videoDurationOk = false;
		failures.push(
			`Video duration is ${measuredVideoDuration.toFixed(3)}s (expected ${EXPECTED_VIDEO_DURATION_SECONDS}s ± ${VIDEO_DURATION_TOLERANCE_SECONDS}s)`,
		);
	}

	let audioDurationSeconds = videoDurationSeconds;
	try {
		audioDurationSeconds = getStreamDurationSeconds(renderPath, 'a:0');
	} catch {
		warnings.push('Could not read audio stream duration from rendered mp4');
	}

	let audioOk = true;
	const audioOvershoot =
		audioDurationSeconds - measuredVideoDuration;
	if (audioOvershoot > AUDIO_MUX_TOLERANCE_SECONDS) {
		audioOk = false;
		failures.push(
			`Audio duration ${audioDurationSeconds.toFixed(3)}s exceeds video duration ${measuredVideoDuration.toFixed(3)}s`,
		);
	} else if (audioOvershoot > TIME_TOLERANCE_SECONDS) {
		warnings.push(
			`Audio duration ${audioDurationSeconds.toFixed(3)}s slightly exceeds video stream ${measuredVideoDuration.toFixed(3)}s (mux tolerance)`,
		);
	}

	let quoteBlocksOk = false;
	if (lines) {
		const quoteCheck = checkQuoteBlocks(lines);
		failures.push(...quoteCheck.failures);
		warnings.push(...quoteCheck.warnings);
		quoteBlocksOk = quoteCheck.ok;
	}

	const wordTimings = loadWordTimings(clipId);
	const highlightAnalysis = lines
		? analyzeHighlights(lines, wordTimings, measuredVideoDuration)
		: {
				blockCoverage: Array.from({length: BLOCK_COUNT}, () => false),
				firstHighlightTime: null,
				lastHighlightTime: null,
				finalWordHighlighted: false,
				warnings: ['Cannot analyze highlights without QUOTES entry'],
			};

	warnings.push(...highlightAnalysis.warnings);

	const goldHighlightsOk =
		highlightAnalysis.blockCoverage.every(Boolean) &&
		highlightAnalysis.finalWordHighlighted;

	let strictAlignmentOk = true;
	let strictDiagnosisLines: string[] = [];
	let strictDiagnosis = '';

	if (strictMode && lines) {
		const strictCheck = checkStrictVoiceAlignment(clipId, lines);
		strictAlignmentOk = strictCheck.ok;
		strictDiagnosisLines = strictCheck.diagnosisLines;
		strictDiagnosis = strictCheck.diagnosis;
		failures.push(...strictCheck.failures);
		warnings.push(...strictCheck.warnings);
	} else if (strictMode && !lines) {
		strictAlignmentOk = false;
		failures.push('Cannot run strict voice alignment without QUOTES entry');
	}

	const uniqueFailures = dedupe(failures);
	const uniqueWarnings = dedupe(warnings);
	const status = resolveStatus(uniqueFailures, uniqueWarnings);

	return {
		clipId,
		status,
		failures: uniqueFailures,
		warnings: uniqueWarnings,
		renderExists: true,
		videoDurationOk,
		audioOk,
		quoteBlocksOk,
		goldHighlightsOk,
		strictAlignmentOk,
		readyForUpload: uniqueFailures.length === 0,
		blockCoverage: highlightAnalysis.blockCoverage,
		strictDiagnosisLines,
		strictDiagnosis,
	};
};

const main = (): void => {
	const {clipIds, strictMode} = parseArgs();
	const results = clipIds.map((clipId) => checkClip(clipId, strictMode));

	console.log('Post-Render QC');
	console.log(
		strictMode
			? 'Mode: strict voice/block alignment (WhisperX source of truth)\n'
			: 'Mode: legacy (use --strict for voice/block alignment)\n',
	);

	for (const result of results) {
		console.log(`${statusIcon(result.status)} ${result.clipId}`);

		if (strictMode && result.strictDiagnosisLines.length > 0) {
			for (const line of result.strictDiagnosisLines) {
				console.log(`  ${line}`);
			}
		}

		for (const failure of result.failures) {
			console.log(`  ❌ ${failure}`);
		}
		for (const warning of result.warnings) {
			console.log(`  ⚠️  ${warning}`);
		}

		if (result.blockCoverage.length > 0) {
			const coverage = result.blockCoverage
				.map((covered, index) => `Block ${index + 1} ${covered ? '✓' : '✗'}`)
				.join('  ');
			console.log(`  ${coverage}`);
		}
	}

	const total = results.length;
	const renderedPass = results.filter((result) => result.renderExists).length;
	const audioPass = results.filter((result) => result.audioOk).length;
	const subtitleBlocksPass = results.filter(
		(result) => result.quoteBlocksOk,
	).length;
	const goldHighlightsPass = results.filter(
		(result) => result.goldHighlightsOk,
	).length;
	const strictPass = results.filter((result) => result.strictAlignmentOk).length;
	const readyPass = results.filter((result) => result.readyForUpload).length;
	const failed = results.filter((result) => result.status === 'fail').length;

	console.log('');
	console.log('Summary:');
	console.log(`Rendered Clips: ${renderedPass}/${total}`);
	console.log(`Audio: ${audioPass}/${total}`);
	console.log(`Subtitle Blocks: ${subtitleBlocksPass}/${total}`);
	console.log(`Gold Highlights: ${goldHighlightsPass}/${total}`);
	if (strictMode) {
		console.log(`Strict Voice Alignment: ${strictPass}/${total}`);
	}
	console.log(`Ready For Upload: ${readyPass}/${total}`);

	if (failed > 0) {
		console.log('\nUpload blocked: fix failed clips before publishing.');
		process.exit(1);
	}
};

main();
