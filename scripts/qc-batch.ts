import {execFileSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {getImageAssetRelativePath} from '../src/lib/getImagePath';
import {QUOTES, type QuoteLine} from '../src/quotes';
import {
	checkQuoteAgainstLibrary,
	loadQuoteLibrary,
	type DuplicateMatch,
	type QuoteLibraryEntry,
} from './check-quote-library';
import {
	checkWhisperxAlignmentQc,
	runAlignmentInvestigations,
	type WhisperxAlignmentQcResult,
	type WhisperxWordSegment,
} from './qc-whisperx-alignment';

const ROOT_DIR = process.cwd();
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const RENDERS_DIR = path.join(ROOT_DIR, 'renders');
const WHISPERX_BIN = path.join(ROOT_DIR, '.venv-whisperx', 'bin', 'whisperx');
const WHISPERX_DIR = path.join(ASSETS_DIR, 'subtitles', 'whisperx');

const BLOCK_COUNT = 5;
const MAX_AUDIO_SECONDS = 11.78;
const AUDIO_WARN_SECONDS = 11.5;
const COMPOSITION_DURATION_SECONDS = 11.78;
const LAST_WORD_SAFETY_MARGIN_SECONDS = 0.3;
const MAX_LAST_WORD_END_SECONDS =
	COMPOSITION_DURATION_SECONDS - LAST_WORD_SAFETY_MARGIN_SECONDS;
const AUDIO_TAIL_FAIL_SECONDS = 11.48;
const AUDIO_TAIL_WARN_SECONDS = 11.3;
const TARGET_RENDER_SECONDS = 11.78;
const RENDER_DURATION_TOLERANCE_SECONDS = 0.15;
const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;
const TARGET_FPS = 30;

const PLACEHOLDER_PATTERNS: RegExp[] = [
	/\bTBD\b/i,
	/\bTODO\b/i,
	/\bFIXME\b/i,
	/\bundefined\b/i,
	/\bplaceholder\b/i,
	/\blorem ipsum\b/i,
	/\[insert\b/i,
	/\bxxx\b/i,
];

type ClipQcResult = {
	clipId: string;
	pass: boolean;
	failures: string[];
	warnings: string[];
	lastWordSafetyFail: boolean;
	audioTailSafetyFail: boolean;
	audioTailSafetyWarn: boolean;
	alignment: WhisperxAlignmentQcResult;
};

type WhisperxJson = {
	word_segments?: WhisperxWordSegment[];
};

const normalizeWord = (word: string): string =>
	word
		.toLowerCase()
		.replace(/[^\w']/g, '')
		.trim();

const tokenizeQuote = (lines: QuoteLine[]): string[] =>
	lines.flatMap((line) =>
		line.text
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0)
			.map(normalizeWord)
			.filter((word) => word.length > 0),
	);

const getClipIds = (): string[] => Object.keys(QUOTES).sort();

const toLibraryEntry = (clipId: string): QuoteLibraryEntry => ({
	id: clipId,
	theme: 'qc',
	quote: QUOTES[clipId].map((line) => line.text),
});

const runFfprobeJson = (filePath: string): Record<string, unknown> => {
	const output = execFileSync(
		'ffprobe',
		[
			'-v',
			'error',
			'-show_entries',
			'format=duration:stream=width,height,r_frame_rate,codec_type',
			'-of',
			'json',
			filePath,
		],
		{encoding: 'utf8'},
	);

	return JSON.parse(output) as Record<string, unknown>;
};

const parseFrameRate = (frameRate: string): number => {
	const [numerator, denominator] = frameRate.split('/').map(Number);
	if (!numerator || !denominator) {
		return Number.NaN;
	}

	return numerator / denominator;
};

const getAudioDurationSeconds = (clipId: string): number => {
	const audioPath = path.join(ASSETS_DIR, 'audio', `${clipId}-voice.mp3`);
	const probe = runFfprobeJson(audioPath);
	const duration = Number((probe.format as {duration?: string})?.duration);

	if (!Number.isFinite(duration)) {
		throw new Error(`Unable to read audio duration for ${clipId}`);
	}

	return duration;
};

const checkQuoteQc = (clipId: string): {failures: string[]; warnings: string[]} => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const lines = QUOTES[clipId];

	if (!lines) {
		failures.push('Quote does not exist in QUOTES');
		return {failures, warnings};
	}

	if (lines.length !== BLOCK_COUNT) {
		failures.push(
			`Expected ${BLOCK_COUNT} subtitle blocks, found ${lines.length}`,
		);
	}

	for (let index = 0; index < lines.length; index++) {
		const text = lines[index].text ?? '';
		const trimmed = text.trim();

		if (trimmed.length === 0) {
			failures.push(`Block ${index + 1} is empty`);
		}

		if (text.includes('undefined')) {
			failures.push(`Block ${index + 1} contains "undefined"`);
		}

		for (const pattern of PLACEHOLDER_PATTERNS) {
			if (pattern.test(text)) {
				failures.push(
					`Block ${index + 1} contains placeholder text: "${trimmed}"`,
				);
				break;
			}
		}
	}

	return {failures, warnings};
};

const formatDuplicateFailure = (match: DuplicateMatch): string => {
	const similarity =
		match.similarity !== undefined
			? ` (${Math.round(match.similarity * 100)}% similar)`
			: '';

	return `[${match.kind}] clip ${match.clipId}${similarity}: ${match.detail}`;
};

const checkDuplicateQc = (
	clipId: string,
	library: QuoteLibraryEntry[],
): {failures: string[]; warnings: string[]} => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const entry = toLibraryEntry(clipId);
	const libraryMatches = checkQuoteAgainstLibrary(entry, library);

	for (const match of libraryMatches) {
		failures.push(formatDuplicateFailure(match));
	}

	const clipIds = getClipIds();
	for (const otherId of clipIds) {
		if (otherId === clipId) {
			continue;
		}

		const otherEntry = toLibraryEntry(otherId);
		const batchMatches = checkQuoteAgainstLibrary(entry, [otherEntry]);

		for (const match of batchMatches) {
			failures.push(formatDuplicateFailure(match));
		}
	}

	return {failures: [...new Set(failures)], warnings};
};

const checkAssetQc = (clipId: string): {failures: string[]; warnings: string[]} => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const imageRelativePath = getImageAssetRelativePath(clipId);
	const imagePath = path.join(ASSETS_DIR, imageRelativePath);
	const audioPath = path.join(ASSETS_DIR, 'audio', `${clipId}-voice.mp3`);

	if (!fs.existsSync(imagePath)) {
		failures.push(`Missing image: assets/${imageRelativePath}`);
	}

	if (!fs.existsSync(audioPath)) {
		failures.push(`Missing voice: assets/audio/${clipId}-voice.mp3`);
	}

	return {failures, warnings};
};

