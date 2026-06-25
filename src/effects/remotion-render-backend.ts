import { mkdir } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { RemotionRenderCommand } from "./render-backend-adapter";
import type { RenderExecutionResult } from "./render-backend-executor";
import type { RenderBackend } from "./render-backend-interface";

export const REAL_REMOTION_BACKEND_NOT_IMPLEMENTED =
  "Real Remotion backend is not implemented yet";

const DEFAULT_ENTRY_POINT = "src/index.ts";

export type RemotionRenderBackendDependencies = {
  bundleRemotionProject?: typeof bundle;
  selectComposition?: typeof selectComposition;
  renderMedia?: typeof renderMedia;
};

export type RemotionRenderBackendOptions = RemotionRenderBackendDependencies & {
  entryPoint?: string;
  projectRoot?: string;
  serveUrl?: string;
};

function resolveProjectRoot(projectRoot?: string): string {
  return projectRoot ?? process.cwd();
}

function resolveEntryPoint(
  projectRoot: string,
  entryPoint: string = DEFAULT_ENTRY_POINT,
): string {
  return path.isAbsolute(entryPoint)
    ? entryPoint
    : path.join(projectRoot, entryPoint);
}

function resolveOutputPath(outputPath: string, projectRoot: string): string {
  return path.isAbsolute(outputPath)
    ? outputPath
    : path.join(projectRoot, outputPath);
}

function resolveCodec(format: RemotionRenderCommand["format"]) {
  return format === "webm" ? "vp8" : "h264";
}

async function ensureServeUrl(
  options: RemotionRenderBackendOptions,
): Promise<string> {
  if (options.serveUrl) {
    return options.serveUrl;
  }

  const projectRoot = resolveProjectRoot(options.projectRoot);
  const bundleRemotionProject = options.bundleRemotionProject ?? bundle;

  return bundleRemotionProject({
    entryPoint: resolveEntryPoint(projectRoot, options.entryPoint),
    publicDir: path.join(projectRoot, "assets"),
  });
}

export async function executeRemotionRenderCommand(
  command: RemotionRenderCommand,
  options: RemotionRenderBackendOptions = {},
): Promise<RenderExecutionResult> {
  const startedAt = new Date().toISOString();
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const selectCompositionFn = options.selectComposition ?? selectComposition;
  const renderMediaFn = options.renderMedia ?? renderMedia;

  try {
    const serveUrl = await ensureServeUrl(options);
    const composition = await selectCompositionFn({
      serveUrl,
      id: command.compositionId,
      inputProps: command.inputProps,
    });

    const outputLocation = resolveOutputPath(command.outputPath, projectRoot);
    await mkdir(path.dirname(outputLocation), { recursive: true });

    const compositionForRender = {
      ...composition,
      width: command.render.width,
      height: command.render.height,
      fps: command.render.fps,
      durationInFrames: Math.max(
        1,
        Math.round(command.render.duration * command.render.fps),
      ),
    };

    await renderMediaFn({
      serveUrl,
      composition: compositionForRender,
      inputProps: command.inputProps,
      codec: resolveCodec(command.format),
      outputLocation,
      overwrite: true,
      crf: 28,
    });

    return {
      jobId: command.jobId,
      status: "success",
      outputPath: command.outputPath,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      jobId: command.jobId,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }
}

export function createRemotionRenderBackend(
  options: RemotionRenderBackendOptions = {},
): RenderBackend {
  let cachedServeUrl = options.serveUrl;

  const getServeUrl = async (): Promise<string> => {
    if (cachedServeUrl) {
      return cachedServeUrl;
    }

    cachedServeUrl = await ensureServeUrl(options);
    return cachedServeUrl;
  };

  return {
    name: "remotion",
    async executeRenderCommand(command) {
      const serveUrl = await getServeUrl();
      return executeRemotionRenderCommand(command, {
        ...options,
        serveUrl,
      });
    },
    async executeRenderCommands(commands) {
      const serveUrl = await getServeUrl();
      const results: RenderExecutionResult[] = [];

      for (const command of commands) {
        results.push(
          await executeRemotionRenderCommand(command, {
            ...options,
            serveUrl,
          }),
        );
      }

      return results;
    },
  };
}
