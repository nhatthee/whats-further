import {QUOTES} from './quotes';

export type ImageThemeKey =
	| 'growth'
	| 'discipline'
	| 'lost_love'
	| 'time'
	| 'loneliness'
	| 'resilience'
	| 'peace'
	| 'adventure'
	| 'simple_joys'
	| 'connection';

export type ImageSceneTemplate = {
	title: string;
	scene: string;
	symbolism: string;
};

export type SelectedScene = {
	theme: ImageThemeKey;
	sceneTitle: string;
	scene: string;
	symbolism: string;
};

const THEME_KEYS: ImageThemeKey[] = [
	'growth',
	'discipline',
	'lost_love',
	'time',
	'loneliness',
	'resilience',
	'peace',
	'adventure',
	'simple_joys',
	'connection',
];

const THEME_MOODS: Record<ImageThemeKey, string> = {
	growth: 'Quiet momentum, becoming, and honest progress.',
	discipline: 'Focused determination, daily ritual, and inner strength.',
	lost_love: 'Tender absence, memory, and what remains after goodbye.',
	time: 'Passage, impermanence, and the weight of fleeting moments.',
	loneliness: 'Solitude, stillness, and the ache of distance.',
	resilience: 'Endurance through hardship and quiet defiance.',
	peace: 'Calm presence, acceptance, and gentle clarity.',
	adventure: 'Curiosity, movement, and the call of the unknown.',
	simple_joys: 'Small comforts, everyday warmth, and unhurried living.',
	connection: 'Belonging, care, and shared human presence.',
};

/** Recommended color tones per theme (quote-emotion palette guide). */
const THEME_COLOR_PALETTES: Record<ImageThemeKey, string> = {
	time: 'brown, gold, gray, warm soft tones',
	growth: 'green, brown, blue, morning light',
	lost_love: 'dark blue, gray, black, muted melancholy tones',
	connection: 'pink, orange, light red, warm golden light',
	discipline: 'brown, gold, muted green, disciplined morning light',
	loneliness: 'dark blue, gray, black, cool soft shadows',
	resilience: 'blue, yellow, light orange, hopeful dawn light',
	peace: 'blue, yellow, light orange, soft bright warmth',
	adventure: 'green, brown, blue, expansive horizon light',
	simple_joys: 'pink, orange, light red, cozy warm light',
};

/** Clear visual symbols per theme (Flux quote-content guide). */
const THEME_VISUAL_SYMBOLS: Record<ImageThemeKey, string> = {
	time: 'hourglass, clock, sunrise or sunset, passage of time, patience',
	growth:
		'mountain path, forest trail, nature, sunrise, stepping beyond comfort, progress',
	lost_love:
		'empty chair, fading light, distance, memory, quiet absence after goodbye',
	connection:
		'togetherness, shared moment, warm romantic atmosphere, evening golden light',
	discipline:
		'daily ritual, early morning, focused repetition, inner strength, consistency',
	loneliness: 'solitude, still distance, stillness, single figure or empty space',
	resilience: 'rising again, weathered path, quiet defiance, enduring light',
	peace: 'open sky, calm horizon, gentle clarity, soft sunrise, stillness',
	adventure: 'open road, distant horizon, movement, curiosity, unknown ahead',
	simple_joys:
		'small comforts, everyday warmth, tea, sunlight through a window, unhurried living',
};

const QUOTE_IMAGE_PRINCIPLES = [
	'Understand the quote meaning before illustrating.',
	'Use clear symbols that communicate the quote immediately.',
	'Keep color tones consistent with the quote emotion.',
	'Evoke feeling on first glance.',
	'Simple but meaningful composition — not overcrowded.',
].join('\n');

const CINEMATIC_LIGHTING = [
	'Cinematic composition.',
	'Soft focus.',
	'Warm atmospheric light.',
	'Emotional and premium.',
].join('\n');

