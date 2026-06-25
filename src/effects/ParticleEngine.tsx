import {useMemo} from 'react';
import {
	AbsoluteFill,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {
	applyParticleDebugCount,
	applyParticleDebugOpacity,
	applyParticleDebugSpeedMultiplier,
	getParticleDebugColor,
	PARTICLE_DEBUG_SIZE_MULTIPLIER,
} from './particle-debug';
import {
	createParticleLayerDefinitions,
	simulateParticleLayerFrames,
	type ParticleSimulationTuning,
} from './particle-layers';
import {
	applyParticleProductionCount,
	applyParticleProductionOpacity,
	applyParticleProductionSize,
	applyParticleProductionSpeedMultiplier,
} from './particle-production';
import type { ParticlePresetName } from './particle-presets';
import {getParticlePresetFromRegistry} from './presets/registry';
import type { ParticleMaterialName } from './materials';
import {
	getMotionBehavior,
	type MotionBehavior,
} from './motion/behaviors';
import {ParticleRenderer} from './ParticleRenderer';

export type ParticleKind =
	| 'dust'
	| 'petal'
	| 'firefly'
	| 'snow'
	| 'ash'
	| 'light';

export type ParticleEngineProps = {
	enabled?: boolean;
	preset?: ParticlePresetName;
	kind?: ParticleKind;
	count?: number;
	seed?: number;
	opacity?: number;
	debug?: boolean;
	debugParticles?: boolean;
	material?: ParticleMaterialName;
	intensity?: number;
	driftMultiplier?: number;
	speedScale?: number;
	behavior?: MotionBehavior;
	behaviorIntensity?: number;
};

function buildSimulationTuning({
	debug,
	debugParticles,
}: {
	debug: boolean;
	debugParticles: boolean;
}): ParticleSimulationTuning {
	if (debugParticles) {
		return {
			sizeMultiplier: PARTICLE_DEBUG_SIZE_MULTIPLIER,
			opacityMultiplier: applyParticleDebugOpacity,
			speedMultiplier: applyParticleDebugSpeedMultiplier,
			debugParticles: true,
			debugHud: true,
		};
	}

	return {
		sizeMultiplier: applyParticleProductionSize(1),
		opacityMultiplier: applyParticleProductionOpacity,
		speedMultiplier: applyParticleProductionSpeedMultiplier,
		debugParticles: false,
		debugHud: debug,
	};
}

export function ParticleEngine({
	enabled = false,
	preset,
	kind,
	count,
	seed,
	opacity,
	debug = false,
	debugParticles = false,
	material,
	intensity,
	driftMultiplier,
	speedScale,
	behavior = 'none',
	behaviorIntensity = 1,
}: ParticleEngineProps) {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const presetConfig = preset
		? getParticlePresetFromRegistry(preset)
		: undefined;
	const resolvedKind = kind ?? presetConfig?.kind ?? 'dust';
	const baseCount = count ?? presetConfig?.count ?? 120;
	const resolvedIntensity = intensity ?? 1;
	const baseResolvedCount = Math.max(
		0,
		Math.round(baseCount * resolvedIntensity),
	);
	const resolvedCount = debugParticles
		? applyParticleDebugCount(baseResolvedCount)
		: applyParticleProductionCount(baseResolvedCount);
	const resolvedSeed = seed ?? presetConfig?.seed ?? 1;
	const resolvedOpacity = opacity ?? presetConfig?.opacity ?? 1;
	const resolvedMaterial =
		material ?? presetConfig?.material ?? 'gold';
	const resolvedDriftMultiplier = driftMultiplier ?? 1;
	const resolvedSpeedScale = speedScale ?? presetConfig?.speedScale ?? 1;
	const shapeMix = presetConfig?.shapeMix;
	const simulationTuning = useMemo(
		() => buildSimulationTuning({debug, debugParticles}),
		[debug, debugParticles],
	);

	const particleDefinitions = useMemo(
		() =>
			createParticleLayerDefinitions({
				totalCount: resolvedCount,
				seed: resolvedSeed,
				width,
				height,
				shapeMix,
			}),
		[resolvedCount, resolvedSeed, width, height, shapeMix],
	);

	if (!enabled) {
		return null;
	}

	const renderedParticles = simulateParticleLayerFrames({
		definitions: particleDefinitions,
		frame,
		width,
		height,
		globalOpacity: resolvedOpacity,
		driftMultiplier: resolvedDriftMultiplier,
		movementSpeedScale: resolvedSpeedScale,
		tuning: simulationTuning,
		getDebugColor: getParticleDebugColor,
	}).map((particle) => {
		const behaviorVector = getMotionBehavior(
			behavior,
			frame,
			particle.id,
			behaviorIntensity,
		);

		return {
			...particle,
			x: particle.x + behaviorVector.x,
			y: particle.y + behaviorVector.y,
			rotate: behaviorVector.rotate,
			scaleX: behaviorVector.scaleX,
			scaleY: behaviorVector.scaleY,
		};
	});

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{debug || debugParticles ? (
				<div
					style={{
						position: 'absolute',
						top: 24,
						right: 24,
						padding: '12px 16px',
						borderRadius: 8,
						backgroundColor: 'rgba(0, 0, 0, 0.72)',
						color: '#f5f5f5',
						fontFamily: 'monospace',
						fontSize: 18,
						lineHeight: 1.4,
						zIndex: 10,
					}}
				>
					<div>ParticleEngine Debug</div>
					<div>kind: {resolvedKind}</div>
					<div>count: {resolvedCount}</div>
					<div>layers: background/mid/foreground</div>
					<div>seed: {resolvedSeed}</div>
					<div>frame: {frame}</div>
					{debugParticles ? <div>mode: debugParticles</div> : null}
				</div>
			) : null}
			{renderedParticles.map((particle) => (
				<ParticleRenderer
					key={particle.id}
					kind={resolvedKind}
					particle={particle}
					material={resolvedMaterial}
				/>
			))}
		</AbsoluteFill>
	);
}
