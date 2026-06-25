import {
	AbsoluteFill,
	Audio,
	getInputProps,
	Img,
	interpolate,
	Loop,
	OffthreadVideo,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {OrganicParticles} from './OrganicParticles';
import {QUOTES, type QuoteLine} from './quotes';
import {
	getActiveQuoteIndex,
	getBlockExitOpacity,
	SubtitleLine,
} from './SubtitleAnimationV2';
import {getImagePath} from './lib/getImagePath';
import {getMusicFileForClip} from './music-map';
import {
	defaultQuoteReelInputProps,
	type QuoteReelInputProps,
} from './quote-reel-props';
import {buildMfaQuoteSchedule} from './subtitle-schedule';
import {getWordTimingsForClip} from './word-timings';

const CLIP_ID = '041';

const dustVideo = staticFile('overlays/dust.mp4');
const musicSrc = staticFile(`music/${getMusicFileForClip(CLIP_ID)}`);
const imageSrc = staticFile(getImagePath(CLIP_ID).replace(/^\//, ''));
const voiceSrc = staticFile(`audio/${CLIP_ID}-voice.mp3`);
const DUST_VIDEO_DURATION_SECONDS = 2;

const SHOW_ORGANIC_PARTICLES = true;

type Line = {
	start: number;
	end: number;
	text: string;
};

const buildLines = (fps: number, schedule: QuoteLine[]): Line[] =>
	schedule.map(({startSeconds = 0, endSeconds = 0, text}) => ({
		start: Math.round(startSeconds * fps),
		end: Math.round(endSeconds * fps),
		text,
	}));

const QUOTE_TEXT_STYLE: React.CSSProperties = {
	color: 'white',
	fontStyle: 'italic',
	fontSize: 84,
	textAlign: 'center',
	lineHeight: 1.2,
	fontFamily: 'Georgia, "Times New Roman", serif',
	textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
	margin: 0,
	width: '80%',
	position: 'absolute',
};

const FADE_FRAMES = 6;

export const QuoteReel: React.FC<QuoteReelInputProps> = () => {
	const inputProps = {
		...defaultQuoteReelInputProps,
		...getInputProps<QuoteReelInputProps>(),
	};
	// Render metadata only — experimental visual presets are not applied in production yet.
	void inputProps;

	const frame = useCurrentFrame();
	const {durationInFrames, fps} = useVideoConfig();

	const lineSchedule = QUOTES[CLIP_ID];
	const wordTimings = getWordTimingsForClip(CLIP_ID);
	const mfaSchedule =
		wordTimings.length > 0
			? buildMfaQuoteSchedule(lineSchedule, wordTimings, CLIP_ID)
			: null;
	const activeSchedule = mfaSchedule?.lines ?? lineSchedule;
	const lines = buildLines(fps, activeSchedule);
	const fadeFrames = FADE_FRAMES;
	const activeQuoteIndex = getActiveQuoteIndex(frame, fadeFrames, lines);
	const blockWordTimings =
		activeQuoteIndex >= 0
			? mfaSchedule?.blockWordTimings[activeQuoteIndex]
			: undefined;
	const dustLoopDurationInFrames = Math.round(fps * DUST_VIDEO_DURATION_SECONDS);

	const scale = interpolate(frame, [0, durationInFrames], [1, 1.12], {
		extrapolateRight: 'clamp',
	});

	const grainOpacity = interpolate(
		frame % (fps / 6),
		[0, fps / 12, fps / 6],
		[0.04, 0.08, 0.05],
		{extrapolateRight: 'clamp'},
	);

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill style={{overflow: 'hidden', backgroundColor: 'black'}}>
				<AbsoluteFill
					style={{
						transform: `scale(${scale})`,
						transformOrigin: 'center center',
					}}
				>
					<Img
						src={imageSrc}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							display: 'block',
						}}
					/>
				</AbsoluteFill>
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					opacity: grainOpacity,
					pointerEvents: 'none',
					mixBlendMode: 'overlay',
				}}
			>
				<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
					<filter id="film-grain">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.85"
							numOctaves="4"
							seed={frame}
							stitchTiles="stitch"
						/>
					</filter>
					<rect width="100%" height="100%" filter="url(#film-grain)" />
				</svg>
			</AbsoluteFill>

			<Loop durationInFrames={dustLoopDurationInFrames}>
				<OffthreadVideo
					src={dustVideo}
					muted
					style={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						opacity: 0.35,
						mixBlendMode: 'screen',
						pointerEvents: 'none',
					}}
				/>
			</Loop>

			{SHOW_ORGANIC_PARTICLES ? <OrganicParticles /> : null}

			<AbsoluteFill
				style={{
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				{activeQuoteIndex >= 0 ? (
					<SubtitleLine
						text={lines[activeQuoteIndex].text}
						frame={frame}
						blockStart={lines[activeQuoteIndex].start}
						blockStartSeconds={
							activeSchedule[activeQuoteIndex].startSeconds ?? 0
						}
						blockEndSeconds={activeSchedule[activeQuoteIndex].endSeconds ?? 0}
						fps={fps}
						textStyle={QUOTE_TEXT_STYLE}
						blockOpacity={getBlockExitOpacity(
							frame,
							activeQuoteIndex,
							fadeFrames,
							lines,
						)}
						wordTimings={wordTimings.length > 0 ? wordTimings : undefined}
						blockWordTimings={blockWordTimings}
						isLastBlock={activeQuoteIndex === activeSchedule.length - 1}
					/>
				) : null}
			</AbsoluteFill>

			<Audio src={voiceSrc} volume={1} />
			<Audio src={musicSrc} volume={0.1} />
		</AbsoluteFill>
	);
};
