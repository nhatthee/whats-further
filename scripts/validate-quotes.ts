import {QUOTES, type QuoteLine} from '../src/quotes';

const BLOCK_COUNT = 5;
const MIN_WORDS = 19;
const MAX_WORDS = 23;
const SIMILARITY_THRESHOLD = 0.75;

const OVERUSED_HOOK_PATTERNS = [
	'the truth is',
	'the saddest truth',
	'the painful lesson',
	'the hidden reason',
] as const;

type QuoteStatus = 'pass' | 'fail' | 'warn';

type QuoteResult = {
	clipId: string;
	status: QuoteStatus;
	failures: string[];
	warnings: string[];
};

const countWords = (text: string): number =>
	text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;

const normalize = (text: string): string =>
	text
		.toLowerCase()
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

const flattenQuote = (lines: QuoteLine[]): string =>
	lines.map((line) => line.text).join(' ');

const getBlocks = (lines: QuoteLine[]): string[] =>
	lines.map((line) => line.text);

const validateStructure = (
	lines: QuoteLine[],
): Pick<QuoteResult, 'failures' | 'warnings'> => {
	const failures: string[] = [];
	const warnings: string[] = [];

	if (lines.length !== BLOCK_COUNT) {
		failures.push(
			`Expected ${BLOCK_COUNT} subtitle blocks, found ${lines.length}`,
		);
	}

	const blocks = getBlocks(lines);
	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index];
		if (block.trim().length === 0) {
			failures.push(`Block ${index + 1} is empty`);
		}
		if (/\bTBD\b/i.test(block)) {
			failures.push(`Block ${index + 1} still contains "TBD"`);
		}
	}

	const totalWords = countWords(flattenQuote(lines));
	if (totalWords <= 18) {
		failures.push(
			`Total word count is ${totalWords} (minimum ${MIN_WORDS}, reject at 18 or fewer)`,
		);
	} else if (totalWords >= 24) {
		failures.push(
			`Total word count is ${totalWords} (maximum ${MAX_WORDS}, reject at 24 or more)`,
		);
	}

	if (
		failures.length === 0 &&
		(totalWords < 20 || totalWords > 22)
	) {
		warnings.push(
			`Total word count is ${totalWords} (target 20-22, acceptable ${MIN_WORDS}-${MAX_WORDS})`,
		);
	}

	return {failures, warnings};
};

const checkCrossQuoteIssues = (
	clipIds: string[],
): Map<string, {failures: string[]; warnings: string[]}> => {
	const issues = new Map<string, {failures: string[]; warnings: string[]}>();
	const ensure = (clipId: string) => {
		if (!issues.has(clipId)) {
			issues.set(clipId, {failures: [], warnings: []});
		}
		return issues.get(clipId)!;
	};

	const flattened = clipIds.map((clipId) => ({
		clipId,
		text: flattenQuote(QUOTES[clipId]),
		normalizedText: normalize(flattenQuote(QUOTES[clipId])),
		hook: getBlocks(QUOTES[clipId])[0] ?? '',
		normalizedHook: normalize(getBlocks(QUOTES[clipId])[0] ?? ''),
	}));

	for (let i = 0; i < flattened.length; i++) {
		for (let j = i + 1; j < flattened.length; j++) {
			const left = flattened[i];
			const right = flattened[j];

			if (left.normalizedText === right.normalizedText) {
				const message = `Exact duplicate quote text with clip ${right.clipId}`;
				ensure(left.clipId).failures.push(message);
				ensure(right.clipId).failures.push(
					`Exact duplicate quote text with clip ${left.clipId}`,
				);
				continue;
			}

			const similarity = jaccardSimilarity(left.text, right.text);
			if (similarity >= SIMILARITY_THRESHOLD) {
				const message = `Very similar to clip ${right.clipId} (${Math.round(similarity * 100)}% Jaccard)`;
				ensure(left.clipId).warnings.push(message);
				ensure(right.clipId).warnings.push(
					`Very similar to clip ${left.clipId} (${Math.round(similarity * 100)}% Jaccard)`,
				);
			}

			if (
				left.normalizedHook.length > 0 &&
				left.normalizedHook === right.normalizedHook
			) {
				const message = `Duplicate opening hook with clip ${right.clipId}: "${left.hook}"`;
				ensure(left.clipId).warnings.push(message);
				ensure(right.clipId).warnings.push(
					`Duplicate opening hook with clip ${left.clipId}: "${right.hook}"`,
				);
			}
		}
	}

	const hookUsage = new Map<string, string[]>();
	for (const entry of flattened) {
		if (!entry.normalizedHook) {
			continue;
		}

		const clipList = hookUsage.get(entry.normalizedHook) ?? [];
		clipList.push(entry.clipId);
		hookUsage.set(entry.normalizedHook, clipList);
	}

	for (const [hook, usedBy] of hookUsage) {
		if (usedBy.length <= 1) {
			continue;
		}

		const message = `Opening hook "${hook}" reused across clips: ${usedBy.join(', ')}`;
		for (const clipId of usedBy) {
			ensure(clipId).warnings.push(message);
		}
	}

	for (const pattern of OVERUSED_HOOK_PATTERNS) {
		const matches = flattened.filter((entry) =>
			entry.normalizedHook.startsWith(pattern),
		);
		if (matches.length <= 1) {
			continue;
		}

		const clipList = matches.map((entry) => entry.clipId).join(', ');
		const message = `Overused hook pattern "${pattern}..." across clips: ${clipList}`;
		for (const entry of matches) {
			ensure(entry.clipId).warnings.push(message);
		}
	}

	return issues;
};

const dedupe = (items: string[]): string[] => [...new Set(items)];

const resolveStatus = (
	failures: string[],
	warnings: string[],
): QuoteStatus => {
	if (failures.length > 0) {
		return 'fail';
	}
	if (warnings.length > 0) {
		return 'warn';
	}
	return 'pass';
};

const statusIcon = (status: QuoteStatus): string => {
	switch (status) {
		case 'pass':
			return '✅ PASS';
		case 'fail':
			return '❌ FAIL';
		case 'warn':
			return '⚠️ WARN';
	}
};

const main = (): void => {
	const clipIds = Object.keys(QUOTES).sort();
	const crossQuoteIssues = checkCrossQuoteIssues(clipIds);

	const results: QuoteResult[] = clipIds.map((clipId) => {
		const structural = validateStructure(QUOTES[clipId]);
		const cross = crossQuoteIssues.get(clipId) ?? {
			failures: [],
			warnings: [],
		};

		const failures = dedupe([...structural.failures, ...cross.failures]);
		const warnings = dedupe([...structural.warnings, ...cross.warnings]);

		return {
			clipId,
			status: resolveStatus(failures, warnings),
			failures,
			warnings,
		};
	});

	console.log('Quote QC — Template V1\n');

	for (const result of results) {
		console.log(`${statusIcon(result.status)} ${result.clipId}`);
		for (const failure of result.failures) {
			console.log(`  ❌ ${failure}`);
		}
		for (const warning of result.warnings) {
			console.log(`  ⚠️  ${warning}`);
		}
	}

	const failed = results.filter((result) => result.status === 'fail');
	const warned = results.filter((result) => result.status === 'warn');
	const passed = results.filter((result) => result.status === 'pass');

	console.log('');
	console.log(
		`Summary: ${passed.length} passed, ${warned.length} warnings, ${failed.length} failed`,
	);

	if (failed.length > 0) {
		console.log('\nRender blocked: fix failed quotes before rendering.');
		process.exit(1);
	}
};

main();
