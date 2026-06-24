import fs from "fs";

const clipId = process.argv[2];

if (!clipId) {
  throw new Error("Usage: npx tsx scripts/build-word-subtitles.ts 001");
}

const inputPath = `assets/subtitles/${clipId}.json`;
const outputPath = `assets/subtitles/${clipId}-words.json`;

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const words = raw.transcription.flatMap((segment: any) => {
  const start = segment.offsets.from / 1000;
  const end = segment.offsets.to / 1000;

  const cleanWords = segment.text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const duration = end - start;
  const wordDuration = duration / cleanWords.length;

  return cleanWords.map((word: string, index: number) => ({
    text: word,
    start: start + index * wordDuration,
    end: start + (index + 1) * wordDuration,
  }));
});

fs.writeFileSync(outputPath, JSON.stringify(words, null, 2));

console.log(`Created ${outputPath}`);