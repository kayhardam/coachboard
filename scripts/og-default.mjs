// Renders public/og-default-<lang>.png (1200×630), the share image for pages
// without their own: the board page and every shared board (a link's #t= never
// reaches a server, so the preview can't show the board itself). One-off: run
// `node scripts/og-default.mjs nl` after editing, then commit the PNG. Text
// uses local system fonts (Helvetica, or a clone such as TeX Gyre Heros), so
// it runs here, not in CI.
//
// The court is the board's own Court.svelte with the default lineup and a
// pass and a run, rendered through Vite like courtPng() does for the library
// items: the image looks like the board, and follows it when the lineup or
// the court's look changes (re-run the script then).
//
// The middle 630×630 square stands on its own (brand, court, tagline): chat
// apps crop a share image to that square for small previews. The headline
// sits in the bands either side, which the square crop drops.
//
// Both languages have this layout: public/og-default.png (English) and
// public/og-default-nl.png (Dutch).
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sharp from "sharp";
import { createServer } from "vite";

const texts = {
  en: {
    file: "og-default.png",
    left: ["Draw", "a play."],
    right: ["Share it", "with your", "team."],
    tagline: "Tactics board for handball coaches",
    court: "Handball court",
  },
  nl: {
    file: "og-default-nl.png",
    left: ["Teken", "een", "aanval."],
    right: ["Deel hem", "met je", "team."],
    tagline: "Tactiekbord voor handbaltrainers",
    court: "Handbalveld",
  },
};

const lang = process.argv[2];
const text = texts[lang];
if (!text) {
  console.error(`Usage: node scripts/og-default.mjs <${Object.keys(texts).join("|")}>`);
  process.exit(1);
}

const navy = "#0f172a"; // OG_BACKGROUND in src/components/board/courtPng.ts
const green = "#16a34a";
const muted = "#94a3b8";
const font = `font-family="Helvetica, Arial, sans-serif"`;

// The middle square: x 285–915. The court fills it between the brand and the tagline.
const square = { x: 285, size: 630 };
const centre = square.x + square.size / 2;
const courtBox = { x: square.x, y: 80, width: square.size, height: 486 };

/** The default lineup in `lang`, with a pass from the centre back to the left back and the left back's run onto the 9 m line. */
async function court(load) {
  const { render } = await load("svelte/server");
  const { default: Court } = await load("/src/components/board/Court.svelte");
  const { defaultBoardFor } = await load("/src/lib/board/defaults.ts");
  const { addArrow } = await load("/src/lib/board/edit.ts");
  const [LB, CB] = [1, 2];
  let board = defaultBoardFor(lang);
  board = addArrow(board, 0, "pass", [0, 0], board.frames[0].players[LB].at, CB);
  board = addArrow(board, 0, "run", [0, 0], [46, 84], LB);
  if (board.frames[0].arrows.length !== 2) throw new Error("the play didn't draw");
  const svg = render(Court, { props: { board, label: text.court } }).body;
  // A nested <svg> scales its viewBox into the box it gets, centred (as in courtPng()).
  return svg.replace("<svg ", `<svg x="${courtBox.x}" y="${courtBox.y}" width="${courtBox.width}" height="${courtBox.height}" `);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  plugins: [svelte()],
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
let courtSvg;
try {
  courtSvg = await court((id) => server.ssrLoadModule(id));
} finally {
  await server.close();
}

const headline = (lines, x, anchor) =>
  `<text ${font} font-size="50" font-weight="700" fill="#ffffff" text-anchor="${anchor}">` +
  lines.map((l, i) => `<tspan x="${x}" y="${330 + (i - (lines.length - 1) / 2) * 62}">${l}</tspan>`).join("") +
  `</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${navy}"/>

  ${headline(text.left, square.x - 32, "end")}
  ${headline(text.right, square.x + square.size + 32, "start")}

  <text x="${centre}" y="62" fill="${green}" ${font} font-size="26" font-weight="700" letter-spacing="1" text-anchor="middle">HANDBALL COACHBOARD</text>
  <text x="${centre}" y="602" fill="${muted}" ${font} font-size="22" text-anchor="middle">${text.tagline}</text>

  ${courtSvg}
</svg>`;

const out = new URL(`../public/${text.file}`, import.meta.url);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(fileURLToPath(out));
console.log(`Wrote ${fileURLToPath(out)}`);
