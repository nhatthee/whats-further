import {
	AbsoluteFill,
	interpolate,
	random,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

const PARTICLE_COUNT = 300;

type ParticleCategory = 'film-dust' | 'pollen' | 'leaf' | 'dirt';
type DepthLayer = 0 | 1 | 2;

type OrganicParticle = {
	id: number;
	category: ParticleCategory;
	startX: number;
	startY: number;
	baseWidth: number;
	baseHeight: number;
	opacity: number;
	scale: number;
	rotation: number;
	rotationSpeed: number;
	swayAmount: number;
	swaySpeed: number;
	fallRate: number;
	horizontalDrift: number;
	depth: DepthLayer;
	blur: number;
	phase: number;
	borderRadius: string;
	pulsePhase: number;
	isLargeBlur: boolean;
};

const DEPTH_CONFIG: Record<
	DepthLayer,
	{scale: number; speed: number; blurBoost: number; opacity: number}
> = {
	0: {scale: 0.62, speed: 0.58, blurBoost: 1.6, opacity: 0.78},
	1: {scale: 1, speed: 1, blurBoost: 1, opacity: 1},
	2: {scale: 1.28, speed: 1.38, blurBoost: 0.55, opacity: 1.12},
};

const CATEGORY_COLORS: Record<ParticleCategory, string> = {
	'film-dust': 'rgba(10, 9, 8, 0.92)',
	pollen: 'rgba(250, 246, 238, 0.82)',
	leaf: 'rgba(34, 28, 22, 0.84)',
	dirt: 'rgba(18, 16, 14, 0.9)',
};

const createParticle = (i: number): OrganicParticle => {
	const seed = `organic-v3-${i}`;
	const kindRoll = random(`${seed}-kind`);

	let category: ParticleCategory;
	if (kindRoll < 0.35) {
		category = 'film-dust';
	} else if (kindRoll < 0.6) {
		category = 'pollen';
	} else if (kindRoll < 0.8) {
		category = 'leaf';
	} else {
		category = 'dirt';
	}

	const depthRoll = random(`${seed}-depth`);
	const depth: DepthLayer = depthRoll < 0.38 ? 0 : depthRoll < 0.78 ? 1 : 2;
	const isLargeBlur = random(`${seed}-large`) < 0.06;

	let baseWidth: number;
	let baseHeight: number;

	if (isLargeBlur) {
		baseWidth = 14 + random(`${seed}-w`) * 10;
		baseHeight = 8 + random(`${seed}-h`) * 10;
	} else {
		switch (category) {
			case 'film-dust':
				baseWidth = 1 + random(`${seed}-w`) * 3;
				baseHeight = 1 + random(`${seed}-h`) * 2.5;
				break;
			case 'pollen':
				baseWidth = 2 + random(`${seed}-w`) * 6;
				baseHeight = 2 + random(`${seed}-h`) * 5;
				break;
			case 'leaf':
				baseWidth = 5 + random(`${seed}-w`) * 12;
				baseHeight = 1 + random(`${seed}-h`) * 3;
				break;
			case 'dirt':
				baseWidth = 2 + random(`${seed}-w`) * 8;
				baseHeight = 1.5 + random(`${seed}-h`) * 5;
				break;
		}
	}

	baseWidth = Math.min(baseWidth, 24);
	baseHeight = Math.min(baseHeight, 24);

	const yPower = category === 'pollen' ? 0.42 : 0.55;

	return {
		id: i,
		category,
		startX: random(`${seed}-x`) * 104 - 2,
		startY: Math.pow(random(`${seed}-y`), yPower) * 92,
		baseWidth,
		baseHeight,
		opacity: 0.15 + random(`${seed}-op`) * 0.4,
		scale: 0.7 + random(`${seed}-scale`) * 0.65,
		rotation: random(`${seed}-rot`) * 360,
		rotationSpeed: (random(`${seed}-rotspeed`) - 0.5) * 0.55,
		swayAmount: 1.1 + random(`${seed}-sway`) * 2.8,
		swaySpeed: 18 + random(`${seed}-sspeed`) * 32,
		fallRate: 0.035 + random(`${seed}-fall`) * 0.09,
		horizontalDrift: (random(`${seed}-hdrift`) - 0.5) * 1.2,
		depth,
		blur: isLargeBlur
			? 2 + random(`${seed}-blur`) * 2.5
			: random(`${seed}-blur-on`) > 0.42
				? random(`${seed}-blur`) * 2.2
				: 0,
		phase: random(`${seed}-phase`) * Math.PI * 2,
		borderRadius: `${14 + random(`${seed}-br1`) * 46}% ${
			22 + random(`${seed}-br2`) * 42
		}% ${18 + random(`${seed}-br3`) * 50}% ${
			10 + random(`${seed}-br4`) * 38
		}%`,
		pulsePhase: random(`${seed}-pulse`) * 140,
		isLargeBlur,
	};
};

const particles: OrganicParticle[] = Array.from({length: PARTICLE_COUNT}, (_, i) =>
	createParticle(i),
);

const getParticlePosition = (
	particle: OrganicParticle,
	frame: number,
): {x: number; y: number} => {
	const depth = DEPTH_CONFIG[particle.depth];
	const swayX =
		Math.sin(frame / particle.swaySpeed + particle.phase) *
		particle.swayAmount;
	const swayY =
		Math.cos(frame / (particle.swaySpeed * 1.35) + particle.phase * 0.7) *
		particle.swayAmount *
		0.35;
	const x =
		particle.startX +
		swayX +
		frame * particle.horizontalDrift * 0.06 * depth.speed;
	const y =
		(particle.startY +
			frame * particle.fallRate * 110 * depth.speed +
			swayY) %
		112;

	return {x, y};
};

const getParticleOpacity = (
	particle: OrganicParticle,
	frame: number,
	y: number,
): number => {
	const depth = DEPTH_CONFIG[particle.depth];
	const pulse = interpolate(
		(frame + particle.pulsePhase) % 100,
		[0, 50, 100],
		[0.65, 1, 0.7],
		{extrapolateRight: 'clamp'},
	);
	const upperBoost = interpolate(
		y,
		[0, 25, 50, 75, 112],
		[1.35, 1.2, 1, 0.88, 0.72],
		{extrapolateRight: 'clamp'},
	);

	return Math.min(
		particle.opacity * pulse * upperBoost * depth.opacity,
		0.55,
	);
};

const isLightParticle = (category: ParticleCategory) => category === 'pollen';

export const OrganicParticles: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const layerOpacity = interpolate(
		frame % (fps * 2.5),
		[0, fps * 1.25, fps * 2.5],
		[0.78, 0.92, 0.78],
		{extrapolateRight: 'clamp'},
	);

	const renderParticle = (particle: OrganicParticle) => {
		const {x, y} = getParticlePosition(particle, frame);
		const opacity = getParticleOpacity(particle, frame, y);
		const depth = DEPTH_CONFIG[particle.depth];
		const rotation = particle.rotation + frame * particle.rotationSpeed;
		const finalScale = particle.scale * depth.scale;
		const blurAmount = particle.blur * depth.blurBoost;

		return (
			<div
				key={`organic-v3-${particle.category}-${particle.id}`}
				style={{
					position: 'absolute',
					left: `${x}%`,
					top: `${y}%`,
					width: particle.baseWidth,
					height: particle.baseHeight,
					borderRadius: particle.borderRadius,
					backgroundColor: CATEGORY_COLORS[particle.category],
					opacity,
					transform: `rotate(${rotation}deg) scale(${finalScale})`,
					transformOrigin: 'center center',
					filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
				}}
			/>
		);
	};

	const darkParticles = particles.filter(
		(particle) => !isLightParticle(particle.category),
	);
	const lightParticles = particles.filter((particle) =>
		isLightParticle(particle.category),
	);

	return (
		<AbsoluteFill
			style={{
				opacity: layerOpacity,
				pointerEvents: 'none',
			}}
		>
			<AbsoluteFill style={{mixBlendMode: 'multiply'}}>
				{darkParticles
					.filter((particle) => particle.depth === 0)
					.map((particle) => renderParticle(particle))}
			</AbsoluteFill>

			<AbsoluteFill style={{mixBlendMode: 'screen'}}>
				{lightParticles
					.filter((particle) => particle.depth === 0)
					.map((particle) => renderParticle(particle))}
			</AbsoluteFill>

			<AbsoluteFill style={{mixBlendMode: 'multiply'}}>
				{darkParticles
					.filter((particle) => particle.depth === 1)
					.map((particle) => renderParticle(particle))}
			</AbsoluteFill>

			<AbsoluteFill style={{mixBlendMode: 'screen'}}>
				{lightParticles
					.filter((particle) => particle.depth === 1)
					.map((particle) => renderParticle(particle))}
			</AbsoluteFill>

			<AbsoluteFill style={{mixBlendMode: 'multiply'}}>
				{darkParticles
					.filter((particle) => particle.depth === 2)
					.map((particle) => renderParticle(particle))}
			</AbsoluteFill>

			<AbsoluteFill style={{mixBlendMode: 'screen'}}>
				{lightParticles
					.filter((particle) => particle.depth === 2)
					.map((particle) => renderParticle(particle))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
