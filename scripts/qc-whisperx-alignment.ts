import fs from 'fs';
import path from 'path';
import {QUOTES, type QuoteLine} from '../src/quotes';

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const WHISPERX_DIR = path.join(ASSETS_DIR, 'subtitles', 'whisperx');
const WORDS_JSON_DIR = path.join(ASSETS_DIR, 'subtitles');

const MAX_WORD_DURATION_SECONDS = 1.5;
const MIN_WORD_DURATION_SECONDS = 0.05;
const LARGE_GAP_WARN_SECONDS = 1.0;
const EARLY_HIGHLIGHT_WARN_SECONDS = 1.0;

const INVESTIGATION_CLIP_IDS = ['018', '019'];

export type WhisperxWordSegment = {
	word: string;
	start?: number;
	end?: number;
};

export type WordsJsonEntry = {
	text: string;
	start?: number;
	end?: number;
};

export type AlignmentIssue = {
	kind:
		| 'missing-segment'
		| 'missing-timestamp'
		| 'long-duration'
		| 'short-duration'
		| 'large-gap'
		| 'block-final-timing'
		| 'early-highlight'
		| 'duplicate-word';
	word: string;
	blockIndex?: number;
	detail: string;
	severity: 'fail' | 'warn';
};

export type WhisperxAlignmentQcResult = {
	clipId: string;
	pass: boolean;
	score: number;
	failures: string[];
	warnings: string[];
	affectedWords: string[];
	issues: AlignmentIssue[];
};

const normalizeWord = (word: string): string =>
	word
		.toLowerCase()
		.replace(/[^\w']/g, '')
		.trim();

const tokenizeBlock = (text: string): string[] =>
	text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0)
		.map(normalizeWord)
		.filter((word) => word.length > 0);

const tokenizeQuote = (lines: QuoteLine[]): string[] =>
	lines.flatMap((line) => tokenizeBlock(line.text));

const hasValidTimestamp = (start: unknown, end: unknown): boolean =>
	typeof start === 'number' &&
	typeof end === 'number' &&
	Number.isFinite(start) &&
	Number.isFinite(end) &&
	end > start;

const overlapsBlockWindow = (
	wordStart: number,
	wordEnd: number,
	blockStart: number,
	blockEnd: number,
): boolean => wordEnd > blockStart && wordStart < blockEnd;

type AlignedQuoteWord = {
	quoteWord: string;
	rawWord: string;
	blockIndex: number;
	wordIndexInBlock: number;
	segment: WhisperxWordSegment | null;
	wordsJsonEntry: WordsJsonEntry | null;
	blockStart: number;
	blockEnd: number;
};

const alignQuoteToSegments = (
	lines: QuoteLine[],
	wordSegments: WhisperxWordSegment[],
	wordsJson: WordsJsonEntry[],
): AlignedQuoteWord[] => {
	const aligned: AlignedQuoteWord[] = [];
	let segmentIndex = 0;

	for (let blockIndex = 0; blockIndex < lines.length; blockIndex++) {
		const line = lines[blockIndex];
		const blockWords = tokenizeBlock(line.text);
		const rawWords = line.text
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0);

		for (let wordIndexInBlock = 0; wordIndexInBlock < blockWords.length; wordIndexInBlock++) {
			const quoteWord = blockWords[wordIndexInBlock];
			let segment: WhisperxWordSegment | null = null;

			while (segmentIndex < wordSegments.length) {
				const candidate = wordSegments[segmentIndex];
				const candidateWord = normalizeWord(candidate.word);

				segmentIndex++;

				if (candidateWord.length === 0) {
					continue;
				}

				if (candidateWord === quoteWord) {
					segment = candidate;
					break;
				}
			}

			aligned.push({
				quoteWord,
				rawWord: rawWords[wordIndexInBlock] ?? quoteWord,
				blockIndex,
				wordIndexInBlock,
				segment,
				wordsJsonEntry: wordsJson[aligned.length] ?? null,
				blockStart: line.startSeconds,
				blockEnd: line.endSeconds,
			});
		}
	}

	return aligned;
};

const readWordsJson = (clipId: string): WordsJsonEntry[] | null => {
	const wordsPath = path.join(WORDS_JSON_DIR, `${clipId}-words.json`);

	if (!fs.existsSync(wordsPath)) {
		return null;
	}

	return JSON.parse(fs.readFileSync(wordsPath, 'utf8')) as WordsJsonEntry[];
};

