import {execFileSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {QUOTES} from '../src/quotes';

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npx tsx scripts/build-clip.ts 041');
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const outputPath = path.join(process.cwd(), 'renders', `${clipId}.mp4`);

const runNpmScript = (script: string): void => {
	execFileSync(npmCmd, ['run', script, '--', clipId], {
		stdio: 'inherit',
		cwd: process.cwd(),
	});
};

console.log(`\nBuilding clip ${clipId}...\n`);

if (!QUOTES[clipId]) {
	console.log('[quote] Generating quote...');
	runNpmScript('quote');
}

console.log('[1/4] Generating image...');
runNpmScript('image');

console.log('[2/4] Generating voice...');
runNpmScript('voice');

console.log('[3/4] Running MFA...');
runNpmScript('mfa');

const wordsPath = path.join(
	process.cwd(),
	'assets',
	'subtitles',
	`${clipId}-words.json`,
);

if (!fs.existsSync(wordsPath)) {
	throw new Error(
		`Missing MFA word timings: assets/subtitles/${clipId}-words.json`,
	);
}

console.log('[4/4] Rendering video...');
runNpmScript('render');

if (!fs.existsSync(outputPath)) {
	throw new Error(`Missing render output: renders/${clipId}.mp4`);
}

console.log(`\nBuild complete: renders/${clipId}.mp4`);
