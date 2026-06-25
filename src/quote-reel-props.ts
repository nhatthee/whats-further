import type {RenderJobSpec} from './effects/render-job-spec';
import {isVisualPresetName} from './effects/presets/resolveVisualEnginePreset';
import type {VisualPresetName} from './effects/visual-presets';

export type {ParticleDebugInputProps} from './effects/particle-debug';
export {isParticleDebugEnabled} from './effects/particle-debug';

export type QuoteReelInputProps = {
	visualPreset: RenderJobSpec['visualPreset'];
	topic: string;
	category: string;
	title?: string;
	script?: RenderJobSpec['script'];
	debugParticles?: boolean;
};

export const defaultQuoteReelInputProps: QuoteReelInputProps = {
	visualPreset: 'hopeful-dawn',
	topic: 'growth',
	category: 'motivation',
	title: 'Keep Moving',
	script: ['Small steps still count.'],
	debugParticles: false,
};

export function resolveQuoteReelVisualPreset(
	value: unknown,
): VisualPresetName {
	if (isVisualPresetName(value)) {
		return value;
	}

	return defaultQuoteReelInputProps.visualPreset;
}
