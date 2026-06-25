import fs from "node:fs";
import path from "node:path";
import { demoRenderRequest } from "../src/effects/render-demo-fixtures";
import { runRenderPipeline } from "../src/effects/render-pipeline-orchestrator";
import { createRenderPipelineReport } from "../src/effects/render-pipeline-report";
import { createRenderQueueFromRequest } from "../src/effects/render-request-contract";
import { createRemotionRenderBackend } from "../src/effects/remotion-render-backend";

const outputDir = "renders/batch";

async function main(): Promise<void> {
  console.log("Starting real batch render...");

  const queue = createRenderQueueFromRequest({
    ...demoRenderRequest,
    options: {
      outputDir,
      format: "mp4",
    },
  });

  const backend = createRemotionRenderBackend({
    projectRoot: process.cwd(),
  });

  const pipelineResult = await runRenderPipeline(queue, backend, {
    outputDir,
    format: "mp4",
  });

  const report = createRenderPipelineReport(pipelineResult);

  console.log(`queueId: ${report.queueId}`);
  console.log(`status: ${report.status}`);
  console.log(`totalJobs: ${report.totalJobs}`);
  console.log(`completedJobs: ${report.completedJobs}`);
  console.log(`failedJobs: ${report.failedJobs}`);
  console.log(`successRate: ${report.successRate}`);
  console.log("outputs:", report.outputs);
  console.log("errors:", report.errors);

  if (report.failedJobs > 0) {
    process.exitCode = 1;
    return;
  }

  for (const output of report.outputs) {
    const absoluteOutputPath = path.resolve(process.cwd(), output.outputPath);

    if (!fs.existsSync(absoluteOutputPath)) {
      console.error(`Missing render output: ${output.outputPath}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Verified output file: ${absoluteOutputPath}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Batch render failed: ${message}`);
  process.exitCode = 1;
});
