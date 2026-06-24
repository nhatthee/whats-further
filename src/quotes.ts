export type QuoteLine = {
	text: string;
	startSeconds?: number;
	endSeconds?: number;
	note?: string;
};

export const QUOTES: Record<string, QuoteLine[]> = {
	'001': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The truth is...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Most people never become who they could be.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not because they failed.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Because they stopped too early.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: "What's further?"},
	],
	'002': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The saddest truth...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Sometimes love survives only in memories.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not in reality anymore.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'But inside your heart forever.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Still there.'},
	],
	'003': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The strange thing...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You miss the future more than them.',
		},
		{
			startSeconds: 4.6,
			endSeconds: 6.7,
			text: 'Not the person themselves.',
		},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'But the life you imagined together.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Sometimes only.'},
	],
	'004': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The hardest goodbye...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Some endings arrive without words or warnings.',
		},
		{
			startSeconds: 4.6,
			endSeconds: 6.7,
			text: 'No explanation was offered.',
		},
		{
			startSeconds: 6.7,
			endSeconds: 9.0,
			text: 'Only questions remained behind afterward.',
		},
		{startSeconds: 9.0, endSeconds: 10.6, text: 'For years.'},
	],
	'005': [
		{startSeconds: 0.0, endSeconds: 1.46, text: 'The painful lesson...'},
		{
			startSeconds: 1.46,
			endSeconds: 4.88,
			text: 'Love and permanence are different things entirely.',
		},
		{
			startSeconds: 4.88,
			endSeconds: 6.96,
			text: 'Not always connected together.',
		},
		{
			startSeconds: 6.96,
			endSeconds: 9.02,
			text: 'Some people stay briefly forever.',
		},
		{startSeconds: 9.02, endSeconds: 10.6, text: 'In memory.'},
	],
	'006': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The hidden reason...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Most people miss themselves more than others.',
		},
		{
			startSeconds: 4.6,
			endSeconds: 6.7,
			text: 'Not the relationship itself.',
		},
		{
			startSeconds: 6.7,
			endSeconds: 9.0,
			text: 'But who they became inside.',
		},
		{startSeconds: 9.0, endSeconds: 10.6, text: 'Back then.'},
	],
	'007': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'Love teaches slowly.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Some hearts return to places once forgotten again,',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'not seeking old answers,'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'but remembering who they became',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'afterward, quietly.'},
	],
	'008': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The hardest part.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Some people leave before the ending feels real.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'No final door closes.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Only silence keeps answering back.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Too often.'},
	],
	'009': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The truth remains.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Love sometimes changes shape after endings arrive quietly,',
		},
		{
			startSeconds: 4.6,
			endSeconds: 6.7,
			text: 'not into complete absence,',
		},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'but something softer inside memory,',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'still moving.'},
	],
	'010': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'Closure feels strange.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'People wait for answers that never arrive fully.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not because truth hides,'},
		{
			startSeconds: 6.7,
			endSeconds: 9.0,
			text: 'but because life keeps moving',
		},
		{startSeconds: 9.0, endSeconds: 10.6, text: 'without permission.'},
	],
	'011': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The quiet lesson...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You cannot make someone choose you forever again,',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'not through more effort,'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'but through becoming yourself fully,',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'at last.'},
	],
	'012': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'Love feels simple.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'The best moments rarely announce their importance, not',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'while happening yet, but'},
		{
			startSeconds: 6.7,
			endSeconds: 9.0,
			text: 'but years after they pass.',
		},
		{startSeconds: 9.0, endSeconds: 10.6, text: 'Too late.'},
	],
	'013': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'Missing feels different.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You often miss yourself inside old moments too,',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'not only their presence,'},
		{
			startSeconds: 6.7,
			endSeconds: 9.0,
			text: 'but your softer former self',
		},
		{startSeconds: 9.0, endSeconds: 10.6, text: 'between pages.'},
	],
	'014': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The quiet truth.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Some hearts heal while still remembering everything clearly,',
		},
		{
			startSeconds: 4.6,
			endSeconds: 6.7,
			text: 'not through forgetting completely,',
		},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'but by carrying love differently',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'each day.'},
	],
	'015': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The strange pain.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You can miss someone without wanting them back,',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'not from weakness anymore,'},
		{
			startSeconds: 6.7,
			endSeconds: 11.1,
			text: 'but because memories remain human',
		},
		{startSeconds: 11.1, endSeconds: 12.2, text: 'inside you.'},
	],
	'016': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'Love changes everything,'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'even when two people are no longer together,',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'not always loudly either.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Sometimes it stays underneath,',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'still breathing.'},
	],
	'017': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The hidden ache.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Some goodbyes happen long before anyone speaks,',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'not in one moment,'},
		{
			startSeconds: 6.7,
			endSeconds: 9.0,
			text: 'but through smaller daily distances,',
		},
		{startSeconds: 9.0, endSeconds: 11.78, text: 'growing quietly.'},
	],
	'018': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The painful truth...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Being chosen once does not mean forever.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not without presence daily.'},
		{
			startSeconds: 6.7,
			endSeconds: 9.25,
			text: 'Love also needs returning.',
		},
		{startSeconds: 9.25, endSeconds: 11.78, text: 'Again. Again.'},
	],
	'019': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'Missing becomes softer'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'when you stop asking what went wrong, not',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'because pain vanished, but'},
		{
			startSeconds: 6.7,
			endSeconds: 8.68,
			text: 'because peace finally answered',
		},
		{startSeconds: 8.68, endSeconds: 11.78, text: 'for once.'},
	],
	'020': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The final lesson.'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Some love stories end without becoming failures.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not every ending breaks.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Some endings simply return you.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Back home.'},
	],
	'021': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The overlooked truth...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'People change while standing beside you.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not all at once.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: "Until one day they're complete strangers.",
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Again.'},
	],
	'022': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The difficult part...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Nobody ever warns you about ordinary endings.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'No final moment.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Just less and less time together.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Slowly.'},
	],
	'023': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The unexpected pain...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Memories grow stronger after people leave.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not before then.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Somehow absence makes everything much louder.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Still.'},
	],
	'024': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The hidden cost...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Waiting steals more than simple rejection.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Nobody truly sees it.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Years disappear inside uncertainty alone.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Quietly.'},
	],
	'025': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The sad reality...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Some promises quietly expire without notice.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Nobody ever admits it.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Yet everything changes around them.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Anyway.'},
	],
	'026': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'One quiet day...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You realize ordinary moments were carrying your life.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not the milestones themselves.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Just days you barely noticed.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Too late.'},
	],
	'027': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The unsettling thing...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Time moves faster than your awareness.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'You rarely notice it.'},
		{
			startSeconds: 6.7,
			endSeconds: 9.48,
			text: 'Until memories outnumber future plans.',
		},
		{startSeconds: 9.48, endSeconds: 11.78, text: 'Suddenly.'},
	],
	'028': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The aging trick...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You feel young while seasons are quietly leaving.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Never all at once.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Until mirrors finally answer differently.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Years pass.'},
	],
	'029': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The quiet danger...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Tomorrow always feels safely available forever.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'It never truly is.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Eventually opportunities stop returning altogether.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Unannounced.'},
	],
	'030': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The hard truth...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Most people spend life postponing themselves.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: "Not because they're lazy."},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Because certainty never truly arrives.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'First.'},
	],
	'031': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The unseen growth...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You become stronger while everything feels quietly broken.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not where people watch.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Only when silence witnesses effort.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Keep going.'},
	],
	'032': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The honest truth...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Healing slowly changes what you tolerate.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not quite overnight.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'But eventually you stop returning back.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Quietly.'},
	],
	'033': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The necessary distance...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You outgrow versions that once protected you completely.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not because they failed.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Because life eventually asks differently.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Move forward.'},
	],
	'034': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The quiet victory...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You keep going without any witnesses.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'No applause first.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Just quiet discipline becoming self respect.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Daily.'},
	],
	'035': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The honest becoming...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You stop asking permission from smaller versions inside.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not because fear leaves.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Because regret becomes heavier daily.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Choose yourself.'},
	],
	'036': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The deeper choice...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Your life changes when honesty becomes necessary again.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not motivation or luck.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Just one truth followed daily.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Starting now.'},
	],
	'037': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The dangerous thing...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'You can survive without real purpose.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: "For longer than you'd expect."},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'But not without losing yourself.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Along the way.'},
	],
	'038': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The quiet calling...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Your future keeps asking for courage.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not seeking perfection.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Only movement before you feel ready.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Forward.'},
	],
	'039': [
		{startSeconds: 0.0, endSeconds: 1.4, text: 'The quiet direction...'},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'Speed means nothing when your compass is missing.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Most people forget this.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'Running faster still changes nothing.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Find north.'},
	],
	'040': [
		{startSeconds: 0.0, endSeconds: 1.4, text: "What's further ahead..."},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'The better version waiting beyond comfort.',
		},
		{startSeconds: 4.6, endSeconds: 6.7, text: 'Not any easier.'},
		{
			startSeconds: 6.7,
			endSeconds: 10.0,
			text: 'But far more honest than survival.',
		},
		{startSeconds: 10.0, endSeconds: 11.78, text: 'Finally.'},
	],
	'041': [
		{
			startSeconds: 0.0,
			endSeconds: 1.4,
			text: 'Discipline is not built in one perfect day.',
		},
		{
			startSeconds: 1.4,
			endSeconds: 4.6,
			text: 'It is built in the quiet mornings',
		},
		{
			startSeconds: 4.6,
			endSeconds: 6.7,
			text: 'when no one is watching.',
		},
		{startSeconds: 6.7, endSeconds: 10.0, text: 'Keep showing up.'},
		{
			startSeconds: 10.0,
			endSeconds: 11.78,
			text: 'That is how you become unstoppable.',
		},
	],
	'042': [
		{ text: "Growth begins where comfort ends", note: "growth" },
		{ text: "Silent steps shape a stronger soul", note: "resilience" },
		{ text: "Every fall teaches how to rise", note: "hope" },
		{ text: "Patience holds the bloom in waiting", note: "patience" },
		{ text: "In quiet moments, true change lives", note: "reflection" },
	],
	'043': [
		{ text: "Time moves quietly beyond our grasp", note: "time" },
		{ text: "Moments fade but leave marks inside", note: "memory" },
		{ text: "Hold what counts, release what drifts", note: "lettinggo" },
		{ text: "The future waits, patient and unseen", note: "hope" },
		{ text: "Every second whispers a new start", note: "growth" },
	],
	'044': [
		{ text: "Sometimes love fades without goodbye", note: "loss" },
		{ text: "Leaving silence where words once lived", note: "reflection" },
		{ text: "We carry its weight in quiet moments", note: "healing" },
		{ text: "Learning to breathe through the ache", note: "resilience" },
		{ text: "And find strength beneath the shadows", note: "hope" },
	],
	'045': [
		{ text: "Peace begins in the quiet moments within", note: "peace" },
		{ text: "Let your heart find its steady rhythm", note: "calm" },
		{ text: "Release the noise that pulls you away", note: "focus" },
		{ text: "Breathe deeply into stillness and truth", note: "healing" },
		{ text: "Here, you discover a world renewed", note: "hope" },
	],
};

/** @deprecated Legacy clip-specific prompts. New clips use buildThemedImagePrompt from src/image-themes.ts */
export const IMAGE_PROMPTS: Record<string, string> = {
	'040':
		'A lone runner on a dramatic mountain trail at golden sunrise. Winding ridgeline path leading toward distant layered peaks. Morning mist drifting through vast valleys below. Symbol of perseverance, honest growth, and the better version waiting beyond comfort. Warm amber light against deep cool blue shadows. Shallow atmospheric haze.',
};
