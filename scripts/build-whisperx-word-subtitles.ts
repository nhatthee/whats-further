import fs from "fs";

const clipId = process.argv[2];

if (!clipId) {
  throw new Error(
    "Usage: npx tsx scripts/build-whisperx-word-subtitles.ts 005",
  );
}

const inputPath = `assets/subtitles/whisperx/${clipId}-voice.json`;
const outputPath = `assets/subtitles/${clipId}-words.json`;

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const words = raw.word_segments.map(
  (segment: { word: string; start: number; end: number }) => ({
    text: segment.word,
    start: segment.start,
    end: segment.end,
  }),
);

fs.writeFileSync(outputPath, JSON.stringify(words, null, 2));

console.log(
  `Created ${outputPath} from WhisperX word_segments`,
);
