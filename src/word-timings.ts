import type {WordTiming} from './SubtitleAnimationV2';

type WordTimingJsonModule = WordTiming[] | {default: WordTiming[]};

const CLIP_ID_PATTERN = /(\d{3})-words\.json$/;

const normalizeWordTimingsModule = (
	module: WordTimingJsonModule,
): WordTiming[] => {
	if (Array.isArray(module)) {
		return module;
	}

	if (
		module &&
		typeof module === 'object' &&
		'default' in module &&
		Array.isArray(module.default)
	) {
		return module.default;
	}

	return [];
};

const extractClipId = (filePath: string): string | null => {
	const match = filePath.match(CLIP_ID_PATTERN);
	return match?.[1] ?? null;
};

// Webpack replaces this at bundle time (Remotion's bundler).
const wordTimingModules = import.meta.webpackContext('../assets/subtitles', {
	recursive: false,
	regExp: /^\.\/\d{3}-words\.json$/,
});

const buildWordTimingsMap = (): Record<string, WordTiming[]> => {
	const map: Record<string, WordTiming[]> = {};

	for (const filePath of wordTimingModules.keys()) {
		const clipId = extractClipId(filePath);

		if (!clipId) {
			continue;
		}

		map[clipId] = normalizeWordTimingsModule(
			wordTimingModules(filePath) as WordTimingJsonModule,
		);
	}

	return map;
};

/** MFA / WhisperX word timings for subtitle sync and gold highlight. */
export const WORD_TIMINGS_BY_CLIP_ID: Record<string, WordTiming[]> =
	buildWordTimingsMap();

const warnedMissingClipIds = new Set<string>();

export const getWordTimingsForClip = (clipId: string): WordTiming[] => {
	const timings = WORD_TIMINGS_BY_CLIP_ID[clipId];

	if (!timings || timings.length === 0) {
		if (!warnedMissingClipIds.has(clipId)) {
			warnedMissingClipIds.add(clipId);
			console.warn(
				`Missing MFA word timings: assets/subtitles/${clipId}-words.json`,
			);
		}

		return [];
	}

	return timings;
};
