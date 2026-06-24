import fs from 'fs';
import path from 'path';

export type QuoteLibraryEntry = {
	id: string;
	theme: string;
	quote: string[];
};

export type DuplicateKind =
	| 'exact'
	| 'near-duplicate'
	| 'similar-opening-hook';

export type DuplicateMatch = {
	kind: DuplicateKind;
	clipId: string;
	detail: string;
	similarity?: number;
};

const LIBRARY_PATH = path.join(process.cwd(), 'data', 'quote-library.json');

const NEAR_DUPLICATE_THRESHOLD = 0.82;
const HOOK_SIMILARITY_THRESHOLD = 0.65;

const normalize = (text: string): string =>
	text
		.toLowerCase()
		.replace(/\.{3,}|…/g, '')
		.replace(/[^\w\s']/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const tokenize = (text: string): string[] =>
	normalize(text)
		.split(' ')
		.filter((word) => word.length > 0);

const jaccardSimilarity = (a: string, b: string): number => {
	const setA = new Set(tokenize(a));
	const setB = new Set(tokenize(b));

	if (setA.size === 0 && setB.size === 0) {
		return 1;
	}

	if (setA.size === 0 || setB.size === 0) {
		return 0;
	}

	let intersection = 0;
	for (const token of setA) {
		if (setB.has(token)) {
			intersection++;
		}
	}

	const union = setA.size + setB.size - intersection;
	return intersection / union;
};

const joinQuote = (quote: string[]): string => quote.join(' ');

const isExactQuote = (a: string[], b: string[]): boolean => {
	if (a.length !== b.length) {
		return false;
	}

	return a.every((line, index) => normalize(line) === normalize(b[index] ?? ''));
};

const getHookSignature = (hook: string): string => {
	const normalized = normalize(hook);

	if (normalized.match(/^the \w+ is$/)) {
		return 'the:*:is';
	}

	const words = tokenize(hook);
	if (words[0] === 'the' && words.length >= +2) {
		return `the:*:${words[words.length - 1]}`;
	}

	return normalized;
};

const isSimilarOpeningHook = (a: string, b: string): boolean => {
	const normalizedA = normalize(a);
	const normalizedB = normalize(b);

	if (normalizedA === normalizedB) {
		return true;
	}

	if (
		normalizedA.startsWith('the ') &&
		normalizedB.startsWith('the ') &&
		getHookSignature(a) === getHookSignature(b)
	) {
		return true;
	}

	return jaccardSimilarity(a, b) >= HOOK_SIMILARITY_THRESHOLD;
};

export const loadQuoteLibrary = (
	libraryPath: string = LIBRARY_PATH,
): QuoteLibraryEntry[] => {
	const raw = fs.readFileSync(libraryPath, 'utf8');
	const entries = JSON.parse(raw) as QuoteLibraryEntry[];

	for (const entry of entries) {
		if (!entry.id || !entry.theme || !Array.isArray(entry.quote)) {
			throw new Error(
				`Invalid library entry "${entry.id ?? 'unknown'}": expected id, theme, and quote[]`,
			);
		}
	}

	return entries;
};

export const checkQuoteAgainstLibrary = (
	candidate: QuoteLibraryEntry,
	library: QuoteLibraryEntry[],
): DuplicateMatch[] => {
	const matches: DuplicateMatch[] = [];
	const candidateFullText = joinQuote(candidate.quote);
	const candidateHook = candidate.quote[0] ?? '';

	for (const existing of library) {
		if (existing.id === candidate.id) {
			continue;
		}

		if (isExactQuote(candidate.quote, existing.quote)) {
			matches.push({
				kind: 'exact',
				clipId: existing.id,
				detail: 'Quote blocks match exactly.',
			});
			continue;
		}

		const existingFullText = joinQuote(existing.quote);
		const fullSimilarity = jaccardSimilarity(
			candidateFullText,
			existingFullText,
		);

		if (fullSimilarity >= NEAR_DUPLICATE_THRESHOLD) {
			matches.push({
				kind: 'near-duplicate',
				clipId: existing.id,
				detail: 'Quote is very similar to an existing clip.',
				similarity: fullSimilarity,
			});
		}

		const existingHook = existing.quote[0] ?? '';
		if (
			candidateHook &&
			existingHook &&
			isSimilarOpeningHook(candidateHook, existingHook)
		) {
			matches.push({
				kind: 'similar-opening-hook',
				clipId: existing.id,
				detail: `Opening hook "${candidateHook}" is similar to "${existingHook}".`,
				similarity: jaccardSimilarity(candidateHook, existingHook),
			});
		}
	}

	return matches;
};

const parseArgs = (): {filePath: string} => {
	const args = process.argv.slice(2);
	const fileFlagIndex = args.indexOf('--file');
	const filePath =
		fileFlagIndex >= 0
			? args[fileFlagIndex + 1]
			: args.find((arg) => !arg.startsWith('--'));

	if (!filePath) {
		throw new Error(
			'Usage: npm run check:quotes -- --file path/to/new-quote.json',
		);
	}

	return {filePath};
};

const readCandidate = (filePath: string): QuoteLibraryEntry => {
	const absolutePath = path.isAbsolute(filePath)
		? filePath
		: path.join(process.cwd(), filePath);
	const raw = fs.readFileSync(absolutePath, 'utf8');
	const candidate = JSON.parse(raw) as QuoteLibraryEntry;

	if (!candidate.id || !candidate.theme || !Array.isArray(candidate.quote)) {
		throw new Error(
			'Candidate quote must include id, theme, and quote[] fields.',
		);
	}

	return candidate;
};

const main = (): void => {
	const {filePath} = parseArgs();
	const library = loadQuoteLibrary();
	const candidate = readCandidate(filePath);
	const matches = checkQuoteAgainstLibrary(candidate, library);

	if (matches.length === 0) {
		console.log(`PASS: Quote ${candidate.id} has no library conflicts.`);
		return;
	}

	console.log(`FAIL: Quote ${candidate.id} conflicts with the library.\n`);

	for (const match of matches) {
		const similarity =
			match.similarity !== undefined
				? ` (${Math.round(match.similarity * 100)}% similar)`
				: '';
		console.log(`[${match.kind}] clip ${match.clipId}${similarity}`);
		console.log(`  ${match.detail}`);
	}

	process.exit(1);
};

if (require.main === module) {
	main();
}
