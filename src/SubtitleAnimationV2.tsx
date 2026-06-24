import {interpolate} from 'remotion';
import {BLOCK_END_TAIL_SECONDS} from './subtitle-config';

export type WordTiming = {
	text: string;
	start: number;
	end: number;
};

const WORD_DURATION_MIN_MS = 80;
const WORD_DURATION_MAX_MS = 120;
const ACTIVE_WORD_COLOR = '#D4AF37';
const INACTIVE_WORD_COLOR = 'white';
const WORD_TIMING_TOLERANCE = 0.18;
const FINAL_WORD_HIGHLIGHT_LEAD = 0.45;

/**
 * Flicker-free gold highlight: active when current time is inside [start, end].
 * During short gaps between words, keep the previous word highlighted.
 */
export const getActiveBlockWordIndex = (
	blockWordTimings: WordTiming[],
	currentSeconds: number,
): number => {
	if (blockWordTimings.length === 0) {
		return -1;
	}

	for (let index = 0; index < blockWordTimings.length; index++) {
		const timing = blockWordTimings[index];

		if (currentSeconds >= timing.start && currentSeconds <= timing.end) {
			return index;
		}
	}

	for (let index = 0; index < blockWordTimings.length - 1; index++) {
		const current = blockWordTimings[index];
		const next = blockWordTimings[index + 1];

		if (currentSeconds > current.end && currentSeconds < next.start) {
			return index;
		}
	}

	const lastIndex = blockWordTimings.length - 1;
	const lastTiming = blockWordTimings[lastIndex];

	if (
		currentSeconds > lastTiming.end &&
		currentSeconds <= lastTiming.end + BLOCK_END_TAIL_SECONDS
	) {
		return lastIndex;
	}

	return -1;
};

export const countWordsInText = (text: string): number =>
	text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;

export const splitIntoWords = (text: string): string[] =>
	text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0);

