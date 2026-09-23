// A board as a 1200×630 PNG share image (og:image): the diagram centred on
// navy, like public/og-default.png. Build time only. The only text is the
// player labels; without a font they drop out, the image still renders.
import sharp from "sharp";
import { render } from "svelte/server";
import type { Board } from "../../lib/board/format";
import Court from "./Court.svelte";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_BACKGROUND = "#0f172a";
const PAD = 32;

export async function courtPng(board: Board, label: string): Promise<Buffer> {
  const court = render(Court, { props: { board, label } }).body;
  // A nested <svg> scales its viewBox into the box it gets, centred.
  const box = `<svg x="0" y="${PAD}" width="${OG_WIDTH}" height="${OG_HEIGHT - 2 * PAD}" `;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">` +
    `<rect width="100%" height="100%" fill="${OG_BACKGROUND}"/>` +
    court.replace("<svg ", box) +
    `</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
