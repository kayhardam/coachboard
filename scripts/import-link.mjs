// A shared Coachboard link as a library item's drawing:
//   npm run import-link -- "<link>"
// Prints the `board:` block (without a title, as the items write it), then
// the title and the sentence of each step apart, the "<number> meter" that
// got a no-break space, and the errors and warnings per step in Dutch, to
// pass on to whoever drew it. Exits with 1 on an error. Never changes the
// drawing. The work is importLink() in src/lib/importLink.ts, loaded through
// Vite like scripts/og-default.mjs, so it reads the link with the board's own
// decode().
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const input = process.argv.slice(2).join(" ");
if (!input.trim()) {
  console.error('Usage: npm run import-link -- "<link>"');
  process.exit(1);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
let result;
try {
  const { importLink } = await server.ssrLoadModule("/src/lib/importLink.ts");
  result = await importLink(input);
} finally {
  await server.close();
}

const { yaml, title, texts, meters, errors, warnings } = result;
if (yaml) {
  console.log(yaml);
  console.log("\nTitel:");
  console.log(`  ${title || "(geen)"}`);
  console.log("\nZinnen:");
  texts.forEach((text, i) => console.log(`  ${i + 1}. ${text || "(geen)"}`));
  if (meters.length) {
    console.log("\nHarde spatie gezet (checkMeters):");
    for (const m of meters) console.log(`  ${m.replace(" ", " ")}`);
  }
}
console.log(`\nFouten: ${errors.length ? "" : "geen"}`);
for (const e of errors) console.log(`  - ${e}`);
if (yaml) {
  console.log(`\nWaarschuwingen: ${warnings.length ? "" : "geen"}`);
  for (const w of warnings) console.log(`  - ${w}`);
}
process.exit(errors.length ? 1 : 0);
