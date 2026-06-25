import fs from "node:fs";
import path from "node:path";
import type { RemotionRenderCommand } from "../src/effects/render-backend-adapter";
import { executeRemotionRenderCommand } from "../src/effects/remotion-render-backend";

const command: RemotionRenderCommand = {
  jobId: "smoke-001",
  compositionId: "QuoteReel",
  inputProps: {
    visualPreset: "hopeful-dawn",
    topic: "growth",
    category: "motivation",
    title: "Smoke Test",
    script: ["Small steps still count."],
    debugParticles: false,
  },
  outputPath: "renders/smoke-001.mp4",
  render: {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 12,
  },
  format: "mp4",
};

async function main(): Promise<void> {
  console.log("Starting real Remotion smoke render...");
  console.log(`  jobId: ${command.jobId}`);
  console.log(`  compositionId: ${command.compositionId}`);
  console.log(`  outputPath: ${command.outputPath}`);

  const result = await executeRemotionRenderCommand(command, {
    projectRoot: process.cwd(),
  });

  console.log(`status: ${result.status}`);

  if (result.status === "success") {
    console.log(`outputPath: ${result.outputPath}`);
  } else {
    console.log(`error: ${result.error ?? "Unknown render error"}`);
    process.exitCode = 1;
    return;
  }

  const absoluteOutputPath = path.resolve(process.cwd(), command.outputPath);

  if (!fs.existsSync(absoluteOutputPath)) {
    console.error(`Missing render output: ${command.outputPath}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Verified output file: ${absoluteOutputPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Smoke render failed: ${message}`);
  process.exitCode = 1;
});
