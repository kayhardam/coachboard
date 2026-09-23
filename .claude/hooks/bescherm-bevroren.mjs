#!/usr/bin/env node
// PreToolUse-hook: blokkeert Edit/Write op bevroren bestanden (linkformaat v1).
// Oude links moeten voor altijd werken; deze bestanden mogen daarom niet veranderen.
//
// Vul BEVROREN tijdens de setup met repo-relatieve paden.
// Een pad dat eindigt op "/" beschermt de hele map (ook nieuwe bestanden erin).
// Er wordt op het einde van het pad gematcht, zodat het ook in worktrees werkt.

import { readFileSync } from 'node:fs';

const BEVROREN = [
  'src/lib/board/fixtures/',
];

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // geen geldige invoer: niets blokkeren
}

const raw = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path ?? '';
if (!raw) process.exit(0);

const file = raw.replace(/\\/g, '/');

const geraakt = BEVROREN.find((p) =>
  p.endsWith('/')
    ? file.includes('/' + p) || file.startsWith(p)
    : file === p || file.endsWith('/' + p)
);

if (geraakt) {
  console.error(
    `Geblokkeerd: ${raw} valt onder "${geraakt}" en is bevroren (linkformaat v1). ` +
      'Oude links moeten voor altijd werken. Wijzig dit bestand niet, ook niet via de shell; ' +
      'maak een nieuwe formaatversie volgens docs/v2/linkformaat-v2.md.'
  );
  process.exit(2);
}

process.exit(0);
