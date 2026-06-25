import type { VisualPresetName } from "../visual-presets";
import type {
  VisualSelectionInput,
  VisualSelectionWeights,
} from "./selectVisualPreset";
import {
  explainVisualPresetSelection,
  getVisualSelectionWeights,
  selectVisualPreset,
} from "./selectVisualPreset";

export type ContentCategory =
  | "myth"
  | "tip"
  | "fact"
  | "mistake"
  | "motivation"
  | "cta"
  | "reflection"
  | "story";

export type ContentMood =
  | "peaceful"
  | "hopeful"
  | "lonely"
  | "nostalgic"
  | "cinematic"
  | "discipline"
  | "growth"
  | string;

export type ContentEngineItem = {
  topic: string;
  category: ContentCategory | string;
  title?: string;
  script?: string[] | string;
  mood?: ContentMood;
  emotion?: string;
  tags?: string[];
};

function normalizeText(value?: string | string[]): string {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(" ").toLowerCase();
  }

  return value.toLowerCase();
}

function unique(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function inferMoodFromCategory(
  category?: string,
): string | undefined {
  const normalized = category?.trim().toLowerCase();

  switch (normalized) {
    case "motivation":
      return "hopeful";
    case "reflection":
    case "story":
      return "nostalgic";
    case "fact":
    case "tip":
      return "peaceful";
    case "mistake":
    case "myth":
      return "discipline";
    case "cta":
      return "cinematic";
    default:
      return undefined;
  }
}

export function getWeightsForCategory(
  category?: string,
): VisualSelectionWeights | undefined {
  const normalized = category?.trim().toLowerCase();

  switch (normalized) {
    case "motivation":
      return getVisualSelectionWeights("motivation");
    case "fact":
    case "tip":
      return getVisualSelectionWeights("facts");
    case "reflection":
    case "story":
      return getVisualSelectionWeights("lost-love");
    case "mistake":
    case "myth":
      return getVisualSelectionWeights("discipline");
    default:
      return undefined;
  }
}

export function inferEmotionFromContent(
  item: ContentEngineItem,
): string | undefined {
  if (item.emotion) {
    return item.emotion;
  }

  const text = normalizeText([
    item.title ?? "",
    ...(Array.isArray(item.script) ? item.script : [item.script ?? ""]),
  ]);

  if (
    text.includes("heartbreak") ||
    text.includes("lost love") ||
    text.includes("lonely")
  ) {
    return "sadness";
  }

  if (
    text.includes("growth") ||
    text.includes("improve") ||
    text.includes("become")
  ) {
    return "new-beginning";
  }

  if (
    text.includes("discipline") ||
    text.includes("focus") ||
    text.includes("patience")
  ) {
    return "discipline";
  }

  return undefined;
}

export function inferTagsFromContent(
  item: ContentEngineItem,
): string[] {
  const baseTags = item.tags ?? [];

  const tags = [
    item.topic,
    item.category,
    ...baseTags,
  ];

  const text = normalizeText([
    item.title ?? "",
    ...(Array.isArray(item.script) ? item.script : [item.script ?? ""]),
  ]);

  if (text.includes("discipline")) {
    tags.push("discipline");
  }

  if (text.includes("focus")) {
    tags.push("focus");
  }

  if (text.includes("patience")) {
    tags.push("patience");
  }

  if (text.includes("growth")) {
    tags.push("growth");
  }

  if (text.includes("motivation")) {
    tags.push("motivation");
  }

  if (text.includes("lonely")) {
    tags.push("loneliness");
  }

  if (text.includes("memory")) {
    tags.push("memory");
  }

  if (text.includes("resilience")) {
    tags.push("resilience");
  }

  return unique(tags);
}

export function adaptContentToVisualSelectionInput(
  item: ContentEngineItem,
): VisualSelectionInput {
  const inferredMood = item.mood ?? inferMoodFromCategory(item.category);
  const inferredEmotion = inferEmotionFromContent(item);
  const tags = inferTagsFromContent(item);
  const weights = getWeightsForCategory(item.category);

  return {
    topic: item.topic,
    category: item.category,
    mood: inferredMood,
    emotion: inferredEmotion,
    tags,
    weights,
  };
}

export function selectVisualPresetForContent(
  item: ContentEngineItem,
): VisualPresetName {
  return selectVisualPreset(adaptContentToVisualSelectionInput(item));
}

export function explainVisualPresetForContent(
  item: ContentEngineItem,
) {
  return explainVisualPresetSelection(
    adaptContentToVisualSelectionInput(item),
  );
}
