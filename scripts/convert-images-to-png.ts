import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGES_DIR = path.join(process.cwd(), 'assets', 'images');
const SUPPORTED_EXTENSIONS = new Set([
	'.webp',
	'.jpg',
	'.jpeg',
	'.gif',
	'.tif',
	'.tiff',
	'.avif',
]);

type ConversionResult = {
	sourceFile: string;
	outputFile: string;
	width: number;
	height: number;
};

async function convertImagesToPng(): Promise<void> {
	if (!fs.existsSync(IMAGES_DIR)) {
		console.error(`Directory not found: ${IMAGES_DIR}`);
		process.exit(1);
	}

	const files = fs.readdirSync(IMAGES_DIR);
	const toConvert = files.filter((file) => {
		const ext = path.extname(file).toLowerCase();
		return SUPPORTED_EXTENSIONS.has(ext);
	});

	if (toConvert.length === 0) {
		console.log('No convertible image files found in assets/images.');
		return;
	}

	const results: ConversionResult[] = [];

	for (const file of toConvert) {
		const inputPath = path.join(IMAGES_DIR, file);
		const baseName = path.basename(file, path.extname(file));
		const outputName = `${baseName}.png`;
		const outputPath = path.join(IMAGES_DIR, outputName);

		const {width, height} = await sharp(inputPath)
			.png({compressionLevel: 6})
			.toFile(outputPath);

		results.push({
			sourceFile: file,
			outputFile: outputName,
			width,
			height,
		});
	}

	console.log('Conversion summary:\n');

	for (const result of results) {
		console.log(result.sourceFile);
		console.log(`→ ${result.outputFile}`);
		console.log(`  ${result.width}x${result.height}`);
		console.log('');
	}

	console.log(`Converted ${results.length} image(s).`);
}

convertImagesToPng().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