export const IMAGE_THEMES: Record<ImageThemeKey, ImageSceneTemplate[]> = {
	growth: [
		{
			title: 'Greenhouse with young plants',
			scene:
				'A sunlit greenhouse with rows of young seedlings in clay pots on wooden benches, morning light through glass panes',
			symbolism: 'nurtured potential and patient cultivation',
		},
		{
			title: 'Seedling breaking through soil',
			scene:
				'A small green seedling pushing through cracked dark soil, delicate leaves unfurling against a soft beige backdrop',
			symbolism: 'the first brave step of becoming',
		},
		{
			title: 'Forest trail in morning light',
			scene:
				'A narrow forest trail winding between tall trees, dappled morning light on mossy ground, footsteps worn into the earth',
			symbolism: 'steady progress through uncertainty',
		},
		{
			title: 'Mountain path with distant horizon',
			scene:
				'A stone path ascending through misty foothills, wooden markers along the way, a pale horizon beyond the ridges',
			symbolism: 'the long climb toward a better self',
		},
		{
			title: 'Chessboard with one piece moved forward',
			scene:
				'A wooden chessboard on a low table with a single pawn advanced one square ahead, soft brush shadows across the board',
			symbolism: 'one deliberate choice that changes everything',
		},
		{
			title: 'Watering houseplants',
			scene:
				'A person pouring water from a ceramic watering can onto potted herbs on a windowsill, droplets catching soft light',
			symbolism: 'tending what you want to grow',
		},
		{
			title: 'Studying at desk',
			scene:
				'A person studying at a wooden desk with open books and a single candle, absorbed in quiet learning before the day begins',
			symbolism: 'learning as an act of self-transformation',
		},
		{
			title: 'Climbing stairs toward warm light',
			scene:
				'Stone stairs rising beside an old building, warm light pooling on the upper steps, soft mist in the street below',
			symbolism: 'rising step by step into a new day',
		},
	],
	discipline: [
		{
			title: 'Morning Runner',
			scene:
				'A lone runner crossing a quiet city bridge at dawn, soft mist around distant buildings',
			symbolism:
				'daily discipline, consistency, and showing up before the world wakes',
		},
		{
			title: 'Journaling Desk',
			scene:
				'A quiet wooden desk with an open notebook, a warm lamp, and a cup of tea before sunrise',
			symbolism: 'planning, focus, and intentional living',
		},
		{
			title: 'Empty Gym',
			scene:
				'An empty gym before dawn with one training mat, soft window light, and still air',
			symbolism: 'private effort, unseen work, and inner strength',
		},
		{
			title: 'Meditation Room',
			scene:
				'A simple quiet room with a meditation cushion, morning light, and a phone placed far away',
			symbolism: 'focus, restraint, and mental discipline',
		},
		{
			title: 'Cyclist Morning Road',
			scene:
				'A cyclist riding alone on a calm morning road beside trees and soft fog',
			symbolism: 'endurance, rhythm, and steady progress',
		},
		{
			title: 'Lighthouse Storm',
			scene:
				'A solitary lighthouse standing firm against wind and dark ocean waves',
			symbolism: 'stability, discipline, and staying steady through pressure',
		},
		{
			title: 'Reading Before Sunrise',
			scene:
				'A person reading a book beside a window before sunrise, with soft light entering the room',
			symbolism: 'self-education, patience, and quiet growth',
		},
		{
			title: 'Swimmer Training',
			scene:
				'A swimmer training alone in a calm pool during early morning light',
			symbolism: 'repetition, resilience, and commitment',
		},
	],
	lost_love: [
		{
			title: 'Empty train seat',
			scene:
				'An empty train seat beside a rain-streaked window, a folded scarf left on the cushion, countryside blurring past',
			symbolism: 'the space someone used to fill',
		},
		{
			title: 'Rainy window with city lights',
			scene:
				'Rain tracing paths down a window, a single teacup cooling on the sill, blurred city lights beyond',
			symbolism: 'longing pressed against glass',
		},
		{
			title: 'Airport terminal at night',
			scene:
				'A nearly empty airport gate at night, soft overhead lights, one unattended suitcase near a bench',
			symbolism: 'departures that never fully leave you',
		},
		{
			title: 'Empty cafe table',
			scene:
				'An empty cafe table with two chairs, one cup untouched, afternoon light on a plain wooden surface',
			symbolism: 'conversations that will not continue',
		},
		{
			title: 'Sunset apartment balcony',
			scene:
				'A small apartment balcony at sunset, an empty chair facing the sky, warm light on bare railings',
			symbolism: 'a home that still remembers them',
		},
		{
			title: 'Plain closed envelope on desk',
			scene:
				'A plain closed envelope on a wooden desk beside dried flowers, dust motes in slanted light',
			symbolism: 'words left unsaid and unread',
		},
		{
			title: 'Two umbrellas separated in rain',
			scene:
				'Two umbrellas leaning apart on a rainy street corner, puddles reflecting lantern light, footprints diverging',
			symbolism: 'paths that no longer walk together',
		},
		{
			title: 'Empty lakeside bench',
			scene:
				'An empty wooden bench beside a still lake at dusk, ripples fading on the water, a fallen leaf on the seat',
			symbolism: 'waiting for someone who will not return',
		},
	],
	time: [
		{
			title: 'Long empty highway',
			scene:
				'A long empty highway stretching through open land toward a pale horizon, heat shimmer and distant hills',
			symbolism: 'years unfolding mile by mile',
		},
		{
			title: 'Ocean horizon at dusk',
			scene:
				'A wide ocean horizon at dusk from a rocky shore, gentle waves erasing footprints in sand, clouds drifting overhead',
			symbolism: 'moments washing away and returning',
		},
		{
			title: 'Old clock in quiet room',
			scene:
				'An old wall clock with worn brass hands in a quiet room, soft shadow of the pendulum on plain wallpaper',
			symbolism: 'hours you cannot reclaim',
		},
		{
			title: 'Autumn trees losing leaves',
			scene:
				'A row of autumn trees losing leaves into a courtyard, leaves spiraling in a light breeze, bare branches emerging',
			symbolism: 'seasons changing whether you are ready or not',
		},
		{
			title: 'Hourglass beside candle',
			scene:
				'An hourglass beside a burning candle on a low table, sand halfway fallen, wax dripping slowly',
			symbolism: 'the finite glow of the present',
		},
		{
			title: 'Train crossing distant field',
			scene:
				'A distant train crossing a rural field at twilight, smoke trailing behind, paths cutting through golden grass',
			symbolism: 'life moving on without pause',
		},
		{
			title: 'Shadow moving across tatami floor',
			scene:
				'A long shadow moving across tatami flooring as sun shifts through paper screens, a bonsai silhouetted on the wall',
			symbolism: 'the quiet passage of an afternoon',
		},
		{
			title: 'Pages blowing in wind',
			scene:
				'Loose blank pages lifting and tumbling in a breezy alley, no readable content, one page pinned to a wall',
			symbolism: 'days slipping beyond your grasp',
		},
	],
	loneliness: [
		{
			title: 'Person beside window at night',
			scene:
				'A person sitting beside a window at night, chin resting on hand, city lights scattered in the distance',
			symbolism: 'solitude among countless lives',
		},
		{
			title: 'Empty street after rain',
			scene:
				'An empty cobblestone street after rain, reflections of lanterns in puddles, steam rising from a grate',
			symbolism: 'quiet that follows the crowd',
		},
		{
			title: 'Single boat on misty lake',
			scene:
				'A single small boat drifting on a misty lake, oars resting inside, pale fog dissolving the far shore',
			symbolism: 'adrift without an anchor',
		},
		{
			title: 'Rooftop under moonlight',
			scene:
				'A rooftop terrace under moonlight with a lone chair and potted plant, laundry lines swaying in the breeze',
			symbolism: 'height without company',
		},
		{
			title: 'Quiet laundromat at midnight',
			scene:
				'A quiet laundromat at midnight with one washing machine spinning, fluorescent glow on empty plastic chairs',
			symbolism: 'ordinary hours spent alone',
		},
		{
			title: 'Empty bus stop',
			scene:
				'An empty bus stop on a suburban road, wind moving a loose flyer without readable content, headlights in fog',
			symbolism: 'waiting without knowing for whom',
		},
		{
			title: 'Lone lantern on snow path',
			scene:
				'A lone paper lantern glowing on a snow-covered path between dark pines, footprints leading into the distance',
			symbolism: 'a small light in vast silence',
		},
		{
			title: 'Person looking at city lights',
			scene:
				'A person standing at a hilltop railing overlooking a sprawling city of lights, brim lowered, breath visible in cold air',
			symbolism: 'near millions yet far from one soul',
		},
	],
	resilience: [
		{
			title: 'Lighthouse in storm',
			scene:
				'A stone lighthouse beam cutting through storm clouds and rough seas, waves crashing against the base, rain slanting sideways',
			symbolism: 'standing firm when everything shakes',
		},
		{
			title: 'Cracked stone with flower growing',
			scene:
				'A small wildflower growing from a crack in weathered stone, roots visible, petals trembling in the wind',
			symbolism: 'beauty forcing its way through hardship',
		},
		{
			title: 'Mountain climber on steep wall',
			scene:
				'A climber on a steep rock wall, rope trailing below, clouds swirling around the summit',
			symbolism: 'refusing to let go mid-climb',
		},
		{
			title: 'Tree bending in wind',
			scene:
				'An old pine tree bending deeply in coastal wind, roots gripping exposed rock, sea spray in the background',
			symbolism: 'flexibility as a form of survival',
		},
		{
			title: 'Small boat against waves',
			scene:
				'A small wooden boat cresting heavy waves, sail taut against dark water, deck steady in the storm',
			symbolism: 'navigating storms without turning back',
		},
		{
			title: 'Runner in heavy rain',
			scene:
				'A runner pushing forward through heavy rain on a riverside path, determined stride through the downpour',
			symbolism: 'moving anyway when stopping feels easier',
		},
		{
			title: 'Repaired ceramic bowl with gold seams',
			scene:
				'A ceramic bowl repaired with gleaming gold kintsugi seams, resting on rough linen, chips honored rather than hidden',
			symbolism: 'strength found in what was broken',
		},
		{
			title: 'Candle staying lit in darkness',
			scene:
				'A single candle flame steady inside a stone alcove while darkness presses close, wax pooled at the base',
			symbolism: 'hope that refuses to go out',
		},
	],
	peace: [
		{
			title: 'Meditation cushion in quiet room',
			scene:
				'A meditation cushion in a sparse quiet room, incense smoke curling upward, soft light through paper screens',
			symbolism: 'stillness cultivated on purpose',
		},
		{
			title: 'Temple gate with morning mist',
			scene:
				'A weathered wooden gate at the end of a mossy path, stone lanterns along the approach, morning mist',
			symbolism: 'crossing from noise into calm',
		},
		{
			title: 'Zen garden with raked sand',
			scene:
				'A zen garden with concentric circles raked around stones, bamboo fence, empty gravel in soft afternoon light',
			symbolism: 'order found in simplicity',
		},
		{
			title: 'Listening to dharma',
			scene:
				'A person seated on a cushion listening intently in a quiet hall, teacher silhouetted before an empty wall',
			symbolism: 'receiving wisdom in silence',
		},
		{
			title: 'Incense smoke near window',
			scene:
				'Incense smoke drifting near an open window, curtains barely moving, a low table with tea and an empty cushion',
			symbolism: 'breath slowing into the present',
		},
		{
			title: 'Koi pond with gentle ripples',
			scene:
				'A koi pond with orange and white fish gliding beneath lily pads, gentle ripples across still water',
			symbolism: 'grace moving beneath the surface',
		},
		{
			title: 'Morning tea ritual',
			scene:
				'A morning tea ritual on a woven mat, steam rising from a ceramic cup, bowl and whisk arranged with care',
			symbolism: 'peace built one small ritual at a time',
		},
		{
			title: 'Quiet shrine path',
			scene:
				'A quiet forest path with wooden markers fading into green shade, moss-covered stone figures at the sides',
			symbolism: 'sacred calm on an ordinary walk',
		},
	],
	adventure: [
		{
			title: 'Cycling beside mountain lake',
			scene:
				'A bicycle leaning beside a mountain lake trail, calm water reflecting peaks, helmet on the handlebars',
			symbolism: 'freedom found in motion',
		},
		{
			title: 'Climbing rock wall',
			scene:
				'A climber scaling a sunlit rock wall above a forest canopy, chalk on hands, rope at a belay station below',
			symbolism: 'choosing the harder beautiful path',
		},
		{
			title: 'Swimming in clear water',
			scene:
				'A person wading into crystal clear river water, smooth stones visible below, dappled light on the surface',
			symbolism: 'immersing yourself in the unknown',
		},
		{
			title: 'Road trip on mountain road',
			scene:
				'A small car on a winding mountain road seen from above, hairpin curves, valley mist below',
			symbolism: 'the open road as invitation',
		},
		{
			title: 'Paragliding over valley',
			scene:
				'A paraglider silhouette soaring over a green valley, patchwork fields below, clouds at eye level',
			symbolism: 'trusting the wind to carry you',
		},
		{
			title: 'Walking through bamboo forest',
			scene:
				'A person with a backpack walking through a tall bamboo forest, green light filtering down the path',
			symbolism: 'curiosity leading you forward',
		},
		{
			title: 'Crossing wooden bridge',
			scene:
				'A weathered wooden bridge spanning a rushing gorge, figure mid-crossing, mist rising from the river below',
			symbolism: 'stepping between safety and discovery',
		},
		{
			title: 'Hiking with backpack',
			scene:
				'A hiker with a worn backpack on a ridge trail, map clipped to the strap, valleys unfolding ahead',
			symbolism: 'carrying only what you need to explore',
		},
	],
	simple_joys: [
		{
			title: 'Reading a book by window',
			scene:
				'A person reading a book beside a rain-speckled window, blanket over knees, soft afternoon light',
			symbolism: 'contentment in a quiet corner',
		},
		{
			title: 'Coffee time at small table',
			scene:
				'A steaming cup of coffee on a small round table beside a pastry, morning light on a checkered cloth',
			symbolism: 'pleasure in an unhurried morning',
		},
		{
			title: 'Playing with pet',
			scene:
				'A person kneeling to play with a small dog in a sunny courtyard, a ball mid-tumble, tail wagging blur',
			symbolism: 'joy that asks for nothing back',
		},
		{
			title: 'Feeding fish in pond',
			scene:
				'Hands sprinkling fish food over a garden pond, koi gathering at the surface, ripples spreading outward',
			symbolism: 'tending small life with care',
		},
		{
			title: 'Sunset relax on chair',
			scene:
				'A wooden lounge chair on a porch at sunset, empty teacup on armrest, sky washed in amber',
			symbolism: 'rest earned and freely taken',
		},
		{
			title: 'Cooking simple meal',
			scene:
				'A modest kitchen with vegetables chopped on a wooden board, steam rising from a pot, herbs on the sill',
			symbolism: 'nourishing yourself with your own hands',
		},
		{
			title: 'Watering houseplants',
			scene:
				'A sunny room full of houseplants on shelves and windowsills, watering can in hand, droplets on broad leaves',
			symbolism: 'daily care that keeps life green',
		},
		{
			title: 'Lying down with mobile phone',
			scene:
				'A person lying on a futon holding a mobile phone loosely, soft glow on their face, cat curled at their feet',
			symbolism: 'small digital comforts at the end of a day',
		},
	],
	connection: [
		{
			title: 'Family dinner',
			scene:
				'A low table set for family dinner with shared dishes, hands reaching for food, warm lantern light overhead',
			symbolism: 'belonging served in ordinary meals',
		},
		{
			title: 'Friends gathering',
			scene:
				'Friends gathered around a fire pit in a backyard, relaxed postures, mugs and blankets scattered',
			symbolism: 'warmth multiplied in company',
		},
		{
			title: 'Helping others',
			scene:
				'One person helping another carry heavy bundles up stone steps, shared effort against muted gray stone',
			symbolism: 'strength offered without being asked',
		},
		{
			title: 'Walking together under cherry blossoms',
			scene:
				'Two people walking beneath blooming cherry blossom trees, petals falling around them',
			symbolism: 'companionship in fleeting beauty',
		},
		{
			title: 'Plain closed envelope on desk',
			scene:
				'A plain closed envelope on a wooden desk beside a mobile phone, vase of fresh flowers nearby',
			symbolism: 'bridges built across distance',
		},
		{
			title: 'Sharing tea',
			scene:
				'Two people sharing tea at a low table, steam rising between them, comfortable silence in a quiet room',
			symbolism: 'presence as the simplest gift',
		},
		{
			title: 'Caring for pet',
			scene:
				'A child and parent brushing a calm dog on a porch step, fur floating in sunbeams, bowl of water nearby',
			symbolism: 'love practiced through gentle care',
		},
		{
			title: 'Two people watching sunrise',
			scene:
				'Two silhouettes sitting on a hillside bench watching sunrise over a valley, shoulders nearly touching',
			symbolism: 'beginning the day beside someone',
		},
	],
};

