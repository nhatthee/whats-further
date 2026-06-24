const STYLE_PRESET =
	'Cinematic composition. Ultra realistic photography. Soft volumetric lighting. Premium motivational poster aesthetic. Emotional storytelling. Masterpiece. No text. Vertical 9:16.';

export function buildImagePrompt(prompt: string): string {
	const trimmed = prompt.trim();

	if (!trimmed) {
		return STYLE_PRESET;
	}

	return `${trimmed} ${STYLE_PRESET}`;
}