const checkVoiceDurationQc = (
	clipId: string,
): {failures: string[]; warnings: string[]} => {
	const failures: string[] = [];
	const warnings: string[] = [];

	try {
		const duration = getAudioDurationSeconds(clipId);
		const roundedDuration = Math.round(duration * 100) / 100;

		if (roundedDuration > MAX_AUDIO_SECONDS) {
			failures.push(
				`Audio duration ${duration.toFixed(2)}s exceeds ${MAX_AUDIO_SECONDS}s limit`,
			);
		} else if (roundedDuration > AUDIO_WARN_SECONDS) {
			warnings.push(
				`Audio duration ${duration.toFixed(2)}s exceeds ${AUDIO_WARN_SECONDS}s warning threshold`,
			);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		failures.push(message);
	}

	return {failures, warnings};
};

const readWhisperxJson = (clipId: string): WhisperxJson | null => {
	const cachedPath = path.join(WHISPERX_DIR, `${clipId}-voice.json`);

	if (fs.existsSync(cachedPath)) {
		return JSON.parse(fs.readFileSync(cachedPath, 'utf8')) as WhisperxJson;
	}

	return null;
};

const getWhisperxWordSegments = (
	clipId: string,
): WhisperxWordSegment[] | null => {
	let whisperxJson = readWhisperxJson(clipId);

	if (!whisperxJson) {
		try {
			whisperxJson = runWhisperx(clipId);
		} catch {
			return null;
		}
	}

	const wordSegments = whisperxJson.word_segments ?? [];
	return wordSegments.length > 0 ? wordSegments : null;
};

const runWhisperx = (clipId: string): WhisperxJson => {
	if (!fs.existsSync(WHISPERX_BIN)) {
		throw new Error('WhisperX not available and no cached transcript found');
	}

	const voicePath = path.join(ASSETS_DIR, 'audio', `${clipId}-voice.mp3`);
	fs.mkdirSync(WHISPERX_DIR, {recursive: true});

	execFileSync(
		WHISPERX_BIN,
		[
			voicePath,
			'--model',
			'small.en',
			'--language',
			'en',
			'--device',
			'cpu',
			'--compute_type',
			'int8',
			'--output_format',
			'json',
			'--output_dir',
			WHISPERX_DIR,
		],
		{stdio: 'pipe', cwd: ROOT_DIR},
	);

	const output = readWhisperxJson(clipId);
	if (!output?.word_segments?.length) {
		throw new Error('WhisperX produced no word_segments');
	}

	return output;
};

const findMissingQuoteWords = (
	quoteWords: string[],
	transcriptWords: string[],
): string[] => {
	const missing: string[] = [];
	let searchFrom = 0;

	for (const quoteWord of quoteWords) {
		const index = transcriptWords.indexOf(quoteWord, searchFrom);

		if (index === -1) {
			missing.push(quoteWord);
			continue;
		}

		searchFrom = index + 1;
	}

	return missing;
};

const checkWhisperxQc = (clipId: string): {failures: string[]; warnings: string[]} => {
	const failures: string[] = [];
	const warnings: string[] = [];

	const wordSegments = getWhisperxWordSegments(clipId);

	if (!wordSegments) {
		failures.push('WhisperX QC unavailable: no cached transcript and WhisperX not runnable');
		return {failures, warnings};
	}

	const quoteWords = tokenizeQuote(QUOTES[clipId]);
	const transcriptWords = wordSegments
		.map((segment) => normalizeWord(segment.word))
		.filter((word) => word.length > 0);
	const missingWords = findMissingQuoteWords(quoteWords, transcriptWords);

	if (missingWords.length > 0) {
		failures.push(
			`Missing spoken words: ${missingWords.map((word) => `"${word}"`).join(', ')}`,
		);
	}

	return {failures, warnings};
};

const checkLastWordSafetyQc = (
	clipId: string,
): {failures: string[]; warnings: string[]; failed: boolean} => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const wordSegments = getWhisperxWordSegments(clipId);

	if (!wordSegments) {
		return {failures, warnings, failed: false};
	}

	const lastSegment = wordSegments[wordSegments.length - 1];
	const wordEnd = lastSegment.end;

	if (typeof wordEnd !== 'number' || !Number.isFinite(wordEnd)) {
		failures.push('Last spoken word safety: final word has no end timestamp');
		return {failures, warnings, failed: true};
	}

	if (wordEnd > MAX_LAST_WORD_END_SECONDS) {
		const overrun = wordEnd - MAX_LAST_WORD_END_SECONDS;
		const word = lastSegment.word.trim();

		failures.push(
			'Last spoken word ends too late.',
			`Word: ${word}`,
			`Word end: ${wordEnd.toFixed(2)}s`,
			`Required max: ${MAX_LAST_WORD_END_SECONDS.toFixed(2)}s`,
			`Overrun: ${overrun.toFixed(2)}s`,
			'Risk: Final syllable may be cut off in rendered video.',
		);

		return {failures, warnings, failed: true};
	}

	return {failures, warnings, failed: false};
};

