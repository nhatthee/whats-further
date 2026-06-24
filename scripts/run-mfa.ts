import {execFileSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {QUOTES} from '../src/quotes';

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npx tsx scripts/run-mfa.ts 001');
}

const quote = QUOTES[clipId];

if (!quote) {
	throw new Error(`Missing quote for ${clipId} in src/quotes.ts`);
}

const rootDir = process.cwd();
const mfaInputDir = path.join(rootDir, 'mfa_input');
const mfaOutputDir = path.join(rootDir, 'mfa_output');
const voicePath = path.join(rootDir, 'assets', 'audio', `${clipId}-voice.mp3`);
const wavPath = path.join(mfaInputDir, `${clipId}.wav`);
const transcriptPath = path.join(mfaInputDir, `${clipId}.txt`);
const textGridPath = path.join(mfaOutputDir, `${clipId}.TextGrid`);
const textgridToWordsScript = path.join(rootDir, 'scripts', 'textgrid-to-words.ts');

const assertFileExists = (filePath: string, label: string): void => {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Missing ${label}: ${path.relative(rootDir, filePath)}`);
	}
};

const transcript = quote.map((line) => line.text).join(' ');

assertFileExists(voicePath, 'voice file');

fs.mkdirSync(mfaInputDir, {recursive: true});
fs.mkdirSync(mfaOutputDir, {recursive: true});

console.log(`Converting ${path.relative(rootDir, voicePath)} to WAV...`);

execFileSync(
	'ffmpeg',
	['-y', '-i', voicePath, '-ac', '1', '-ar', '16000', '-sample_fmt', 's16', wavPath],
	{stdio: 'inherit'},
);

fs.writeFileSync(transcriptPath, `${transcript}\n`, 'utf8');

console.log(`Wrote transcript to ${path.relative(rootDir, transcriptPath)}`);
console.log('Running MFA alignment...');

execFileSync(
	'mfa',
	[
		'align',
		mfaInputDir,
		'english_us_arpa',
		'english_us_arpa',
		mfaOutputDir,
		'--clean',
	],
	{stdio: 'inherit', cwd: rootDir},
);

assertFileExists(textGridPath, 'TextGrid output');

console.log('Converting TextGrid to word timings...');

execFileSync(
	'npx',
	['tsx', textgridToWordsScript, clipId],
	{stdio: 'inherit', cwd: rootDir},
);

console.log(`\nMFA pipeline complete for ${clipId}`);
