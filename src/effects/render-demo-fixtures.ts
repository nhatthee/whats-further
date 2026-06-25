import type { RenderPipelineApiResponse } from "./render-pipeline-api-contract";
import type { RenderRequest } from "./render-request-contract";
import { runMockRenderService } from "./render-service";

export const demoRenderRequest: RenderRequest = {
  topic: "growth",
  items: [
    {
      id: "clip-001",
      topic: "growth",
      category: "motivation",
      title: "Keep Moving",
      script: ["Small steps still count."],
    },
    {
      id: "clip-002",
      topic: "growth",
      category: "tip",
      title: "Start Small",
      script: ["Start with one action you can repeat."],
    },
  ],
  options: {
    outputDir: "demo-renders",
    format: "mp4",
  },
};

export function createDemoRenderApiResponse(): RenderPipelineApiResponse {
  return runMockRenderService(demoRenderRequest);
}

export const demoRenderApiResponse: RenderPipelineApiResponse =
  createDemoRenderApiResponse();
