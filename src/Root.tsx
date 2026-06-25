import {Composition} from 'remotion';
import {MotionLab} from './MotionLab';
import {QuoteReel} from './QuoteReel';
import {defaultQuoteReelInputProps} from './quote-reel-props';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="QuoteReel"
				component={QuoteReel}
				durationInFrames={282}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={defaultQuoteReelInputProps}
			/>
			<Composition
				id="MotionLab"
				component={MotionLab}
				durationInFrames={270}
				fps={30}
				width={1080}
				height={1920}
			/>
		</>
	);
};
