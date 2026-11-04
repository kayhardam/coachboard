// Renders a language's two share images (1200×630 PNG), white, with a large
// court in the middle square and two sentences in the bands either side:
// - public/og-default-<lang>.png, for pages without their own: the board page
//   and every content page except a library item (which has its own og.png);
// - public/og-viewer-<lang>.png, for the pages a shared board opens on
//   (/board/link/ and /board/qr/), with a Play button under the lineup. A
//   link's #t= never reaches a server, so the preview can't show the board itself.
// English has no suffix: public/og-default.png and public/og-viewer.png.
//
// One-off: run `node scripts/og-default.mjs nl` (and `en`) after editing, then
// commit the PNGs. Text uses local system fonts (Helvetica, or a clone such as
// TeX Gyre Heros), so it runs here, not in CI.
//
// The court is the board's own Court.svelte with the default lineup and a
// pass and a run, rendered through Vite like courtPng() does for the library
// items: the image looks like the board, and follows it when the lineup or
// the court's look changes (re-run the script then). Its viewBox is cut off
// below the lineup, and the bottom of the court fades into the white; the
// script fails when a player, ball or arrow lands in that fade.
//
// The middle 630×630 square shows the court (and Play): chat apps crop a share
// image to that square for small previews. The sentences sit in the bands
// either side, which the square crop drops.
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sharp from "sharp";
import { createServer } from "vite";

const texts = {
  en: {
    suffix: "",
    court: "Handball court",
    default: { left: ["Draw", "a play."], right: ["Share it", "with your", "team."] },
    viewer: { left: ["Watch it", "unfold."], right: ["Step by", "step."] },
  },
  nl: {
    suffix: "-nl",
    court: "Handbalveld",
    default: { left: ["Teken", "een", "aanval."], right: ["Deel hem", "met je", "team."] },
    viewer: { left: ["Bekijk", "hoe het", "loopt."], right: ["Stap voor", "stap."] },
  },
};

const lang = process.argv[2];
const text = texts[lang];
if (!text) {
  console.error(`Usage: node scripts/og-default.mjs <${Object.keys(texts).join("|")}>`);
  process.exit(1);
}

const WIDTH = 1200;
const HEIGHT = 630;
const white = "#ffffff"; // OG_BACKGROUND in src/components/board/courtPng.ts
const ink = "#0f172a";
const green = "#15803d"; // the attack's colour on the court, --color-accent-dark
const font = `font-family="Helvetica, Arial, sans-serif" font-weight="700"`;

/**
 * The two layouts. The court's viewBox is cut off at `bottom` dm from the goal
 * line; the whole viewBox (216 units, with the margin of 8 either side) is the
 * middle square's 630 px wide, from x 285, with its top at `top`. The bottom
 * `fade` px of it fade into the white.
 */
const layouts = {
  default: { file: `og-default${text.suffix}.png`, bottom: 164, top: 50, fade: 56, play: false },
  viewer: { file: `og-viewer${text.suffix}.png`, bottom: 178, top: 40, fade: 70, play: true },
};
const VIEW_X = -8;
const VIEW_Y = -14;
const VIEW_WIDTH = 216;
const square = { x: 285, size: 630 };
const scale = square.size / VIEW_WIDTH;

/** The sentences: 50 px bold, 62 px apart, the middle of the baselines 18 px below court y 70. */
const SENTENCE = { size: 50, leading: 62, y: 70, below: 18, left: 261, right: 939 };
/** The logo top left: the brand mark (public/favicon.svg), and "Coachboard" beside it. */
const LOGO = { x: 40, y: 38, size: 36, gap: 10, text: 24 };
/** Play, centred under the lineup. Its triangle and text are white. */
const PLAY = { below: 18, height: 58, pad: 26, gap: 12, triangle: 20, text: 28 };

