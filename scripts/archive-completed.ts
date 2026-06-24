import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const rendersDir = path.join(rootDir, 'renders');
const archiveReadyDir = path.join(rootDir, 'archive', 'ready');
const archiveUploadedDir = path.join(rootDir, 'archive', 'uploaded');
const manifestPath = path.join(archiveReadyDir, 'manifest.json');

const BATCH_SIZE = 20;

type ManifestBatch = {
	name: string;
	clips: string[];
	status: 'ready' | 'uploaded';
};

type Manifest = {
	batches: ManifestBatch[];
};

const padClipId = (clipId: string): string => clipId.padStart(3, '0');

const parseClipIds = (): string[] => {
	const clipArgs = process.argv
		.slice(2)
		.filter((arg) => !arg.startsWith('--'))
		.map(padClipId);

	if (clipArgs.length > 0) {
		return clipArgs;
	}

	if (!fs.existsSync(rendersDir)) {
		return [];
	}

	return fs
		.readdirSync(rendersDir)
		.filter((file) => /^\d{3}\.mp4$/.test(file))
		.map((file) => file.replace('.mp4', ''))
		.sort();
};

const ensureArchiveDirs = (): void => {
	fs.mkdirSync(archiveReadyDir, {recursive: true});
	fs.mkdirSync(archiveUploadedDir, {recursive: true});
};

const getBatchName = (clipNumber: number): string => {
	const batchStart = Math.floor((clipNumber - 1) / BATCH_SIZE) * BATCH_SIZE + 1;
	const batchEnd = batchStart + BATCH_SIZE - 1;
	return `batch-${String(batchStart).padStart(3, '0')}-${String(batchEnd).padStart(3, '0')}`;
};

const buildManifestFromArchive = (): Manifest => {
	const clipIds = fs
		.readdirSync(archiveReadyDir)
		.filter((file) => /^\d{3}\.mp4$/.test(file))
		.map((file) => file.replace('.mp4', ''))
		.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

	const batches = new Map<string, string[]>();

	for (const clipId of clipIds) {
		const clipNumber = Number.parseInt(clipId, 10);
		const batchName = getBatchName(clipNumber);
		const existing = batches.get(batchName) ?? [];
		existing.push(clipId);
		batches.set(batchName, existing);
	}

	return {
		batches: [...batches.entries()].map(([name, clips]) => ({
			name,
			clips,
			status: 'ready' as const,
		})),
	};
};

const writeManifest = (manifest: Manifest): void => {
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

const formatBytes = (bytes: number): string => {
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}

	if (bytes < 1024 * 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getDirectorySizeBytes = (directory: string): number => {
	if (!fs.existsSync(directory)) {
		return 0;
	}

	let total = 0;

	for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			total += getDirectorySizeBytes(entryPath);
			continue;
		}

		if (entry.isFile()) {
			total += fs.statSync(entryPath).size;
		}
	}

	return total;
};

const main = (): void => {
	ensureArchiveDirs();

	const clipIds = parseClipIds();
	const moved: string[] = [];
	const alreadyArchived: string[] = [];
	const missing: string[] = [];

	for (const clipId of clipIds) {
		const sourcePath = path.join(rendersDir, `${clipId}.mp4`);
		const destinationPath = path.join(archiveReadyDir, `${clipId}.mp4`);

		if (fs.existsSync(destinationPath)) {
			alreadyArchived.push(clipId);
			continue;
		}

		if (!fs.existsSync(sourcePath)) {
			missing.push(clipId);
			continue;
		}

		fs.renameSync(sourcePath, destinationPath);
		moved.push(clipId);
	}

	const manifest = buildManifestFromArchive();
	writeManifest(manifest);

	const readySize = getDirectorySizeBytes(archiveReadyDir);
	const uploadedSize = getDirectorySizeBytes(archiveUploadedDir);
	const archiveSize = readySize + uploadedSize;

	console.log('Archive Completed Renders\n');

	if (moved.length > 0) {
		console.log(`Moved (${moved.length}):`);
		for (const clipId of moved) {
			console.log(`  ${clipId}.mp4 -> archive/ready/${clipId}.mp4`);
		}
	} else {
		console.log('Moved (0): none');
	}

	if (alreadyArchived.length > 0) {
		console.log(`\nAlready archived (${alreadyArchived.length}):`);
		for (const clipId of alreadyArchived) {
			console.log(`  ${clipId}.mp4`);
		}
	}

	if (missing.length > 0) {
		console.log(`\nMissing from renders/ (${missing.length}):`);
		for (const clipId of missing) {
			console.log(`  ${clipId}.mp4`);
		}
	}

	console.log(`\nManifest: archive/ready/manifest.json`);
	console.log(`Batches: ${manifest.batches.length}`);
	for (const batch of manifest.batches) {
		console.log(`  ${batch.name}: ${batch.clips.length} clip(s), status=${batch.status}`);
	}

	console.log(`\nArchive size:`);
	console.log(`  archive/ready: ${formatBytes(readySize)}`);
	console.log(`  archive/uploaded: ${formatBytes(uploadedSize)}`);
	console.log(`  total: ${formatBytes(archiveSize)}`);

	const remainingRenders = fs.existsSync(rendersDir)
		? fs.readdirSync(rendersDir).filter((file) => file.endsWith('.mp4'))
		: [];

	if (remainingRenders.length > 0) {
		console.log(`\nRemaining in renders/: ${remainingRenders.join(', ')}`);
	} else {
		console.log('\nrenders/ is clear of completed mp4 files (ready for 041+).');
	}
};

main();
