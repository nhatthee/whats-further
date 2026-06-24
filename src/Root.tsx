import {Composition} from 'remotion';
import {QuoteReel} from './QuoteReel';

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
			/>
		</>
	);
};