export const CLIP_IMAGE_THEMES: Record<string, ImageThemeKey> = {
	'041': 'discipline',
	'042': 'growth',
	'043': 'time',
	'044': 'lost_love',
	'045': 'peace',
	'046': 'resilience',
	'047': 'simple_joys',
	'048': 'connection',
	'049': 'adventure',
	'050': 'loneliness',
};

const parseClipNumber = (clipId: string): number => {
	const parsed = Number.parseInt(clipId, 10);
	return Number.isNaN(parsed) ? 0 : parsed;
};

export function getThemeForClip(clipId: string): ImageThemeKey {
	if (clipId in CLIP_IMAGE_THEMES) {
		return CLIP_IMAGE_THEMES[clipId];
	}

	const clipNumber = parseClipNumber(clipId);
	return THEME_KEYS[clipNumber % THEME_KEYS.length];
};

export function selectSceneForClip(clipId: string): SelectedScene {
	const theme = getThemeForClip(clipId);
	const scenes = IMAGE_THEMES[theme];
	const index = parseClipNumber(clipId) % scenes.length;
	const template = scenes[index];

	return {
		theme,
		sceneTitle: template.title,
		scene: template.scene,
		symbolism: template.symbolism,
	};
}

const WATERCOLOR_STYLE = [
	'Minimalist watercolor anime illustration.',
	'Soft watercolor textures.',
	'Hand-painted illustration.',
	'Elegant paper texture.',
	'Muted cinematic palette.',
	'Atmospheric depth.',
	'Clean minimalist composition.',
	'Premium storybook illustration.',
	'Vertical 9:16.',
].join('\n');