export const readWhisperxWordSegmentsFromCache = (
	clipId: string,
): WhisperxWordSegment[] | null => {
	const cachedPath = path.join(WHISPERX_DIR, `${clipId}-voice.json`);

	if (!fs.existsSync(cachedPath)) {
		return null;
	}

	const whisperxJson = JSON.parse(
		fs.readFileSync(cachedPath, 'utf8'),
	) as {word_segments?: WhisperxWordSegment[]};
	const wordSegments = whisperxJson.word_segments ?? [];

	return wordSegments.length > 0 ? wordSegments : null;
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

const findSameBlockDuplicateWords = (lines: QuoteLine[]): string[] => {
	const duplicates: string[] = [];

	for (const line of lines) {
		const blockWords = tokenizeBlock(line.text);
		const seen = new Set<string>();

		for (const word of blockWords) {
			if (seen.has(word)) {
				duplicates.push(word);
			} else {
				seen.add(word);
			}
		}
	}

	return duplicates;
};

const computeAlignmentScore = (issues: AlignmentIssue[], quoteWordCount: number): number => {
	if (quoteWordCount === 0) {
		return 0;
	}

	let score = 100;

	for (const issue of issues) {
		switch (issue.kind) {
			case 'missing-segment':
				score -= 12;
				break;
			case 'missing-timestamp':
				score -= 10;
				break;
			case 'long-duration':
			case 'short-duration':
				score -= 8;
				break;
			case 'large-gap':
				score -= 2;
				break;
			case 'block-final-timing':
				score -= issue.severity === 'fail' ? 15 : 3;
				break;
			case 'early-highlight':
				break;
			case 'duplicate-word':
				score -= 8;
				break;
		}
	}

	return Math.max(0, Math.min(100, Math.round(score)));
};

const formatBlockFinalFailure = (
	blockIndex: number,
	words: string[],
	reason: string,
): string =>
	`Block ${blockIndex + 1} final words missing effective timing (${reason}): ${words.map((word) => `"${word}"`).join(', ')}`;

export const checkWhisperxAlignmentQc = (
	clipId: string,
	wordSegments: WhisperxWordSegment[] | null,
): WhisperxAlignmentQcResult => {
	const failures: string[] = [];
	const warnings: string[] = [];
	const issues: AlignmentIssue[] = [];
	const affectedWords = new Set<string>();
	const collectAffectedWord = (word: string, severity: 'fail' | 'warn'): void => {
		if (severity === 'fail') {
			affectedWords.add(word);
		}
	};

	if (!wordSegments) {
		return {
			clipId,
			pass: false,
			score: 0,
			failures: ['WhisperX alignment QC unavailable: no word_segments'],
			warnings: [],
			affectedWords: [],
			issues: [],
		};
	}

	const lines = QUOTES[clipId];
	if (!lines) {
		return {
			clipId,
			pass: false,
			score: 0,
			failures: ['Quote does not exist in QUOTES'],
			warnings: [],
			affectedWords: [],
			issues: [],
		};
	}

	const wordsJson = readWordsJson(clipId);
	if (!wordsJson) {
		failures.push(`Missing words.json: assets/subtitles/${clipId}-words.json`);
	}

	const quoteWords = tokenizeQuote(lines);
	const transcriptWords = wordSegments
		.map((segment) => normalizeWord(segment.word))
		.filter((word) => word.length > 0);
	const missingQuoteWords = findMissingQuoteWords(quoteWords, transcriptWords);

	for (const word of missingQuoteWords) {
		issues.push({
			kind: 'missing-segment',
			word,
			detail: `Quote word "${word}" has no word_segments entry`,
			severity: 'fail',
		});
		collectAffectedWord(word, 'fail');
	}

	const duplicateWords = findSameBlockDuplicateWords(lines);
	for (const word of duplicateWords) {
		issues.push({
			kind: 'duplicate-word',
			word,
			detail: `Duplicate quote word "${word}" in the same subtitle block may cause gold highlight to match the wrong spoken instance`,
			severity: 'warn',
		});
		warnings.push(
			`Duplicate quote word "${word}" in the same block may cause highlight collision`,
		);
	}

	if (missingQuoteWords.length > 0) {
		failures.push(
			`Missing word_segments for quote words: ${missingQuoteWords.map((word) => `"${word}"`).join(', ')}`,
		);
	}

	const aligned = alignQuoteToSegments(lines, wordSegments, wordsJson ?? []);

	let missingTimestampCount = 0;
	let longDurationCount = 0;
	let shortDurationCount = 0;
	let blockFinalTimingCount = 0;
	let wordsJsonIssueCount = 0;

	for (const entry of aligned) {
		const segment = entry.segment;

		if (!segment) {
			continue;
		}

		if (!hasValidTimestamp(segment.start, segment.end)) {
			missingTimestampCount++;
			issues.push({
				kind: 'missing-timestamp',
				word: entry.rawWord,
				blockIndex: entry.blockIndex,
				detail: `word_segments entry for "${entry.rawWord}" missing start/end timestamp`,
				severity: 'fail',
			});
			collectAffectedWord(entry.quoteWord, 'fail');
		} else {
			const duration = segment.end! - segment.start!;

			if (duration > MAX_WORD_DURATION_SECONDS) {
				longDurationCount++;
				issues.push({
					kind: 'long-duration',
					word: entry.rawWord,
					blockIndex: entry.blockIndex,
					detail: `"${entry.rawWord}" duration ${duration.toFixed(2)}s exceeds ${MAX_WORD_DURATION_SECONDS}s`,
					severity: 'fail',
				});
				collectAffectedWord(entry.quoteWord, 'fail');
			}

			if (duration < MIN_WORD_DURATION_SECONDS) {
				shortDurationCount++;
				issues.push({
					kind: 'short-duration',
					word: entry.rawWord,
					blockIndex: entry.blockIndex,
					detail: `"${entry.rawWord}" duration ${duration.toFixed(3)}s below ${MIN_WORD_DURATION_SECONDS}s`,
					severity: 'fail',
				});
				collectAffectedWord(entry.quoteWord, 'fail');
			}
		}

		const jsonEntry = entry.wordsJsonEntry;
		if (!jsonEntry) {
			wordsJsonIssueCount++;
			issues.push({
				kind: 'missing-timestamp',
				word: entry.rawWord,
				blockIndex: entry.blockIndex,
				detail: `words.json missing entry for rendered word "${entry.rawWord}"`,
				severity: 'fail',
			});
			collectAffectedWord(entry.quoteWord, 'fail');
		} else if (!hasValidTimestamp(jsonEntry.start, jsonEntry.end)) {
			wordsJsonIssueCount++;
			issues.push({
				kind: 'missing-timestamp',
				word: entry.rawWord,
				blockIndex: entry.blockIndex,
				detail: `words.json entry for "${entry.rawWord}" missing start/end timestamp`,
				severity: 'fail',
			});
			collectAffectedWord(entry.quoteWord, 'fail');
		}
	}

	if (wordsJson) {
		for (let index = 0; index < wordsJson.length; index++) {
			const entry = wordsJson[index];
			if (!hasValidTimestamp(entry.start, entry.end)) {
				const detail = `words.json[${index}] "${entry.text}" missing start/end timestamp`;
				if (!failures.includes(detail)) {
					failures.push(detail);
				}
			}
		}
	}

	if (missingTimestampCount > 0) {
		const words = aligned
			.filter(
				(entry) =>
					entry.segment &&
					!hasValidTimestamp(entry.segment.start, entry.segment.end),
			)
			.map((entry) => entry.rawWord);
		failures.push(
			`Missing timestamps in word_segments: ${words.map((word) => `"${word}"`).join(', ')}`,
		);
	}

	for (let index = 0; index < wordSegments.length - 1; index++) {
		const current = wordSegments[index];
		const next = wordSegments[index + 1];

		if (
			!hasValidTimestamp(current.start, current.end) ||
			!hasValidTimestamp(next.start, next.end)
		) {
			continue;
		}

		const gap = next.start! - current.end!;
		if (gap > LARGE_GAP_WARN_SECONDS) {
			const currentWord = current.word.trim();
			const nextWord = next.word.trim();
			warnings.push(
				`Large gap ${gap.toFixed(2)}s between "${currentWord}" and "${nextWord}"`,
			);
			issues.push({
				kind: 'large-gap',
				word: nextWord,
				detail: `Gap ${gap.toFixed(2)}s after "${currentWord}"`,
				severity: 'warn',
			});
		}
	}

	const longDurationWords = issues
		.filter((issue) => issue.kind === 'long-duration')
		.map((issue) => issue.word);
	if (longDurationWords.length > 0) {
		failures.push(
			`Abnormally long word durations: ${longDurationWords.map((word) => `"${word}"`).join(', ')}`,
		);
	}

	const shortDurationWords = issues
		.filter((issue) => issue.kind === 'short-duration')
		.map((issue) => issue.word);
	if (shortDurationWords.length > 0) {
		failures.push(
			`Abnormally short word durations: ${shortDurationWords.map((word) => `"${word}"`).join(', ')}`,
		);
	}

	const wordsByBlock = new Map<number, AlignedQuoteWord[]>();
	for (const entry of aligned) {
		const blockEntries = wordsByBlock.get(entry.blockIndex) ?? [];
		blockEntries.push(entry);
		wordsByBlock.set(entry.blockIndex, blockEntries);
	}

	const lastBlockIndex = lines.length - 1;
	const highlightSensitiveBlocks = new Set([
		lastBlockIndex - 1,
		lastBlockIndex,
	]);

	for (const [blockIndex, blockEntries] of wordsByBlock) {
		const finalEntries = blockEntries.slice(-2);
		const isFinalBlock = blockIndex === lastBlockIndex;
		const isHighlightSensitiveBlock = highlightSensitiveBlocks.has(blockIndex);

		for (const entry of finalEntries) {
			const segment = entry.segment;

			if (!segment || !hasValidTimestamp(segment.start, segment.end)) {
				blockFinalTimingCount++;
				issues.push({
					kind: 'block-final-timing',
					word: entry.rawWord,
					blockIndex,
					detail: `Block ${blockIndex + 1} final word "${entry.rawWord}" missing timestamp`,
					severity: 'fail',
				});
				collectAffectedWord(entry.quoteWord, 'fail');
				continue;
			}

			const overlaps = overlapsBlockWindow(
				segment.start!,
				segment.end!,
				entry.blockStart,
				entry.blockEnd,
			);

			if (!overlaps) {
				blockFinalTimingCount++;
				const detail = `Block ${blockIndex + 1} final word "${entry.rawWord}" timing [${segment.start!.toFixed(2)}s–${segment.end!.toFixed(2)}s] outside block window [${entry.blockStart.toFixed(2)}s–${entry.blockEnd.toFixed(2)}s]`;
				issues.push({
					kind: 'block-final-timing',
					word: entry.rawWord,
					blockIndex,
					detail,
					severity: isFinalBlock ? 'fail' : 'warn',
				});

				if (isFinalBlock) {
					collectAffectedWord(entry.quoteWord, 'fail');
				} else {
					warnings.push(detail);
				}
			} else if (
				blockIndex === lastBlockIndex - 1 &&
				overlaps &&
				segment.end! < entry.blockEnd - EARLY_HIGHLIGHT_WARN_SECONDS
			) {
				const detail = `Block ${blockIndex + 1} final word "${entry.rawWord}" highlight ends ${(entry.blockEnd - segment.end!).toFixed(2)}s before block ends`;
				issues.push({
					kind: 'early-highlight',
					word: entry.rawWord,
					blockIndex,
					detail,
					severity: 'warn',
				});
				warnings.push(detail);
			}
		}
	}

	const blockFinalFailIssues = issues.filter(
		(issue) => issue.kind === 'block-final-timing' && issue.severity === 'fail',
	);
	if (blockFinalFailIssues.length > 0) {
		const blockFailures = new Map<number, string[]>();
		for (const issue of blockFinalFailIssues) {
			if (issue.blockIndex === undefined) {
				continue;
			}
			const words = blockFailures.get(issue.blockIndex) ?? [];
			words.push(issue.word);
			blockFailures.set(issue.blockIndex, words);
		}

		for (const [blockIndex, words] of blockFailures) {
			failures.push(
				formatBlockFinalFailure(
					blockIndex,
					[...new Set(words)],
					'gold highlight cannot animate correctly during block display',
				),
			);
		}

		failures.push('Final words missing timing. Gold highlight cannot animate correctly.');
	}

	const score = computeAlignmentScore(issues, quoteWords.length);

	return {
		clipId,
		pass: failures.length === 0,
		score,
		failures: [...new Set(failures)],
		warnings,
		affectedWords: [...affectedWords],
		issues,
	};
};

const inferRootCause = (result: WhisperxAlignmentQcResult): string => {
	const kinds = new Set(result.issues.map((issue) => issue.kind));

	if (kinds.has('block-final-timing')) {
		return 'Final block words are spoken before their subtitle block appears on screen, or lack timestamps — gold highlight fires early or not at all.';
	}

	if (kinds.has('missing-segment')) {
		return 'WhisperX transcript does not contain all quote words in sequence — regenerate subtitles or adjust quote text.';
	}

	if (kinds.has('missing-timestamp')) {
		return 'WhisperX word_segments or words.json entries are missing start/end timestamps — rebuild words.json from WhisperX output.';
	}

	if (kinds.has('long-duration') || kinds.has('short-duration')) {
		return 'Abnormal per-word durations suggest misaligned WhisperX boundaries.';
	}

	if (kinds.has('large-gap')) {
		return 'Large pauses between consecutive words may cause highlight to appear out of sync with speech.';
	}

	if (kinds.has('duplicate-word')) {
		return 'Duplicate words in the quote cause isWordActive to match the first spoken instance, desynchronizing highlight for later occurrences.';
	}

	if (kinds.has('early-highlight')) {
		return 'Final words finish highlighting before their subtitle block ends, so gold highlight stops early.';
	}

	return 'No alignment issues detected.';
};

export const printAlignmentInvestigation = (
	clipId: string,
	wordSegments: WhisperxWordSegment[] | null,
	result: WhisperxAlignmentQcResult,
): void => {
	const lines = QUOTES[clipId] ?? [];
	const quoteText = lines.map((line) => line.text).join(' | ');
	const finalBlock = lines[lines.length - 1];
	const finalWords = tokenizeBlock(finalBlock?.text ?? '');

	console.log('');
	console.log(`=== WhisperX Alignment Investigation: ${clipId} ===`);
	console.log('');
	console.log(`Quote text: ${quoteText}`);
	console.log('');
	console.log(`Final block: "${finalBlock?.text ?? ''}"`);
	console.log(`Final words: ${finalWords.map((word) => `"${word}"`).join(', ')}`);
	console.log('');
	console.log(`Alignment Score: ${result.score}`);
	console.log(`Pass: ${result.pass ? 'yes' : 'no'}`);
	console.log('');

	const blockFinalIssues = result.issues.filter(
		(issue) => issue.kind === 'block-final-timing',
	);
	const missingTimestampIssues = result.issues.filter(
		(issue) =>
			issue.kind === 'missing-timestamp' || issue.kind === 'missing-segment',
	);

	if (wordSegments) {
		console.log('WhisperX timestamps (last 6 word_segments):');
		for (const segment of wordSegments.slice(-6)) {
			const start =
				typeof segment.start === 'number' ? segment.start.toFixed(3) : '—';
			const end = typeof segment.end === 'number' ? segment.end.toFixed(3) : '—';
			console.log(`  "${segment.word.trim()}"  ${start}s – ${end}s`);
		}
		console.log('');
	}

	if (missingTimestampIssues.length > 0) {
		console.log('Missing timestamps:');
		for (const issue of missingTimestampIssues) {
			console.log(`  ${issue.detail}`);
		}
		console.log('');
	}

	if (blockFinalIssues.length > 0) {
		console.log('Block final-word timing issues:');
		for (const issue of blockFinalIssues) {
			console.log(`  ${issue.detail}`);
		}
		console.log('');
	}

	const investigationWords = [
		...new Set([
			...result.affectedWords,
			...result.issues
				.filter(
					(issue) =>
						issue.severity === 'warn' &&
						(issue.kind === 'early-highlight' || issue.kind === 'duplicate-word'),
				)
				.map((issue) => issue.word),
		]),
	];

	if (investigationWords.length > 0) {
		console.log('Affected words:');
		for (const word of investigationWords) {
			console.log(word);
		}
		console.log('');
	}

	console.log(`Likely root cause: ${inferRootCause(result)}`);
};

export const runAlignmentInvestigations = (
	results: WhisperxAlignmentQcResult[],
	wordSegmentsByClip: Map<string, WhisperxWordSegment[] | null>,
): void => {
	const targets = results.filter((result) =>
		INVESTIGATION_CLIP_IDS.includes(result.clipId),
	);

	if (targets.length === 0) {
		return;
	}

	console.log('');
	console.log('WhisperX Alignment Investigation');

	for (const result of targets) {
		printAlignmentInvestigation(
			result.clipId,
			wordSegmentsByClip.get(result.clipId) ?? null,
			result,
		);
	}
};
