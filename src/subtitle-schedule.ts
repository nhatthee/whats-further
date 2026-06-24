import type {QuoteLine} from './quotes';
import {
	BLOCK_END_TAIL_SECONDS,
	BLOCK_START_LEAD_SECONDS,
	DEBUG_SUBTITLE_TIMING,
	SUBTITLE_TIMING_OFFSET_SECONDS,
} from './subtitle-config';
import type {WordTiming} from './SubtitleAnimationV2';
import {countWordsInText, normalizeWord, splitIntoWords} from './SubtitleAnimationV2';

export const MFA_END_PADDING_SECONDS = 0.35;

export type MfaQuoteSchedule = {
	lines: QuoteLine[];
	blockWordTimings: WordTiming[][];
};

const applyTimingOffset = (timing: WordTiming): WordTiming => ({
	...timing,
	start: timing.start + SUBTITLE_TIMING_OFFSET_SECONDS,
	end: timing.end + SUBTITLE_TIMING_OFFSET_SECONDS,
});

const findMfaTimingForWord = (
	word: string,
	wordTimings: WordTiming[],
	startIndex: number,
): {timing: WordTiming; nextIndex: number} | null => {
	const normalizedWord = normalizeWord(word);
	const scanLimit = Math.min(wordTimings.length, startIndex + 4);

	for (let index = startIndex; index < scanLimit; index++) {
		if (normalizeWord(wordTimings[index].text) === normalizedWord) {
			return {timing: wordTimings[index], nextIndex: index + 1};
		}
	}

	if (startIndex < wordTimings.length) {
		return {timing: wordTimings[startIndex], nextIndex: startIndex + 1};
	}

	return null;
};

const logSubtitleTimingDebug = (
	clipId: string,
	lines: QuoteLine[],
	blockWordTimings: WordTiming[][],
): void => {
	console.log(`[subtitle-timing] clipId: ${clipId}`);

	for (let index = 0; index < lines.length; index++) {
		const block = lines[index];
		const timings = blockWordTimings[index] ?? [];
		const firstWord = timings[0]?.text ?? '(none)';
		const lastWord = timings[timings.length - 1]?.text ?? '(none)';

		console.log(
			`[subtitle-timing] block ${index}: start=${block.startSeconds?.toFixed(3) ?? 'n/a'} end=${block.endSeconds?.toFixed(3) ?? 'n/a'} first="${firstWord}" last="${lastWord}" words=${timings.length}`,
		);
	}

	const totalWords = blockWordTimings.reduce(
		(total, timings) => total + timings.length,
		0,
	);
	console.log(`[subtitle-timing] total words: ${totalWords}`);
};

export const buildMfaQuoteSchedule = (
	quoteLines: QuoteLine[],
	wordTimings: WordTiming[],
	clipId?: string,
): MfaQuoteSchedule => {
	let mfaIndex = 0;
	const lines: QuoteLine[] = [];
	const blockWordTimings: WordTiming[][] = [];

	for (const quoteLine of quoteLines) {
		const words = splitIntoWords(quoteLine.text);
		const timings: WordTiming[] = [];

		for (const word of words) {
			const match = findMfaTimingForWord(word, wordTimings, mfaIndex);

			if (!match) {
				break;
			}

			timings.push(applyTimingOffset(match.timing));
			mfaIndex = match.nextIndex;
		}

		blockWordTimings.push(timings);

		if (timings.length > 0) {
			const firstStart = timings[0].start;
			const lastEnd = timings[timings.length - 1].end;

			lines.push({
				text: quoteLine.text,
				startSeconds: Math.max(0, firstStart - BLOCK_START_LEAD_SECONDS),
				endSeconds: lastEnd + BLOCK_END_TAIL_SECONDS,
			});
			continue;
		}

		lines.push(quoteLine);
	}

	if (DEBUG_SUBTITLE_TIMING && clipId) {
		logSubtitleTimingDebug(clipId, lines, blockWordTimings);
	}

	return {lines, blockWordTimings};
};

export const getDurationSecondsFromWordTimings = (
	wordTimings: WordTiming[] | undefined,
	paddingSeconds = MFA_END_PADDING_SECONDS,
): number | undefined => {
	if (!wordTimings || wordTimings.length === 0) {
		return undefined;
	}

	const lastEnd = wordTimings[wordTimings.length - 1]?.end;

	if (typeof lastEnd !== 'number' || !Number.isFinite(lastEnd)) {
		return undefined;
	}

	return lastEnd + paddingSeconds;
};

export const countExpectedMfaWords = (quoteLines: QuoteLine[]): number =>
	quoteLines.reduce((total, line) => total + countWordsInText(line.text), 0);