const NO_TEXT_RULES = [
	'ABSOLUTELY NO TEXT.',
	'ABSOLUTELY NO LETTERS.',
	'ABSOLUTELY NO WORDS.',
	'ABSOLUTELY NO WRITING.',
	'ABSOLUTELY NO CALLIGRAPHY.',
	'ABSOLUTELY NO KANJI.',
	'ABSOLUTELY NO CHINESE CHARACTERS.',
	'ABSOLUTELY NO JAPANESE CHARACTERS.',
	'ABSOLUTELY NO SYMBOLS.',
	'ABSOLUTELY NO NUMBERS.',
	'ABSOLUTELY NO SIGNATURES.',
	'ABSOLUTELY NO ARTIST MARKS.',
	'ABSOLUTELY NO SEALS.',
	'ABSOLUTELY NO STAMPS.',
	'ABSOLUTELY NO RED STAMPS.',
	'ABSOLUTELY NO CHOP MARKS.',
	'ABSOLUTELY NO COLLECTOR MARKS.',
	'ABSOLUTELY NO CORNER MARKS.',
	'ABSOLUTELY NO WATERMARKS.',
	'ABSOLUTELY NO ENGLISH SIGNATURE.',
	'ABSOLUTELY NO SMALL HANDWRITTEN NAME.',
	'ABSOLUTELY NO ARTIST NAME.',
	'ABSOLUTELY NO CURSIVE TEXT.',
	'ABSOLUTELY NO SIGNATURE IN ANY CORNER.',
	'ALL FOUR CORNERS MUST BE EMPTY AND CLEAN.',
	'EMPTY CLEAN CORNERS ONLY.',
	'ILLUSTRATION CONTENT ONLY.',
].join('\n');

