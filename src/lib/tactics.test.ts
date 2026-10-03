import { describe, expect, it } from "vitest";
import { checkTactics, parseId, tacticPath } from "./tactics";

const entry = (id: string, ...related: string[]) => ({ id, related: related.map((r) => ({ id: r })) });

describe("parseId", () => {
  it("splits the language folder from the slug", () => {
    expect(parseId("en/6-0-defense-basics")).toEqual({ lang: "en", slug: "6-0-defense-basics" });
  });

  it("has no language for a file outside a folder", () => {
    expect(parseId("loose")).toEqual({ lang: "", slug: "loose" });
  });
});

describe("tacticPath", () => {
  it("puts the slug right under tactics/, with a trailing slash", () => {
    expect(tacticPath("fast-break")).toBe("tactics/fast-break/");
  });
});

describe("checkTactics", () => {
  const locales = ["en", "nl"];

  it("accepts related tactics in the same language", () => {
    expect(checkTactics([entry("en/a", "en/b"), entry("en/b"), entry("nl/a", "nl/b")], locales)).toEqual([]);
  });

  it("rejects an unknown or missing language folder", () => {
    expect(checkTactics([entry("fr/a"), entry("loose")], locales)).toHaveLength(2);
  });

  it("rejects a slug that isn't kebab-case or sits in a subfolder", () => {
    expect(checkTactics([entry("en/Fast_Break"), entry("en/attack/a")], locales)).toHaveLength(2);
  });

  it("rejects a slug that is a category, whose page has the same URL", () => {
    expect(checkTactics([entry("en/attack"), entry("en/attack-drill")], locales, ["attack"])).toEqual([
      '"en/attack": the file name is a category; tactics/attack/ is the category page',
    ]);
  });

  it("rejects a tactic related to itself", () => {
    expect(checkTactics([entry("en/a", "en/a")], locales)).toEqual(['"en/a": lists itself as related']);
  });

  it("rejects a related tactic in another language", () => {
    expect(checkTactics([entry("en/a", "nl/b"), entry("nl/b")], locales)).toEqual([
      '"en/a": related "nl/b" is in another language',
    ]);
  });
});
