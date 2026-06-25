import type { ContentEngineItem } from "./presets/contentMetadataAdapter";
import {
  adaptContentToVisualSelectionInput,
  selectVisualPresetForContent,
} from "./presets/contentMetadataAdapter";
import type { VisualPresetName } from "./visual-presets";

export type RenderJobSettings = {
  width: number;
  height: number;
  fps: number;
  duration: number;
};

export const DEFAULT_RENDER_SETTINGS: RenderJobSettings = {
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 12,
};

export type RenderJobSpec = {
  id: string;
  topic: string;
  category: string;
  title?: string;
  script?: string[] | string;
  visualPreset: VisualPresetName;
  selectionInput: ReturnType<typeof adaptContentToVisualSelectionInput>;
  render: RenderJobSettings;
};

export type CreateRenderJobSpecInput = {
  id: string;
  content: ContentEngineItem;
  render?: Partial<RenderJobSettings>;
  visualPreset?: VisualPresetName;
};

export function createRenderJobSpec({
  id,
  content,
  render,
  visualPreset,
}: CreateRenderJobSpecInput): RenderJobSpec {
  const selectionInput = adaptContentToVisualSelectionInput(content);

  const resolvedVisualPreset =
    visualPreset ?? selectVisualPresetForContent(content);

  return {
    id,
    topic: content.topic,
    category: content.category,
    title: content.title,
    script: content.script,
    visualPreset: resolvedVisualPreset,
    selectionInput,
    render: {
      ...DEFAULT_RENDER_SETTINGS,
      ...render,
    },
  };
}

export function createRenderJobSpecs(
  items: Array<{
    id: string;
    content: ContentEngineItem;
    render?: Partial<RenderJobSettings>;
    visualPreset?: VisualPresetName;
  }>,
): RenderJobSpec[] {
  return items.map(createRenderJobSpec);
}
