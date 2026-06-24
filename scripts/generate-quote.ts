import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import {getThemeForClip} from '../src/image-themes';

dotenv.config({
	path: '.env.local',
});

type GeneratedQuoteLine = {
	text: string;
	note: string;
};

type GeneratedQuote = {
	lines: GeneratedQuoteLine[];
};

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npm run quote -- <clipId>');
}

const countWords = (text: string): number =>
	text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;

const parseGeneratedQuote = (raw: string): GeneratedQuote => {
	const trimmed = raw.trim();
	const withoutFences = trimmed
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/, '')
		.trim();

	let parsed: unknown;

	try {
		parsed = JSON.parse(withoutFences);
	} catch {
		throw new Error('OpenAI response was not valid JSON');
	}

	if (
		typeof parsed !== 'object' ||
		parsed === null ||
		!('lines' in parsed) ||
		!Array.isArray((parsed as GeneratedQuote).lines)
	) {
		throw new Error('OpenAI response must include a lines array');
	}

	const {lines} = parsed as GeneratedQuote;

	if (lines.length !== 5) {
		throw new Error(`Expected exactly 5 lines, received ${lines.length}`);
	}

	for (const [index, line] of lines.entries()) {
		if (typeof line?.text !== 'string' || line.text.trim().length === 0) {
			throw new Error(`Line ${index + 1} is missing text`);
		}

		if (typeof line?.note !== 'string' || line.note.trim().length === 0) {
			throw new Error(`Line ${index + 1} is missing note`);
		}

		const wordCount = countWords(line.text);

		if (wordCount < 4 || wordCount > 10) {
			throw new Error(
				`Line ${index + 1} must be 4-10 words, received ${wordCount}: "${line.text}"`,
			);
		}
	}

	return {
		lines: lines.map((line) => ({
			text: line.text.trim(),
			note: line.note.trim().toLowerCase(),
		})),
	};
};

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatQuoteBlock = (
	id: string,
	lines: GeneratedQuoteLine[],
): string => {
	const entries = lines.map(
		(line) =>
			`\t\t{ text: ${JSON.stringify(line.text)}, note: ${JSON.stringify(line.note)} }`,
	);

	return `\t'${id}': [\n${entries.join(',\n')},\n\t],`;
};

const upsertQuoteInFile = (
	quotesPath: string,
	id: string,
	lines: GeneratedQuoteLine[],
): void => {
	const content = fs.readFileSync(quotesPath, 'utf8');
	const block = formatQuoteBlock(id, lines);
	const existingPattern = new RegExp(
		`\\t'${escapeRegExp(id)}':\\s*\\[[\\s\\S]*?\\n\\t\\],`,
	);

	let updated: string;

	if (existingPattern.test(content)) {
		updated = content.replace(existingPattern, block);
	} else {
		const insertMarker =
			/(\n\};\n\n\/\*\* @deprecated Legacy clip-specific prompts)/;

		if (!insertMarker.test(content)) {
			throw new Error('Could not find QUOTES object closing marker in src/quotes.ts');
		}

		updated = content.replace(insertMarker, `\n${block}$1`);
	}

	fs.writeFileSync(quotesPath, updated, 'utf8');
};

const ensureOpenAiKeyInEnv = (envPath: string): void => {
	if (!fs.existsSync(envPath)) {
		fs.writeFileSync(envPath, 'OPENAI_API_KEY=\n', 'utf8');
		return;
	}

	const content = fs.readFileSync(envPath, 'utf8');

	if (/^OPENAI_API_KEY=/m.test(content)) {
		return;
	}

	const suffix = content.endsWith('\n') ? '' : '\n';
	fs.writeFileSync(envPath, `${content}${suffix}OPENAI_API_KEY=\n`, 'utf8');
};

const buildPrompt = (theme: string): string =>
	[
		'Write a 5-line quote for the WHAT\'S FURTHER motivational short-form video series.',
		`Theme: ${theme}`,
		'',
		'Requirements:',
		'- English only',
		'- Short cinematic quote',
		'- Emotional but not cheesy',
		'- Simple vocabulary',
		'- Exactly 5 lines',
		'- Each line must be 4-10 words',
		'- No hashtags',
		'- No emojis',
		'- No title',
		'- No explanation',
		'- No quotation marks',
		'- No numbering',
		'- No markdown',
		'- Suitable for motivational short-form video',
		'- Tone: quiet, reflective, premium, cinematic',
		'',
		'Return JSON only in this exact shape:',
		'{',
		'  "lines": [',
		'    { "text": "...", "note": "..." },',
		'    { "text": "...", "note": "..." },',
		'    { "text": "...", "note": "..." },',
		'    { "text": "...", "note": "..." },',
		'    { "text": "...", "note": "..." }',
		'  ]',
		'}',
		'',
		'Each note must be one short lowercase keyword, for example:',
		'discipline, growth, courage, patience, focus, resilience, healing, time, peace, hope',
	].join('\n');

async function main(): Promise<void> {
	const rootDir = process.cwd();
	const envPath = path.join(rootDir, '.env.local');
	const quotesPath = path.join(rootDir, 'src', 'quotes.ts');

	ensureOpenAiKeyInEnv(envPath);

	const apiKey = process.env.OPENAI_API_KEY;

	if (!apiKey) {
		throw new Error(
			'Missing OPENAI_API_KEY environment variable. Add it to .env.local',
		);
	}

	const theme = getThemeForClip(clipId);
	const openai = new OpenAI({apiKey});

	const response = await openai.chat.completions.create({
		model: 'gpt-4.1-mini',
		messages: [
			{
				role: 'user',
				content: buildPrompt(theme),
			},
		],
		response_format: {type: 'json_object'},
	});

	const rawContent = response.choices[0]?.message?.content;

	if (!rawContent) {
		throw new Error('OpenAI returned an empty response');
	}

	const generated = parseGeneratedQuote(rawContent);

	upsertQuoteInFile(quotesPath, clipId, generated.lines);

	console.log(`clipId: ${clipId}`);
	console.log(`theme: ${theme}`);
	console.log('generated quote:');

	for (const line of generated.lines) {
		console.log(`  - ${line.text} (${line.note})`);
	}

	console.log('updated src/quotes.ts');
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