const CHARACTER_RULES = [
	'Focus on environment, objects, activity, lifestyle, or symbolism.',
	'Do not force a human figure into the scene.',
	'If a person appears, vary clothing, pose, distance, and activity.',
].join('\n');

export const NEGATIVE_IMAGE_PROMPT =
	'text, letters, words, writing, calligraphy, kanji, chinese characters, japanese characters, signature, artist signature, artist mark, artist seal, seal, red seal, corner seal, corner stamp, red corner stamp, stamp, chop mark, collector seal, traditional painting seal, museum seal, ink seal, watermark, logo, caption, subtitle, label, poster text, book title, vertical text, horizontal text, square red stamp, rectangular red stamp, english signature, handwritten signature, cursive signature, artist name, small artist name, corner signature, bottom right signature, bottom left signature, signed artwork, handwritten name, cursive text, low quality, blurry, distorted anatomy, extra limbs, duplicate person';

const getQuoteTextForClip = (clipId: string): string | undefined => {
	const lines = QUOTES[clipId];

	if (!lines || lines.length === 0) {
		return undefined;
	}

	return lines.map((line) => line.text).join(' ');
};

export function buildThemedImagePromptWithMeta(clipId: string): {
	prompt: string;
	theme: ImageThemeKey;
	sceneTitle: string;
	quoteText?: string;
} {
	const {theme, sceneTitle, scene, symbolism} = selectSceneForClip(clipId);
	const mood = THEME_MOODS[theme];
	const colorPalette = THEME_COLOR_PALETTES[theme];
	const visualSymbols = THEME_VISUAL_SYMBOLS[theme];
	const quoteText = getQuoteTextForClip(clipId);

	const promptParts = [
		quoteText
			? `Illustrate the meaning of this quote: "${quoteText}".`
			: undefined,
		`${scene}.`,
		`Symbol of ${symbolism}.`,
		`Recommended visual elements: ${visualSymbols}.`,
		`Color palette: ${colorPalette}.`,
		`Mood: ${mood}`,
		QUOTE_IMAGE_PRINCIPLES,
		CINEMATIC_LIGHTING,
		CHARACTER_RULES,
		WATERCOLOR_STYLE,
		NO_TEXT_RULES,
	].filter((part): part is string => Boolean(part));

	const prompt = promptParts.join('\n');

	return {
		prompt,
		theme,
		sceneTitle,
		quoteText,
	};
}

export function buildThemedImagePrompt(clipId: string): string {
	return buildThemedImagePromptWithMeta(clipId).prompt;
}
