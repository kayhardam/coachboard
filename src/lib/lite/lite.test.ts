import { describe, expect, it } from "vitest";
import { LITE_KINDS, LITE_TOOLS, shareUrl } from "./lite";

const KINDS = ["run", "pass", "dribble", "block", "shot", "bounce"] as const;

describe("lite", () => {
  it("offers each tool once", () => {
    expect(new Set(LITE_TOOLS).size).toBe(LITE_TOOLS.length);
    expect(LITE_TOOLS).toContain("arrow");
  });

  it("offers only kinds the link format knows, a shot among them", () => {
    for (const kind of LITE_KINDS) expect(KINDS).toContain(kind);
    expect(LITE_KINDS).toContain("shot");
  });

  it("builds the share URL on the lite viewer, with the link in the fragment", () => {
    expect(shareUrl("https://handballcoachboard.com", "/en/lite/v/", "2.abc-DEF_1")).toBe(
      "https://handballcoachboard.com/en/lite/v/#t=2.abc-DEF_1",
    );
  });
});
