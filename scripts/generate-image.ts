import dotenv from 'dotenv';

dotenv.config({
	path: '.env.local',
});

import fs from 'fs/promises';
import path from 'path';
import Replicate from 'replicate';
import {buildThemedImagePromptWithMeta, NEGATIVE_IMAGE_PROMPT} from '../src/image-themes';

const clipId = process.argv[2];

if (!clipId) {
	throw new Error('Usage: npx tsx scripts/generate-image.ts 041');
}

const {prompt: imagePrompt, theme, sceneTitle, quoteText} =
	buildThemedImagePromptWithMeta(clipId);

const apiToken = process.env.FLUX_API_TOKEN;

if (!apiToken) {
	throw new Error('Missing FLUX_API_TOKEN environment variable');
}

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'assets', 'images');
const outputPath = path.join(outputDir, `${clipId}.webp`);

const describeOutput = (output: unknown): string => {
	const parts = [`typeof output: ${typeof output}`];

	if (Array.isArray(output)) {
		parts.push(`Array.isArray(output): true (length ${output.length})`);
		if (output.length > 0) {
			parts.push(`output[0]: ${describeOutput(output[0])}`);
		}
		return parts.join('; ');
	}

	parts.push(`Array.isArray(output): false`);

	if (output && typeof output === 'object') {
		const keys = Object.getOwnPropertyNames(output).slice(0, 20);
		parts.push(`object keys: ${keys.join(', ') || '(none)'}`);
	}

	return parts.join('; ');
};

const isReadableStream = (value: unknown): value is ReadableStream<Uint8Array> =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as ReadableStream<Uint8Array>).getReader === 'function';

const readStreamToBuffer = async (
	stream: ReadableStream<Uint8Array>,
): Promise<Buffer> => {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];

	try {
		while (true) {
			const {done, value} = await reader.read();
			if (done) {
				break;
			}
			if (value) {
				chunks.push(value);
			}
		}
	} finally {
		reader.releaseLock();
	}

	return Buffer.concat(chunks);
};

