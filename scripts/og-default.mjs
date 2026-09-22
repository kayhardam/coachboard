// Renders public/og-default.png (1200×630), the share image for pages without
// their own. One-off: run `node scripts/og-default.mjs` after editing, then
// commit the PNG. Text uses local system fonts, so it only runs here, not in CI.
import sharp from "sharp";

const navy = "#0f172a";
const green = "#16a34a";
const line = "#cbd5e1";
const muted = "#94a3b8";

// Half court, goal at the top: 20 m wide, 20 m deep, 25 px per metre.
const m = 25;
const x0 = 640;
const y0 = 65;
const px = (metres) => x0 + metres * m;
const py = (metres) => y0 + metres * m;
const postL = px(8.5);
const postR = px(11.5);

// Goal-area-shaped line at `r` metres: arc round each post, straight between.
const area = (r) =>
  `M ${postL - r * m} ${y0} A ${r * m} ${r * m} 0 0 0 ${postL} ${py(r)} ` +
  `L ${postR} ${py(r)} A ${r * m} ${r * m} 0 0 0 ${postR + r * m} ${y0}`;

const player = (xm, ym, fill, stroke = "none") =>
  `<circle cx="${px(xm)}" cy="${py(ym)}" r="15" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <clipPath id="court"><rect x="${x0}" y="${y0}" width="${20 * m}" height="${20 * m}"/></clipPath>
    <marker id="head" viewBox="0 0 10 10" markerWidth="4" markerHeight="4" refX="6" refY="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="${green}"/>
    </marker>
  </defs>
  <rect width="1200" height="630" fill="${navy}"/>

  <text x="72" y="170" fill="${green}" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="1">HANDBALL COACHBOARD</text>
  <text font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff">
    <tspan x="72" y="275">Draw a play.</tspan>
    <tspan x="72" y="355">Share it with</tspan>
    <tspan x="72" y="435">your team.</tspan>
  </text>
  <text x="72" y="515" fill="${muted}" font-family="Helvetica, Arial, sans-serif" font-size="30">Free tactics board for handball trainers</text>

  <rect x="${x0}" y="${y0}" width="${20 * m}" height="${20 * m}" rx="6" fill="#1e293b" stroke="${line}" stroke-width="3"/>
  <g clip-path="url(#court)" fill="none" stroke="${line}" stroke-width="3">
    <path d="${area(6)}" fill="#334155"/>
    <path d="${area(9)}" stroke-dasharray="14 12"/>
    <line x1="${px(9.5)}" y1="${py(7)}" x2="${px(10.5)}" y2="${py(7)}"/>
  </g>
  <line x1="${postL}" y1="${y0}" x2="${postR}" y2="${y0}" stroke="#ffffff" stroke-width="8"/>

  <g stroke="${green}" stroke-width="4" fill="none" marker-end="url(#head)">
    <path d="M ${px(4)} ${py(10.4)} Q ${px(6)} ${py(9.3)} ${px(7.8)} ${py(8.2)}"/>
    <path d="M ${px(10)} ${py(11)} L ${px(4.6)} ${py(10.5)}" stroke-dasharray="10 8"/>
  </g>

  ${player(3.5, 7, navy, "#ffffff")}
  ${player(7, 7.2, navy, "#ffffff")}
  ${player(10, 6.7, navy, "#ffffff")}
  ${player(13, 7.2, navy, "#ffffff")}
  ${player(16.5, 7, navy, "#ffffff")}
  ${player(3.5, 10.8, green)}
  ${player(10, 11.4, green)}
  ${player(16.5, 10.8, green)}
</svg>`;

const out = new URL("../public/og-default.png", import.meta.url);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out.pathname);
console.log(`Wrote ${out.pathname}`);
