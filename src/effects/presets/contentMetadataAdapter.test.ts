import { describe, expect, it } from "vitest";
import {
  adaptContentToVisualSelectionInput,
  explainVisualPresetForContent,
  selectVisualPresetForContent,
} from "./contentMetadataAdapter";

describe("contentMetadataAdapter", () => {
  it("maps motivation content to hopeful mood and hopeful-dawn", () => {
    const item = {
      topic: "growth",
      category: "motivation",
      title: "A new beginning starts today",
      script: ["You can become better one step at a time"],
    };

    const adapted = adaptContentToVisualSelectionInput(item);

    expect(adapted.mood).toBe("hopeful");
    expect(selectVisualPresetForContent(item)).toBe("hopeful-dawn");
  });

  it("maps lost love reflection to lonely preset candidates", () => {
    const item = {
      topic: "lost-love",
      category: "reflection",
      title: "The memory of someone who left",
      script: ["Some distance never fully disappears"],
      mood: "lonely",
    };

    const adapted = adaptContentToVisualSelectionInput(item);

    expect(adapted.mood).toBe("lonely");
    expect(["deep-lonely", "lonely-rain"]).toContain(
      selectVisualPresetForContent(item),
    );
  });

  it("maps discipline mistake content to quiet-discipline", () => {
    const item = {
      topic: "discipline",
      category: "mistake",
      title: "The biggest mistake is waiting for motivation",
      script: ["Patience and focus build progress"],
    };

    const adapted = adaptContentToVisualSelectionInput(item);

    expect(adapted.mood).toBe("discipline");
    expect(adapted.tags).toContain("patience");
    expect(adapted.tags).toContain("focus");
    expect(selectVisualPresetForContent(item)).toBe("quiet-discipline");
  });

  it("keeps explicit mood over category inference", () => {
    const item = {
      topic: "growth",
      category: "fact",
      mood: "cinematic",
    };

    const adapted = adaptContentToVisualSelectionInput(item);

    expect(adapted.mood).toBe("cinematic");
  });

  it("explains visual preset selection for content", () => {
    const explanation = explainVisualPresetForContent({
      topic: "growth",
      category: "motivation",
      title: "A new beginning starts today",
      script: ["You can become better one step at a time"],
    });

    expect(explanation.selected).toBeTruthy();
    expect(explanation.reasons.length).toBeGreaterThan(0);
    expect(explanation.recommendations).toHaveLength(5);
  });
});
