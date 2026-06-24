export function getImagePath(clipId: string): string {
	const id = Number(clipId);

	if (id <= 40) {
		return `/images/archive/webp/${clipId}.webp`;
	}

	return `/images/${clipId}.webp`;
}

export function getImageAssetRelativePath(clipId: string): string {
	return getImagePath(clipId).replace(/^\//, '');
}
