import fs from "node:fs";
import path from "node:path";
import type { RemotionRenderCommand } from "../src/effects/render-backend-adapter";
import { createRemotionRenderBackend } from "../src/effects/remotion-render-backend";
import type { VisualPresetName } from "../src/effects/visual-presets";
import { VisualPresets } from "../src/effects/visual-presets";

const PRESETS: VisualPresetName[] = [
  "hopeful-dawn",
  "golden-sunset",
  "lonely-rain",
  "winter-night",
  "cinematic-growth",
];

const OUTPUT_DIR = "renders/showcase";

function createShowcaseCommand(preset: VisualPresetName): RemotionRenderCommand {
  return {
    jobId: `showcase-${preset}`,
    compositionId: "QuoteReel",
    inputProps: {
      visualPreset: preset,
      topic: "showcase",
      category: "visual-test",
      title: VisualPresets[preset].metadata.label,
      script: ["This is a visual preset showcase."],
    },
    outputPath: `${OUTPUT_DIR}/${preset}.mp4`,
    render: {
      width: 1080,
      height: 1920,
      fps: 30,
      duration: 12,
    },
    format: "mp4",
  };
}

async function main(): Promise<void> {
  console.log("Starting preset showcase render...");

  const commands = PRESETS.map(createShowcaseCommand);
  const backend = createRemotionRenderBackend({
    projectRoot: process.cwd(),
  });

  let failed = 0;

  for (const command of commands) {
    const preset = command.inputProps.visualPreset;
    console.log(`\npreset: ${preset}`);

    const result = await backend.executeRenderCommand(command);

    console.log(`status: ${result.status}`);
    console.log(`outputPath: ${result.outputPath ?? command.outputPath}`);

    if (result.status === "failed") {
      console.log(`error: ${result.error ?? "Unknown render error"}`);
      failed++;
      continue;
    }

    const absoluteOutputPath = path.resolve(process.cwd(), command.outputPath);

    if (!fs.existsSync(absoluteOutputPath)) {
      console.error(`error: Missing render output: ${command.outputPath}`);
      failed++;
      continue;
    }

    console.log(`verified: ${absoluteOutputPath}`);
  }

  if (failed > 0) {
    console.error(`\nShowcase render finished with ${failed} failure(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nAll ${PRESETS.length} showcase renders completed successfully.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Preset showcase render failed: ${message}`);
  process.exitCode = 1;
});
