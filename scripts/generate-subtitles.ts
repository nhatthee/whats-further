import {execFileSync, execSync} from 'child_process';
import fs from 'fs';
import path from 'path';

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npm run subtitles -- 005');
}

const rootDir = process.cwd();
const whisperxBin = path.join(rootDir, '.venv-whisperx', 'bin', 'whisperx');
const voicePath = path.join(rootDir, 'assets', 'audio', `${clipId}-voice.mp3`);
const whisperxDir = path.join(rootDir, 'assets', 'subtitles', 'whisperx');
const whisperxJsonPath = path.join(whisperxDir, `${clipId}-voice.json`);
const wordsJsonPath = path.join(rootDir, 'assets', 'subtitles', `${clipId}-words.json`);
const buildScriptPath = path.join(
	rootDir,
	'scripts',
	'build-whisperx-word-subtitles.ts',
);

const assertFileExists = (filePath: string, label: string): void => {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Missing ${label}: ${path.relative(rootDir, filePath)}`);
	}
};

const assertWhisperxJson = (filePath: string): void => {
	assertFileExists(filePath, 'WhisperX JSON');

	const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	if (!Array.isArray(raw.word_segments) || raw.word_segments.length === 0) {
		throw new Error(
			`WhisperX JSON missing word_segments: ${path.relative(rootDir, filePath)}`,
		);
	}
};

const assertWordsJson = (filePath: string): void => {
	assertFileExists(filePath, 'word timing JSON');

	const words = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	if (!Array.isArray(words) || words.length === 0) {
		throw new Error(
			`Word timing JSON is empty: ${path.relative(rootDir, filePath)}`,
		);
	}

	for (const word of words) {
		if (
			typeof word.text !== 'string' ||
			typeof word.start !== 'number' ||
			typeof word.end !== 'number'
		) {
			throw new Error(
				`Invalid word timing entry in ${path.relative(rootDir, filePath)}`,
			);
		}
	}
};

async function generateSubtitles(): Promise<void> {
	console.log(`Generating subtitles for ${clipId}...`);

	assertFileExists(voicePath, 'voice file');

	if (!fs.existsSync(whisperxBin)) {
		throw new Error(
			'WhisperX not found. Expected virtualenv at .venv-whisperx',
		);
	}

	fs.mkdirSync(whisperxDir, {recursive: true});

	console.log('Running WhisperX...');

	execFileSync(
		whisperxBin,
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
			whisperxDir,
		],
		{stdio: 'inherit', cwd: rootDir},
	);

	assertWhisperxJson(whisperxJsonPath);

	console.log('Creating word timing JSON...');

	execSync(`npx tsx "${buildScriptPath}" ${clipId}`, {
		stdio: 'pipe',
		cwd: rootDir,
		encoding: 'utf8',
	});

	assertWordsJson(wordsJsonPath);

	console.log('Done.');
	console.log('');
	console.log('Output:');
	console.log(path.relative(rootDir, wordsJsonPath));
}

generateSubtitles().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`\nSubtitle generation failed: ${message}`);
	process.exit(1);
});