/** The default lineup in `lang`, with a pass from the centre back to the left back and the left back's run onto the 9 m line. */
async function play(load) {
  const { render } = await load("svelte/server");
  const { default: Court } = await load("/src/components/board/Court.svelte");
  const { defaultBoardFor } = await load("/src/lib/board/defaults.ts");
  const { addArrow } = await load("/src/lib/board/edit.ts");
  const { PLAYER_R, BALL_R } = await load("/src/lib/board/geometry.ts");
  const { t } = await load("/src/i18n/ui.ts");
  const [LB, CB] = [1, 2];
  let board = defaultBoardFor(lang);
  board = addArrow(board, 0, "pass", [0, 0], board.frames[0].players[LB].at, CB);
  board = addArrow(board, 0, "run", [0, 0], [46, 84], LB);
  if (board.frames[0].arrows.length !== 2) throw new Error("the play didn't draw");
  const svg = render(Court, { props: { board, label: text.court } }).body;
  return { board, svg, PLAYER_R, BALL_R, playLabel: t(lang, "board.play") };
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
let court;
try {
  court = await play((id) => server.ssrLoadModule(id));
} finally {
  await server.close();
}
const frame = court.board.frames[0];

/** Where text actually inks, measured: rendered on its own on white and trimmed, as the examples were made. */
async function measure(content, size) {
  const at = 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${size * 3}">
    <rect width="100%" height="100%" fill="${white}"/>
    <text x="${at}" y="${size * 2}" ${font} font-size="${size}" fill="${ink}">${content}</text>
  </svg>`;
  const { info } = await sharp(Buffer.from(svg)).trim({ background: white }).toBuffer({ resolveWithObject: true });
  // trimOffsetLeft and trimOffsetTop are negative: how far the ink starts from the edges.
  return { left: -info.trimOffsetLeft - at, width: info.width, top: -info.trimOffsetTop - size * 2, height: info.height };
}
/** Cap height, to centre a line of text on a point: the ink of "H" above its baseline. */
const capHeight = async (size) => -(await measure("H", size)).top;

const px = (layout, [x, y]) => [square.x + (x - VIEW_X) * scale, layout.top + (y - VIEW_Y) * scale];

/** The court, cut off at `bottom`, in its box. A nested <svg> scales its viewBox into the box it gets. */
function courtSvg(layout) {
  const height = layout.bottom - VIEW_Y;
  const box = `x="${square.x}" y="${layout.top}" width="${square.size}" height="${height * scale}"`;
  const svg = court.svg.replace(/viewBox="[^"]*"/, `viewBox="${VIEW_X} ${VIEW_Y} ${VIEW_WIDTH} ${height}" ${box}`);
  if (svg === court.svg) throw new Error("Court.svelte drew no viewBox");
  return svg;
}

/** The fade at the bottom of the court box: transparent to white, 8 px wider than the court lines either side. */
function fade(layout) {
  const end = layout.top + (layout.bottom - VIEW_Y) * scale;
  const start = end - layout.fade;
  const [left] = px(layout, [0, 0]);
  const [right] = px(layout, [200, 0]);
  // Nothing of the play may fade: each player, ball and arrow ends above it.
  const lowest = Math.max(
    ...frame.players.map((p) => p.at[1] + court.PLAYER_R),
    ...frame.balls.map((b) => b[1] + court.BALL_R),
    ...frame.arrows.flatMap((a) => a.pts.map((p) => p[1])),
  );
  if (px(layout, [0, lowest])[1] > start) throw new Error(`${layout.file}: the play reaches into the fade`);
  return `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${white}" stop-opacity="0"/><stop offset="1" stop-color="${white}"/>
    </linearGradient></defs>
    <rect x="${left - 8}" y="${start}" width="${right - left + 16}" height="${layout.fade}" fill="url(#fade)"/>`;
}

/** A sentence in the band left (right-aligned) or right (left-aligned) of the square, as one block centred on court y 70 plus 18 px. */
async function sentence(layout, lines, side) {
  const middle = px(layout, [0, SENTENCE.y])[1] + SENTENCE.below;
  const x = side === "left" ? SENTENCE.left : SENTENCE.right;
  for (const line of lines) {
    const { left, width } = await measure(line, SENTENCE.size);
    const [from, to] = side === "left" ? [x - width, x] : [x + left, x + left + width];
    if (from < 16 || to > WIDTH - 16) throw new Error(`${layout.file}: "${line}" doesn't fit in its band`);
  }
  return (
    `<text ${font} font-size="${SENTENCE.size}" fill="${ink}" text-anchor="${side === "left" ? "end" : "start"}">` +
    lines.map((l, i) => `<tspan x="${x}" y="${middle + (i - (lines.length - 1) / 2) * SENTENCE.leading}">${l}</tspan>`).join("") +
    `</text>`
  );
}

/** The brand mark from public/favicon.svg, with "Coachboard" beside it, centred on the mark. */
async function logo() {
  const mark = `<svg x="${LOGO.x}" y="${LOGO.y}" width="${LOGO.size}" height="${LOGO.size}" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="7" fill="#16a34a"/>
    <path d="M5 3h14v18H5zM9 3v3h6V3" transform="translate(4 4)" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  const { left } = await measure("Coachboard", LOGO.text);
  const baseline = LOGO.y + LOGO.size / 2 + (await capHeight(LOGO.text)) / 2;
  const x = LOGO.x + LOGO.size + LOGO.gap - left;
  return `${mark}<text x="${x}" y="${baseline}" ${font} font-size="${LOGO.text}" fill="${ink}">Coachboard</text>`;
}

/** Play: a green pill 18 px under the lowest piece of the lineup, centred, with a white triangle and the label of board.play. */
async function playButton(layout) {
  const lowest = Math.max(
    ...frame.players.map((p) => p.at[1] + court.PLAYER_R),
    ...frame.balls.map((b) => b[1] + court.BALL_R),
  );
  const top = px(layout, [0, lowest])[1] + PLAY.below;
  const label = await measure(court.playLabel, PLAY.text);
  const triangleWidth = (PLAY.triangle * Math.sqrt(3)) / 2;
  const width = PLAY.pad + triangleWidth + PLAY.gap + label.width + PLAY.pad;
  const x = WIDTH / 2 - width / 2;
  const middle = top + PLAY.height / 2;
  const tx = x + PLAY.pad;
  const textX = tx + triangleWidth + PLAY.gap - label.left;
  const baseline = middle + (await capHeight(PLAY.text)) / 2;
  return `<rect x="${x}" y="${top}" width="${width}" height="${PLAY.height}" rx="${PLAY.height / 2}" fill="${green}"/>
    <path d="M${tx} ${middle - PLAY.triangle / 2}L${tx + triangleWidth} ${middle}L${tx} ${middle + PLAY.triangle / 2}z" fill="${white}"/>
    <text x="${textX}" y="${baseline}" ${font} font-size="${PLAY.text}" fill="${white}">${court.playLabel}</text>`;
}

for (const [name, layout] of Object.entries(layouts)) {
  const words = text[name];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${white}"/>
  ${await logo()}
  ${await sentence(layout, words.left, "left")}
  ${await sentence(layout, words.right, "right")}
  ${courtSvg(layout)}
  ${fade(layout)}
  ${layout.play ? await playButton(layout) : ""}
</svg>`;
  const out = fileURLToPath(new URL(`../public/${layout.file}`, import.meta.url));
  // A palette keeps each well under the PNG budget (scripts/check-budget.mjs).
  await sharp(Buffer.from(svg)).png({ palette: true, compressionLevel: 9 }).toFile(out);
  console.log(`Wrote ${out}`);
}