const downloadFromUrl = async (url: string): Promise<Buffer> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to download generated image (${response.status})`);
	}

	return Buffer.from(await response.arrayBuffer());
};

const outputToBuffer = async (output: unknown): Promise<Buffer> => {
	if (output == null) {
		throw new Error(`Unexpected Replicate output (${describeOutput(output)})`);
	}

	if (Buffer.isBuffer(output)) {
		return output;
	}

	if (output instanceof Uint8Array) {
		return Buffer.from(output);
	}

	if (typeof output === 'string') {
		return downloadFromUrl(output);
	}

	if (Array.isArray(output)) {
		if (output.length === 0) {
			throw new Error(`Unexpected Replicate output (${describeOutput(output)})`);
		}

		return outputToBuffer(output[0]);
	}

	if (typeof output === 'object') {
		const fileOutput = output as {
			blob?: () => Promise<Blob>;
			url?: () => URL;
		};

		if (typeof fileOutput.url === 'function') {
			return downloadFromUrl(String(fileOutput.url()));
		}

		if (typeof fileOutput.blob === 'function') {
			const blob = await fileOutput.blob();
			return Buffer.from(await blob.arrayBuffer());
		}

		if (isReadableStream(output)) {
			return readStreamToBuffer(output);
		}
	}

	throw new Error(`Unexpected Replicate output (${describeOutput(output)})`);
};

const FORBIDDEN_POSITIVE_TERMS = [
	'japanese',
	'sumi-e',
	'sumi e',
	'ink wash',
	'japanese ink',
	'kanji',
	'calligraphy',
	'hanko',
	'artist seal',
	'red seal',
	'corner stamp',
	'corner seal',
	'chop mark',
] as const;

const getPositivePromptContentForValidation = (prompt: string): string =>
	prompt
		.split('\n')
		.filter((line) => !line.trim().toUpperCase().startsWith('ABSOLUTELY NO'))
		.join('\n')
		.toLowerCase();

const assertSafePositivePrompt = (prompt: string): void => {
	const content = getPositivePromptContentForValidation(prompt);

	for (const term of FORBIDDEN_POSITIVE_TERMS) {
		if (content.includes(term)) {
			throw new Error(`Forbidden term detected in positive prompt: "${term}"`);
		}
	}
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_AFTER_ATTEMPT_1_SECONDS = 12;
const RETRY_DELAY_AFTER_ATTEMPT_2_SECONDS = 20;

const sleep = (seconds: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, seconds * 1000);
	});

const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

const isValidationError = (error: unknown): boolean => {
	const message = getErrorMessage(error);

	return (
		message.includes('Missing FLUX_API_TOKEN') ||
		message.includes('Forbidden term detected in positive prompt') ||
		message.startsWith('Usage:')
	);
};

const isRetryableError = (error: unknown): boolean => {
	if (isValidationError(error)) {
		return false;
	}

	const message = getErrorMessage(error);
	const lower = message.toLowerCase();

	return (
		message.includes('429') ||
		lower.includes('too many requests') ||
		lower.includes('prediction failed') ||
		lower.includes('director: unexpected error') ||
		message.includes('E9828') ||
		message.includes('500') ||
		message.includes('502') ||
		message.includes('503') ||
		message.includes('504')
	);
};

const parseRetryAfterSeconds = (error: unknown): number | undefined => {
	const message = getErrorMessage(error);
	const jsonMatch = message.match(/\{[\s\S]*\}/);

	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0]) as {retry_after?: number};

			if (
				typeof parsed.retry_after === 'number' &&
				Number.isFinite(parsed.retry_after) &&
				parsed.retry_after >= 0
			) {
				return parsed.retry_after;
			}
		} catch {
			// Fall through to regex parsing.
		}
	}

	const match = message.match(/retry_after["']?\s*[:=]\s*(\d+(?:\.\d+)?)/i);

	if (match) {
		const parsed = Number.parseFloat(match[1]);

		if (Number.isFinite(parsed) && parsed >= 0) {
			return parsed;
		}
	}

	return undefined;
};

const getRetryWaitSeconds = (error: unknown, failedAttempt: number): number => {
	const retryAfter = parseRetryAfterSeconds(error);

	if (retryAfter !== undefined) {
		return retryAfter + 2;
	}

	if (failedAttempt === 1) {
		return RETRY_DELAY_AFTER_ATTEMPT_1_SECONDS;
	}

	return RETRY_DELAY_AFTER_ATTEMPT_2_SECONDS;
};

const runReplicateWithRetries = async (
	replicate: Replicate,
): Promise<unknown> => {
	let lastError: unknown;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		console.log(`Image generation attempt ${attempt}/${MAX_ATTEMPTS}...`);

		try {
			return await replicate.run('black-forest-labs/flux-schnell', {
				input: {
					prompt: imagePrompt,
					negative_prompt: NEGATIVE_IMAGE_PROMPT,
					aspect_ratio: '9:16',
					num_outputs: 1,
					output_format: 'webp',
					output_quality: 80,
				},
			});
		} catch (error: unknown) {
			lastError = error;
			console.log(`Image generation failed: ${getErrorMessage(error)}`);

			if (
				isValidationError(error) ||
				!isRetryableError(error) ||
				attempt >= MAX_ATTEMPTS
			) {
				throw error;
			}

			const waitSeconds = getRetryWaitSeconds(error, attempt);
			console.log(`Retrying in ${waitSeconds} seconds...`);
			await sleep(waitSeconds);
		}
	}

	throw lastError;
};

async function generateImage(): Promise<void> {
	assertSafePositivePrompt(imagePrompt);
	console.log(`Clip ID: ${clipId}`);
	console.log(`Theme: ${theme}`);
	console.log(`Scene: ${sceneTitle}`);
	if (quoteText) {
		console.log(`Quote: ${quoteText}`);
	}
	console.log('Final Prompt:');
	console.log(imagePrompt);
	console.log('Negative Prompt:');
	console.log(NEGATIVE_IMAGE_PROMPT);

	const replicate = new Replicate({
		auth: apiToken,
		useFileOutput: false,
	});

	const output = await runReplicateWithRetries(replicate);

	const imageData = await outputToBuffer(output);

	if (imageData.length === 0) {
		throw new Error('Downloaded image is empty');
	}

	await fs.mkdir(outputDir, {recursive: true});
	await fs.writeFile(outputPath, imageData);

	const stat = await fs.stat(outputPath);

	if (!stat.isFile() || stat.size <= 0) {
		throw new Error(`Image file was not written: assets/images/${clipId}.webp`);
	}

	console.log(`Saved assets/images/${clipId}.webp (${stat.size} bytes)`);
}

generateImage().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Image generation failed: ${message}`);
	process.exit(1);
});
