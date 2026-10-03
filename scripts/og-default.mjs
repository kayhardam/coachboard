// Renders public/og-default-<lang>.png (1200×630), the share image for pages
// without their own. One-off: run `node scripts/og-default.mjs nl` after
// editing, then commit the PNG. Text uses local system fonts, so it only runs
// here, not in CI.
//
// The middle 630×630 square stands on its own (brand, court, tagline): chat
// apps crop a share image to that square for small previews. The headline
// sits in the bands either side, which the square crop drops.
//
// public/og-default.png (English) still has the earlier layout, with the
// headline on the left and five defenders; `node scripts/og-default.mjs en`
// would re-render it in this one.
import sharp from "sharp";

const texts = {
  en: {
    file: "og-default.png",
    left: ["Draw", "a play."],
    right: ["Share it", "with your", "team."],
    tagline: "Free tactics board for handball trainers",
  },
  nl: {
    file: "og-default-nl.png",
    left: ["Teken", "een", "aanval."],
    right: ["Deel hem", "met je", "team."],
    tagline: "Gratis tactiekbord voor handbaltrainers",
  },
};

const lang = process.argv[2];
const text = texts[lang];
if (!text) {
  console.error(`Usage: node scripts/og-default.mjs <${Object.keys(texts).join("|")}>`);
  process.exit(1);
}

const navy = "#0f172a";
const green = "#16a34a";
const line = "#cbd5e1";
const muted = "#94a3b8";
const font = `font-family="Helvetica, Arial, sans-serif"`;

// The middle square: x 285–915.
const square = { x: 285, size: 630 };
const centre = square.x + square.size / 2;

// Half court, goal at the top: 20 m wide, 20 m deep, 23 px per metre, centred in the square.
const m = 23;
const x0 = centre - 10 * m;
const y0 = 86;
const px = (metres) => x0 + metres * m;
const py = (metres) => y0 + metres * m;
const postL = px(8.5);
const postR = px(11.5);

// Goal-area-shaped line at `r` metres: arc round each post, straight between.
const area = (r) =>
  `M ${postL - r * m} ${y0} A ${r * m} ${r * m} 0 0 0 ${postL} ${py(r)} ` +
  `L ${postR} ${py(r)} A ${r * m} ${r * m} 0 0 0 ${postR + r * m} ${y0}`;

// A 6-0: six defenders just outside the 6 m line, at 6.8 m from the nearest post.
const depth = 6.8;
const onLine = (xm) => {
  const dx = xm < 8.5 ? 8.5 - xm : xm > 11.5 ? xm - 11.5 : 0;
  return Math.sqrt(depth * depth - dx * dx);
};
const defenders = [2.6, 5.7, 8.1, 11.9, 14.3, 17.4].map((xm) => [xm, onLine(xm)]);
// Three backs, one with the ball.
const attackers = [
  [4, 11],
  [10, 12],
  [16, 11],
];

const player = (xm, ym, fill, stroke = "none") =>
  `<circle cx="${px(xm)}" cy="${py(ym)}" r="14" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;

const headline = (lines, x, anchor) =>
  `<text ${font} font-size="50" font-weight="700" fill="#ffffff" text-anchor="${anchor}">` +
  lines.map((l, i) => `<tspan x="${x}" y="${330 + (i - (lines.length - 1) / 2) * 62}">${l}</tspan>`).join("") +
  `</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <clipPath id="court"><rect x="${x0}" y="${y0}" width="${20 * m}" height="${20 * m}"/></clipPath>
    <marker id="head" viewBox="0 0 10 10" markerWidth="4" markerHeight="4" refX="6" refY="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="${green}"/>
    </marker>
  </defs>
  <rect width="1200" height="630" fill="${navy}"/>

  ${headline(text.left, square.x - 32, "end")}
  ${headline(text.right, square.x + square.size + 32, "start")}

  <text x="${centre}" y="62" fill="${green}" ${font} font-size="26" font-weight="700" letter-spacing="1" text-anchor="middle">HANDBALL COACHBOARD</text>
  <text x="${centre}" y="602" fill="${muted}" ${font} font-size="22" text-anchor="middle">${text.tagline}</text>

  <rect x="${x0}" y="${y0}" width="${20 * m}" height="${20 * m}" rx="6" fill="#1e293b" stroke="${line}" stroke-width="3"/>
  <g clip-path="url(#court)" fill="none" stroke="${line}" stroke-width="3">
    <path d="${area(6)}" fill="#334155"/>
    <path d="${area(9)}" stroke-dasharray="14 12"/>
    <line x1="${px(9.5)}" y1="${py(7)}" x2="${px(10.5)}" y2="${py(7)}"/>
  </g>
  <line x1="${postL}" y1="${y0}" x2="${postR}" y2="${y0}" stroke="#ffffff" stroke-width="8"/>

  <g stroke="${green}" stroke-width="4" fill="none" marker-end="url(#head)">
    <path d="M ${px(4.4)} ${py(10.4)} Q ${px(6.2)} ${py(9.6)} ${px(7.4)} ${py(8.6)}"/>
    <path d="M ${px(9.4)} ${py(11.9)} L ${px(4.8)} ${py(11.1)}" stroke-dasharray="10 8"/>
  </g>

  ${defenders.map(([xm, ym]) => player(xm, ym, navy, "#ffffff")).join("\n  ")}
  ${attackers.map(([xm, ym]) => player(xm, ym, green)).join("\n  ")}
</svg>`;

const out = new URL(`../public/${text.file}`, import.meta.url);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out.pathname);
console.log(`Wrote ${out.pathname}`);
