import { describe, expect, it } from "vitest";
import { pageText } from "./pages";

const modules = {
  "../../i18n/pages/privacy/en.astro": "English",
  "../../i18n/pages/privacy/nl.astro": "Nederlands",
};

describe("pageText", () => {
  it("picks the text of the page's language", () => {
    expect(pageText(modules, "nl")).toBe("Nederlands");
    expect(pageText(modules, "en")).toBe("English");
  });

  it("fails the build when a language has no text, instead of falling back to English", () => {
    expect(() => pageText(modules, "de")).toThrow('No text for "de" in ../../i18n/pages/privacy/: add de.astro there.');
  });
});
