import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { defaultBoard } from "../../lib/board/defaults";
import { courtPng, OG_BACKGROUND, OG_HEIGHT, OG_WIDTH } from "./courtPng";

/** The colour of one pixel as #rrggbb. */
async function pixel(png: Buffer, left: number, top: number): Promise<string> {
  const rgb = await sharp(png).extract({ left, top, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  return `#${[...rgb].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

describe("courtPng", () => {
  it("renders a 1200×630 PNG", async () => {
    const meta = await sharp(await courtPng(defaultBoard, "Default lineup")).metadata();
    expect(meta.format).toBe("png");
    expect([meta.width, meta.height]).toEqual([OG_WIDTH, OG_HEIGHT]);
  });

  it("draws the court in the middle of the background", async () => {
    const png = await courtPng(defaultBoard, "Default lineup");
    expect(await pixel(png, 4, 4)).toBe(OG_BACKGROUND);
    expect(await pixel(png, OG_WIDTH / 2, OG_HEIGHT - 60)).not.toBe(OG_BACKGROUND);
  });
});
