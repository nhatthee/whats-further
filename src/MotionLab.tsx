import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ParticleEngine} from './effects/ParticleEngine';
import { PaperRenderer } from "./effects/renderers/PaperRenderer";

const imageSrc = staticFile('images/041.webp');

// Experimental particle / paper / preset tests only. Keep false for normal preview.
const ENABLE_EXPERIMENTAL_PARTICLE_TESTS = false;

export const MotionLab: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<Img
				src={imageSrc}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					display: 'block',
				}}
			/>

			{ENABLE_EXPERIMENTAL_PARTICLE_TESTS ? (
				<>
					<ParticleEngine
						enabled
						kind="petal"
						preset="golden-sunset"
						behavior="flutter"
						behaviorIntensity={2.4}
					/>
					<PaperRenderer
						particle={{
							id: 999,
							x: 540,
							y: 960,
							size: 12,
							blur: 0,
							alpha: 1,
							rotate: 25,
							scaleX: 1,
							scaleY: 1,
						}}
					/>
				</>
			) : null}

			<AbsoluteFill
				style={{
					justifyContent: 'flex-start',
					alignItems: 'flex-start',
					padding: 24,
					pointerEvents: 'none',
				}}
			>
				<div
					style={{
						color: 'white',
						fontFamily: 'Georgia, "Times New Roman", serif',
						fontSize: 28,
						opacity: 0.9,
						textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
					}}
				>
					Motion Lab — experimental sandbox (set ENABLE_EXPERIMENTAL_PARTICLE_TESTS)
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
