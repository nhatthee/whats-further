import type { RenderJobSpec } from "./render-job-spec";
import type { RenderQueueSpec } from "./render-queue-spec";

export type RenderBackendFormat = "mp4" | "webm";

export type RemotionRenderCommand = {
  jobId: string;
  compositionId: string;
  inputProps: {
    visualPreset: RenderJobSpec["visualPreset"];
    topic: string;
    category: string;
    title?: string;
    script?: RenderJobSpec["script"];
  };
  outputPath: string;
  render: RenderJobSpec["render"];
  format: RenderBackendFormat;
};

export const DEFAULT_COMPOSITION_ID = "QuoteReel";

export const DEFAULT_RENDER_OUTPUT_DIR = "renders";

export const DEFAULT_RENDER_FORMAT: RenderBackendFormat = "mp4";

export function createSafeRenderSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "render";
}

export function createRenderOutputPath({
  outputDir = DEFAULT_RENDER_OUTPUT_DIR,
  jobId,
  format = DEFAULT_RENDER_FORMAT,
}: {
  outputDir?: string;
  jobId: string;
  format?: RenderBackendFormat;
}): string {
  const safeJobId = createSafeRenderSlug(jobId);

  return `${outputDir}/${safeJobId}.${format}`;
}

export function createRenderCommandFromJob(
  job: RenderJobSpec,
  options?: {
    compositionId?: string;
    outputDir?: string;
    format?: RenderBackendFormat;
  },
): RemotionRenderCommand {
  const compositionId =
    options?.compositionId ?? DEFAULT_COMPOSITION_ID;

  const format = options?.format ?? DEFAULT_RENDER_FORMAT;

  return {
    jobId: job.id,
    compositionId,
    inputProps: {
      visualPreset: job.visualPreset,
      topic: job.topic,
      category: job.category,
      title: job.title,
      script: job.script,
    },
    outputPath: createRenderOutputPath({
      outputDir: options?.outputDir,
      jobId: job.id,
      format,
    }),
    render: job.render,
    format,
  };
}

export function createRenderCommandsFromQueue(
  queue: RenderQueueSpec,
  options?: {
    compositionId?: string;
    outputDir?: string;
    format?: RenderBackendFormat;
  },
): RemotionRenderCommand[] {
  return queue.jobs.map((job) =>
    createRenderCommandFromJob(job, options),
  );
}