export const normalizeWord = (word: string): string =>
	word.replace(/[^\w']/g, '').toLowerCase();

export const getBlockWordOffset = (
	lines: Array<{text: string}>,
	blockIndex: number,
): number => {
	let offset = 0;

	for (let index = 0; index < blockIndex; index++) {
		offset += countWordsInText(lines[index].text);
	}

	return offset;
};

const timingBelongsToBlock = (
	timing: WordTiming,
	blockStartSeconds: number,
	blockEndSeconds: number,
): boolean =>
	timing.start < blockEndSeconds + WORD_TIMING_TOLERANCE &&
	timing.end > blockStartSeconds - WORD_TIMING_TOLERANCE;

const isCurrentTimeWithinWord = (
	timing: WordTiming,
	currentSeconds: number,
): boolean =>
	currentSeconds >= timing.start - WORD_TIMING_TOLERANCE &&
	currentSeconds <= timing.end + WORD_TIMING_TOLERANCE;

const isMfaWordHighlight = (
	word: string,
	wordTiming: WordTiming | undefined,
	currentSeconds: number,
): boolean => {
	if (!wordTiming) {
		return false;
	}

	if (normalizeWord(wordTiming.text) !== normalizeWord(word)) {
		return false;
	}

	return (
		currentSeconds >= wordTiming.start && currentSeconds <= wordTiming.end
	);
};

const isNormalWordHighlight = (
	word: string,
	wordIndex: number,
	currentSeconds: number,
	wordTimings: WordTiming[],
	blockStartSeconds: number,
	blockEndSeconds: number,
	wordTimingStartIndex: number,
): boolean => {
	const timing = wordTimings[wordTimingStartIndex + wordIndex];

	if (!timing) {
		return false;
	}

	if (normalizeWord(timing.text) !== normalizeWord(word)) {
		return false;
	}

	return (
		isCurrentTimeWithinWord(timing, currentSeconds) &&
		timingBelongsToBlock(timing, blockStartSeconds, blockEndSeconds)
	);
};

const hasNormalHighlightInBlock = (
	blockWords: string[],
	currentSeconds: number,
	wordTimings: WordTiming[],
	blockStartSeconds: number,
	blockEndSeconds: number,
	wordTimingStartIndex: number,
): boolean => {
	for (let index = 0; index < blockWords.length; index++) {
		if (
			isNormalWordHighlight(
				blockWords[index],
				index,
				currentSeconds,
				wordTimings,
				blockStartSeconds,
				blockEndSeconds,
				wordTimingStartIndex,
			)
		) {
			return true;
		}
	}

	return false;
};

const isFinalWordFallbackHighlight = (
	currentSeconds: number,
	blockStartSeconds: number,
	blockEndSeconds: number,
	blockWords: string[],
	wordTimings: WordTiming[] | undefined,
	wordTimingStartIndex: number | undefined,
): boolean => {
	const forcedStart = Math.max(
		blockStartSeconds,
		blockEndSeconds - FINAL_WORD_HIGHLIGHT_LEAD,
	);
	const inForcedWindow =
		currentSeconds >= forcedStart && currentSeconds <= blockEndSeconds;

	if (!inForcedWindow) {
		return false;
	}

	if (!wordTimings || wordTimingStartIndex === undefined) {
		return true;
	}

	return !hasNormalHighlightInBlock(
		blockWords,
		currentSeconds,
		wordTimings,
		blockStartSeconds,
		blockEndSeconds,
		wordTimingStartIndex,
	);
};

export const isWordActiveInBlock = (
	word: string,
	wordIndex: number,
	currentSeconds: number,
	wordTimings: WordTiming[] | undefined,
	blockStartSeconds: number,
	blockEndSeconds: number,
	wordTimingStartIndex?: number,
	isLastBlock?: boolean,
	isLastWordInBlock?: boolean,
	blockWords?: string[],
	blockWordTimings?: WordTiming[],
): boolean => {
	const blockWordTiming = blockWordTimings?.[wordIndex];

	if (
		blockWordTiming &&
		isMfaWordHighlight(word, blockWordTiming, currentSeconds)
	) {
		return true;
	}

	if (
		wordTimings &&
		wordTimingStartIndex !== undefined &&
		isNormalWordHighlight(
			word,
			wordIndex,
			currentSeconds,
			wordTimings,
			blockStartSeconds,
			blockEndSeconds,
			wordTimingStartIndex,
		)
	) {
		return true;
	}

	if (isLastBlock && isLastWordInBlock && blockWords) {
		return isFinalWordFallbackHighlight(
			currentSeconds,
			blockStartSeconds,
			blockEndSeconds,
			blockWords,
			wordTimings,
			wordTimingStartIndex,
		);
	}

	return false;
};

const getWordDurationMs = (wordIndex: number): number => {
	const span = WORD_DURATION_MAX_MS - WORD_DURATION_MIN_MS;
	const step = wordIndex % 3;
	return WORD_DURATION_MIN_MS + step * (span / 2);
};

const msToFrames = (ms: number, fps: number): number =>
	Math.max(1, Math.round((ms / 1000) * fps));

const getWordStartFrame = (
	blockStart: number,
	wordIndex: number,
	fps: number,
): number => {
	let offsetMs = 0;

	for (let index = 0; index < wordIndex; index++) {
		offsetMs += getWordDurationMs(index);
	}

	return blockStart + msToFrames(offsetMs, fps);
};

type WordAnimationState = {
	opacity: number;
	blur: number;
	translateY: number;
};

export const getWordAnimationState = (
	frame: number,
	blockStart: number,
	wordIndex: number,
	fps: number,
	wordTiming?: WordTiming,
): WordAnimationState => {
	if (wordTiming) {
		const wordStart = Math.round(wordTiming.start * fps);
		const wordSpanFrames = Math.max(
			1,
			Math.round((wordTiming.end - wordTiming.start) * fps),
		);
		const durationFrames = Math.min(6, Math.max(2, Math.round(wordSpanFrames * 0.35)));

		if (frame < wordStart) {
			return {opacity: 0, blur: 6, translateY: 6};
		}

		if (frame >= wordStart + durationFrames) {
			return {opacity: 1, blur: 0, translateY: 0};
		}

		const progress = interpolate(
			frame,
			[wordStart, wordStart + durationFrames],
			[0, 1],
			{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			},
		);

		return {
			opacity: progress,
			blur: interpolate(progress, [0, 1], [6, 0]),
			translateY: interpolate(progress, [0, 1], [6, 0]),
		};
	}

	const wordStart = getWordStartFrame(blockStart, wordIndex, fps);
	const durationFrames = msToFrames(getWordDurationMs(wordIndex), fps);

	if (frame < wordStart) {
		return {opacity: 0, blur: 6, translateY: 6};
	}

	if (frame >= wordStart + durationFrames) {
		return {opacity: 1, blur: 0, translateY: 0};
	}

	const progress = interpolate(
		frame,
		[wordStart, wordStart + durationFrames],
		[0, 1],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		},
	);

	return {
		opacity: progress,
		blur: interpolate(progress, [0, 1], [6, 0]),
		translateY: interpolate(progress, [0, 1], [6, 0]),
	};
};

type Line = {
	start: number;
	end: number;
	text: string;
};

const GAP_FRAMES = 0;

export const getBlockExitOpacity = (
	frame: number,
	index: number,
	fadeFrames: number,
	lines: Line[],
): number => {
	const {start, end} = lines[index];
	const isLast = index === lines.length - 1;
	const gapFrames = isLast ? 0 : GAP_FRAMES;
	const fadeOutStart = end - fadeFrames - gapFrames;
	const fadeOutEnd = end - gapFrames;

	if (frame < start || frame >= fadeOutEnd) {
		return 0;
	}

	let opacity = 1;

	if (frame >= fadeOutStart) {
		opacity = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	}

	if (isLast && opacity > 0) {
		return 0.9 + opacity * 0.1;
	}

	return opacity;
};

export const getActiveQuoteIndex = (
	frame: number,
	fadeFrames: number,
	lines: Line[],
): number => {
	for (let index = 0; index < lines.length; index++) {
		if (getBlockExitOpacity(frame, index, fadeFrames, lines) > 0) {
			return index;
		}
	}

	return -1;
};

type SubtitleLineProps = {
	text: string;
	frame: number;
	blockStart: number;
	blockStartSeconds: number;
	blockEndSeconds: number;
	fps: number;
	textStyle: React.CSSProperties;
	blockOpacity: number;
	wordTimings?: WordTiming[];
	wordTimingStartIndex?: number;
	blockWordTimings?: WordTiming[];
	isLastBlock?: boolean;
};

export const SubtitleLine: React.FC<SubtitleLineProps> = ({
	text,
	frame,
	blockStart,
	blockStartSeconds,
	blockEndSeconds,
	fps,
	textStyle,
	blockOpacity,
	wordTimings,
	wordTimingStartIndex,
	blockWordTimings,
	isLastBlock = false,
}) => {
	const words = splitIntoWords(text);
	const currentSeconds = frame / fps;
	const activeBlockWordIndex = blockWordTimings
		? getActiveBlockWordIndex(blockWordTimings, currentSeconds)
		: -1;

	return (
		<p style={{...textStyle, opacity: blockOpacity}}>
			{words.map((word, index) => {
				const blockWordTiming = blockWordTimings?.[index];
				const {opacity, blur, translateY} = getWordAnimationState(
					frame,
					blockStart,
					index,
					fps,
					blockWordTiming,
				);
				const isActive = blockWordTimings
					? index === activeBlockWordIndex
					: isWordActiveInBlock(
							word,
							index,
							currentSeconds,
							wordTimings,
							blockStartSeconds,
							blockEndSeconds,
							wordTimingStartIndex,
							isLastBlock,
							index === words.length - 1,
							words,
							blockWordTimings,
						);

				return (
					<span key={`${word}-${index}`}>
						<span
							style={{
								display: 'inline-block',
								opacity,
								filter: `blur(${blur}px)`,
								transform: `translateY(${translateY}px)`,
								color: isActive ? ACTIVE_WORD_COLOR : INACTIVE_WORD_COLOR,
							}}
						>
							{word}
						</span>
						{index < words.length - 1 ? ' ' : ''}
					</span>
				);
			})}
		</p>
	);
};
