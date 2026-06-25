import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { RemotionRenderCommand } from "./render-backend-adapter";
import type { RenderBackend } from "./render-backend-interface";
import {
  createRemotionRenderBackend,
  executeRemotionRenderCommand,
} from "./remotion-render-backend";

const sampleCommand = (
  jobId: string,
): RemotionRenderCommand => ({
  jobId,
  compositionId: "QuoteReel",
  inputProps: {
    visualPreset: "hopeful-dawn",
    topic: "growth",
    category: "motivation",
    title: "A new beginning starts today",
    script: ["You can become better one step at a time"],
  },
  outputPath: `renders/${jobId}.mp4`,
  render: {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 12,
  },
  format: "mp4",
});

const sampleComposition = {
  id: "QuoteReel",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 360,
  defaultProps: {},
  props: {},
  defaultCodec: "h264" as const,
  defaultOutName: "out.mp4",
  defaultVideoImageFormat: "jpeg" as const,
  defaultPixelFormat: "yuv420p" as const,
  defaultProResProfile: undefined,
};

function createTestProjectRoot(): string {
  return mkdtempSync(path.join(tmpdir(), "remotion-backend-test-"));
}

function createMockDependencies() {
  return {
    bundleRemotionProject: vi.fn().mockResolvedValue("/tmp/remotion-serve-url"),
    selectComposition: vi.fn().mockResolvedValue(sampleComposition),
    renderMedia: vi.fn().mockResolvedValue({
      buffer: null,
      slowestFrames: [],
      contentType: "video/mp4",
    }),
  };
}

describe("remotion-render-backend", () => {
  it('createRemotionRenderBackend returns name "remotion"', () => {
    const backend = createRemotionRenderBackend();

    expect(backend.name).toBe("remotion");
  });

  it("matches the RenderBackend shape", () => {
    const backend: RenderBackend = createRemotionRenderBackend();

    expect(backend.name).toBe("remotion");
    expect(typeof backend.executeRenderCommand).toBe("function");
    expect(typeof backend.executeRenderCommands).toBe("function");
  });

  it("executeRemotionRenderCommand returns success with mocked renderMedia", async () => {
    const deps = createMockDependencies();
    const projectRoot = createTestProjectRoot();
    const command = sampleCommand("clip-001");

    const result = await executeRemotionRenderCommand(command, {
      ...deps,
      projectRoot,
      serveUrl: "/tmp/remotion-serve-url",
    });

    expect(result.status).toBe("success");
    expect(result.jobId).toBe("clip-001");
    expect(result.outputPath).toBe("renders/clip-001.mp4");
    expect(result.error).toBeUndefined();
    expect(result.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(deps.selectComposition).toHaveBeenCalledWith({
      serveUrl: "/tmp/remotion-serve-url",
      id: "QuoteReel",
      inputProps: command.inputProps,
    });
    expect(deps.renderMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        serveUrl: "/tmp/remotion-serve-url",
        inputProps: command.inputProps,
        codec: "h264",
        outputLocation: path.join(projectRoot, "renders/clip-001.mp4"),
        overwrite: true,
        crf: 28,
        composition: expect.objectContaining({
          width: 1080,
          height: 1920,
          fps: 30,
          durationInFrames: 360,
        }),
      }),
    );
    expect(deps.bundleRemotionProject).not.toHaveBeenCalled();
  });

  it("executeRemotionRenderCommand returns failed when renderMedia throws", async () => {
    const deps = createMockDependencies();
    deps.renderMedia.mockRejectedValue(new Error("Encoder unavailable"));

    const result = await executeRemotionRenderCommand(sampleCommand("clip-002"), {
      ...deps,
      serveUrl: "/tmp/remotion-serve-url",
    });

    expect(result.status).toBe("failed");
    expect(result.jobId).toBe("clip-002");
    expect(result.error).toBe("Encoder unavailable");
    expect(result.outputPath).toBeUndefined();
  });

  it("backend executeRenderCommand uses injected Remotion dependencies", async () => {
    const deps = createMockDependencies();
    const backend = createRemotionRenderBackend({
      ...deps,
      projectRoot: createTestProjectRoot(),
      serveUrl: "/tmp/remotion-serve-url",
    });
    const command = sampleCommand("clip-003");

    const result = await backend.executeRenderCommand(command);

    expect(result.status).toBe("success");
    expect(deps.renderMedia).toHaveBeenCalledTimes(1);
    expect(deps.bundleRemotionProject).not.toHaveBeenCalled();
  });

  it("executeRenderCommands renders commands sequentially without batching", async () => {
    const deps = createMockDependencies();
    const backend = createRemotionRenderBackend({
      ...deps,
      projectRoot: createTestProjectRoot(),
      serveUrl: "/tmp/remotion-serve-url",
    });
    const commands = [
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
    ];

    const results = await backend.executeRenderCommands(commands);

    expect(results.map((result) => result.jobId)).toEqual([
      "clip-001",
      "clip-002",
    ]);
    expect(results.every((result) => result.status === "success")).toBe(true);
    expect(deps.renderMedia).toHaveBeenCalledTimes(2);
    expect(deps.bundleRemotionProject).not.toHaveBeenCalled();
  });

  it("bundles once and reuses serveUrl across commands", async () => {
    const deps = createMockDependencies();
    const backend = createRemotionRenderBackend({
      ...deps,
      projectRoot: createTestProjectRoot(),
    });

    await backend.executeRenderCommands([
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
    ]);

    expect(deps.bundleRemotionProject).toHaveBeenCalledTimes(1);
    expect(deps.renderMedia).toHaveBeenCalledTimes(2);
    expect(deps.renderMedia.mock.calls[0]?.[0]).toMatchObject({
      serveUrl: "/tmp/remotion-serve-url",
    });
    expect(deps.renderMedia.mock.calls[1]?.[0]).toMatchObject({
      serveUrl: "/tmp/remotion-serve-url",
    });
  });

  it("does not mutate commands", async () => {
    const deps = createMockDependencies();
    const backend = createRemotionRenderBackend({
      ...deps,
      projectRoot: createTestProjectRoot(),
      serveUrl: "/tmp/remotion-serve-url",
    });
    const commands = [
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
    ];
    const originalCommands = structuredClone(commands);

    await backend.executeRenderCommands(commands);

    expect(commands).toEqual(originalCommands);
  });
});
