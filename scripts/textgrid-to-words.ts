import fs from 'fs';
import path from 'path';
import {
	MFA_MIN_WORD_DURATION_SECONDS,
	MFA_VISUAL_LEAD_SECONDS,
	MFA_VISUAL_TAIL_SECONDS,
} from '../src/subtitle-config';

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npx tsx scripts/textgrid-to-words.ts 001');
}

const inputPath = path.join('mfa_output', `${clipId}.TextGrid`);
const outputPath = path.join('assets', 'subtitles', `${clipId}-words.json`);

const VISUAL_LEAD_SECONDS = MFA_VISUAL_LEAD_SECONDS;
const VISUAL_TAIL_SECONDS = MFA_VISUAL_TAIL_SECONDS;
const MIN_WORD_DURATION_SECONDS = MFA_MIN_WORD_DURATION_SECONDS;

type WordTiming = {
	text: string;
	start: number;
	end: number;
};

function extractWordsTierContent(textGrid: string): string {
	const tierBlocks = textGrid.split(/(?=^\s*item\s*\[\d+\]:)/m);

	for (const block of tierBlocks) {
		const isIntervalTier = /class\s*=\s*"IntervalTier"/.test(block);
		const isWordsTier = /name\s*=\s*"words"/.test(block);

		if (isIntervalTier && isWordsTier) {
			return block;
		}
	}

	throw new Error('No IntervalTier named "words" found in TextGrid');
}

function parseIntervals(tierContent: string): WordTiming[] {
	const intervalPattern =
		/intervals\s*\[\d+\]:\s*\n\s*xmin\s*=\s*([0-9.]+)\s*\n\s*xmax\s*=\s*([0-9.]+)\s*\n\s*text\s*=\s*"([^"]*)"/g;

	const words: WordTiming[] = [];

	for (const match of tierContent.matchAll(intervalPattern)) {
		const start = Number(match[1]);
		const end = Number(match[2]);
		const text = match[3].trim();

		if (!text || text === '<eps>' || end <= start) {
			continue;
		}

		words.push({text, start, end});
	}

	return words;
}

export function postProcessWordTimings(words: WordTiming[]): WordTiming[] {
	const processed = words
		.filter((word) => word.text.trim().length > 0)
		.map((word) => {
			const start = Math.max(0, word.start - VISUAL_LEAD_SECONDS);
			let end = word.end + VISUAL_TAIL_SECONDS;

			if (end <= start) {
				end = start + MIN_WORD_DURATION_SECONDS;
			}

			return {
				text: word.text.trim(),
				start,
				end,
			};
		});

	for (let index = 0; index < processed.length; index++) {
		const current = processed[index];

		if (
			index < processed.length - 1 &&
			current.end > processed[index + 1].start
		) {
			current.end = processed[index + 1].start;
		}

		if (current.end - current.start < MIN_WORD_DURATION_SECONDS) {
			current.end = current.start + MIN_WORD_DURATION_SECONDS;

			if (
				index < processed.length - 1 &&
				current.end > processed[index + 1].start
			) {
				current.end = processed[index + 1].start;
			}
		}
	}

	return processed;
}

if (!fs.existsSync(inputPath)) {
	throw new Error(`Missing TextGrid: ${inputPath}`);
}

const textGrid = fs.readFileSync(inputPath, 'utf8');
const wordsTier = extractWordsTierContent(textGrid);
const words = postProcessWordTimings(parseIntervals(wordsTier));

if (words.length === 0) {
	throw new Error(`No word intervals found in ${inputPath}`);
}

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, JSON.stringify(words, null, 2) + '\n');

console.log(outputPath);
console.log(`${words.length} words exported`);
