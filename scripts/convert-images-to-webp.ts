import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGES_DIR = path.join(process.cwd(), 'assets', 'images');
const WEBP_QUALITY = 85;

const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}

	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

async function convertImagesToWebp(): Promise<void> {
	if (!fs.existsSync(IMAGES_DIR)) {
		console.error(`Directory not found: ${IMAGES_DIR}`);
		process.exit(1);
	}

	const files = fs.readdirSync(IMAGES_DIR);
	const pngFiles = files.filter(
		(file) => path.extname(file).toLowerCase() === '.png',
	);

	const toConvert = pngFiles.filter((file) => {
		const baseName = path.basename(file, path.extname(file));
		const outputPath = path.join(IMAGES_DIR, `${baseName}.webp`);
		return !fs.existsSync(outputPath);
	});

	const skipped = pngFiles.filter((file) => !toConvert.includes(file));

	if (skipped.length > 0) {
		console.log('Skipped (matching .webp already exists):\n');
		for (const file of skipped) {
			const baseName = path.basename(file, path.extname(file));
			console.log(`${file} → ${baseName}.webp`);
		}
		console.log('');
	}

	if (toConvert.length === 0) {
		console.log('No PNG files to convert.');
		return;
	}

	console.log('Conversion summary:\n');

	for (const file of toConvert) {
		const inputPath = path.join(IMAGES_DIR, file);
		const baseName = path.basename(file, path.extname(file));
		const outputName = `${baseName}.webp`;
		const outputPath = path.join(IMAGES_DIR, outputName);

		const {width, height} = await sharp(inputPath)
			.webp({quality: WEBP_QUALITY})
			.toFile(outputPath);

		const outputSize = fs.statSync(outputPath).size;

		console.log(file);
		console.log(`→ ${outputName}`);
		console.log(`  ${width}x${height}`);
		console.log(`  ${formatFileSize(outputSize)}`);
		console.log('');
	}

	console.log(`Converted ${toConvert.length} image(s).`);
}

convertImagesToWebp().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