const checkAudioTailSafetyQc = (
	clipId: string,
): {
	failures: string[];
	warnings: string[];
	failed: boolean;
	warned: boolean;
} => {
	const failures: string[] = [];
	const warnings: string[] = [];

	try {
		const duration = getAudioDurationSeconds(clipId);
		const roundedDuration = Math.round(duration * 100) / 100;

		if (roundedDuration > AUDIO_TAIL_FAIL_SECONDS) {
			failures.push(
				`Audio tail safety: duration ${duration.toFixed(2)}s exceeds ${AUDIO_TAIL_FAIL_SECONDS.toFixed(2)}s max`,
			);
			failures.push(
				`Risk: Audio extends too close to ${COMPOSITION_DURATION_SECONDS}s composition end; final syllables may be cut off.`,
			);
			return {failures, warnings, failed: true, warned: false};
		}

		if (roundedDuration > AUDIO_TAIL_WARN_SECONDS) {
			warnings.push(
				`Audio tail safety: duration ${duration.toFixed(2)}s exceeds ${AUDIO_TAIL_WARN_SECONDS.toFixed(2)}s warning threshold`,
			);
			return {failures, warnings, failed: false, warned: true};
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		failures.push(message);
		return {failures, warnings, failed: true, warned: false};
	}

	return {failures, warnings, failed: false, warned: false};
};

const checkRenderQc = (clipId: string): {failures: string[]; warnings: string[]} => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const renderPath = path.join(RENDERS_DIR, `${clipId}.mp4`);

	if (!fs.existsSync(renderPath)) {
		failures.push(`Missing render: renders/${clipId}.mp4`);
		return {failures, warnings};
	}

	try {
		const probe = runFfprobeJson(renderPath);
		const streams = (probe.streams ?? []) as Array<{
			codec_type?: string;
			width?: number;
			height?: number;
			r_frame_rate?: string;
		}>;
		const videoStream = streams.find((stream) => stream.codec_type === 'video');

		if (!videoStream) {
			failures.push('Render has no video stream');
			return {failures, warnings};
		}

		if (videoStream.width !== TARGET_WIDTH) {
			failures.push(
				`Render width ${videoStream.width}px, expected ${TARGET_WIDTH}px`,
			);
		}

		if (videoStream.height !== TARGET_HEIGHT) {
			failures.push(
				`Render height ${videoStream.height}px, expected ${TARGET_HEIGHT}px`,
			);
		}

		const fps = parseFrameRate(videoStream.r_frame_rate ?? '');
		if (!Number.isFinite(fps) || Math.abs(fps - TARGET_FPS) > 0.01) {
			failures.push(`Render FPS ${fps}, expected ${TARGET_FPS}`);
		}

		const duration = Number((probe.format as {duration?: string})?.duration);
		const minDuration = TARGET_RENDER_SECONDS - RENDER_DURATION_TOLERANCE_SECONDS;
		const maxDuration = TARGET_RENDER_SECONDS + RENDER_DURATION_TOLERANCE_SECONDS;

		if (!Number.isFinite(duration)) {
			failures.push('Unable to read render duration');
		} else if (duration < minDuration || duration > maxDuration) {
			failures.push(
				`Render duration ${duration.toFixed(2)}s outside ${TARGET_RENDER_SECONDS}s ±${RENDER_DURATION_TOLERANCE_SECONDS}s window`,
			);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		failures.push(`Render probe failed: ${message}`);
	}

	return {failures, warnings};
};

const runClipQc = (
	clipId: string,
	library: QuoteLibraryEntry[],
	wordSegments: WhisperxWordSegment[] | null,
): ClipQcResult => {
	const lastWordSafety = checkLastWordSafetyQc(clipId);
	const audioTailSafety = checkAudioTailSafetyQc(clipId);
	const alignment = checkWhisperxAlignmentQc(clipId, wordSegments);
	const checks = [
		checkQuoteQc(clipId),
		checkDuplicateQc(clipId, library),
		checkAssetQc(clipId),
		checkVoiceDurationQc(clipId),
		checkWhisperxQc(clipId),
		lastWordSafety,
		audioTailSafety,
		checkRenderQc(clipId),
	];

	const failures = checks.flatMap((check) => check.failures);
	const warnings = checks.flatMap((check) => check.warnings);

	return {
		clipId,
		pass: failures.length === 0 && alignment.pass,
		failures,
		warnings,
		lastWordSafetyFail: lastWordSafety.failed,
		audioTailSafetyFail: audioTailSafety.failed,
		audioTailSafetyWarn: audioTailSafety.warned,
		alignment,
	};
};

const printAlignmentScoreSummary = (results: ClipQcResult[]): void => {
	console.log('');
	console.log('WhisperX Alignment Scores');
	for (const result of results) {
		console.log(`${result.clipId}: ${result.alignment.score}`);
	}
};

const printResults = (results: ClipQcResult[]): void => {
	const passed = results.filter((result) => result.pass);
	const alignmentFailed = results.filter((result) => !result.alignment.pass);
	const standardFailed = results.filter(
		(result) => result.failures.length > 0,
	);
	const warned = results.filter(
		(result) => result.warnings.length > 0 || result.alignment.warnings.length > 0,
	);

	if (passed.length > 0) {
		console.log('PASS');
		for (const result of passed) {
			console.log(result.clipId);
		}
	}

	if (standardFailed.length > 0) {
		if (passed.length > 0) {
			console.log('');
		}

		console.log('FAIL');
		for (const result of standardFailed) {
			console.log(result.clipId);
			console.log('');
			console.log('Reason:');
			for (const failure of result.failures) {
				console.log(failure);
			}

			if (result !== standardFailed[standardFailed.length - 1]) {
				console.log('');
			}
		}
	}

	if (alignmentFailed.length > 0) {
		console.log('');
		console.log('WHISPERX ALIGNMENT FAIL');
		for (const result of alignmentFailed) {
			console.log(result.clipId);
			console.log('');
			console.log(`Alignment Score: ${result.alignment.score}`);
			console.log('');
			console.log('Reason:');
			for (const failure of result.alignment.failures) {
				console.log(failure);
			}

			if (result.alignment.affectedWords.length > 0) {
				console.log('');
				console.log('Affected words:');
				for (const word of result.alignment.affectedWords) {
					console.log(word);
				}
			}

			if (result !== alignmentFailed[alignmentFailed.length - 1]) {
				console.log('');
			}
		}
	}

	const alignmentWarned = results.filter(
		(result) => result.alignment.warnings.length > 0,
	);
	if (warned.length > 0) {
		console.log('');
		console.log('WARN');
		for (const result of warned) {
			console.log(result.clipId);
			for (const warning of result.warnings) {
				console.log(warning);
			}
			for (const warning of result.alignment.warnings) {
				console.log(`[alignment] ${warning}`);
			}
		}
	}

	const lastWordFails = results.filter((result) => result.lastWordSafetyFail);
	const audioTailFails = results.filter((result) => result.audioTailSafetyFail);
	const audioTailWarns = results.filter((result) => result.audioTailSafetyWarn);

	printAlignmentScoreSummary(results);

	console.log('');
	console.log('Summary:');
	console.log(`${results.length} clips checked`);
	console.log(`${passed.length} passed`);
	console.log(`${results.filter((result) => !result.pass).length} failed`);
	console.log(`${standardFailed.length} standard QC failures`);
	console.log(`${alignmentFailed.length} WhisperX alignment failures`);

	if (warned.length > 0) {
		console.log(`${warned.length} with warnings`);
	}

	if (alignmentWarned.length > 0) {
		console.log(`${alignmentWarned.length} with alignment warnings`);
	}

	if (lastWordFails.length > 0) {
		console.log('');
		console.log('Last-word safety failures:');
		for (const result of lastWordFails) {
			console.log(`  ${result.clipId}`);
		}
	}

	if (audioTailFails.length > 0) {
		console.log('');
		console.log('Audio-tail safety failures:');
		for (const result of audioTailFails) {
			console.log(`  ${result.clipId}`);
		}
	}

	if (audioTailWarns.length > 0) {
		console.log('');
		console.log('Audio-tail safety warnings:');
		for (const result of audioTailWarns) {
			console.log(`  ${result.clipId}`);
		}
	}

	if (alignmentFailed.length > 0) {
		console.log('');
		console.log('WhisperX alignment failures:');
		for (const result of alignmentFailed) {
			console.log(`  ${result.clipId} (score ${result.alignment.score})`);
		}
	}
};

const main = (): void => {
	if (!fs.existsSync(path.join(ROOT_DIR, 'data', 'quote-library.json'))) {
		console.error('FAIL: Missing data/quote-library.json');
		process.exit(1);
	}

	const library = loadQuoteLibrary();
	const clipIds = getClipIds();
	const wordSegmentsByClip = new Map<string, WhisperxWordSegment[] | null>();
	const results = clipIds.map((clipId) => {
		const wordSegments = getWhisperxWordSegments(clipId);
		wordSegmentsByClip.set(clipId, wordSegments);
		return runClipQc(clipId, library, wordSegments);
	});

	printResults(results);
	runAlignmentInvestigations(results.map((result) => result.alignment), wordSegmentsByClip);

	if (results.some((result) => !result.pass)) {
		console.log('');
		console.log('Export blocked: resolve all FAIL results before exporting.');
		process.exit(1);
	}
};

main();
