# The link format

Every board shared from Handball Coachboard sits in its link: there is no server and nothing stored. This page says how to read such a link, so that anyone — a club, a federation, a coach with a script — can open the boards that were shared, with or without this site. The code that implements it is `src/lib/board/format.ts`; the links in `src/lib/board/fixtures/` are examples every version must keep reading.

## The link

A shared board opens on `https://handballcoachboard.com/<lang>/board/link/#t=<link>` (a scanned QR code on `/board/qr/`, the editor on `/board/`; before October 2026 on `coachboard.hardamkay.workers.dev`). Everything after `#t=` is the link:

```
<version>.<payload>
```

- `version` is `1` or `2` (a positive integer; higher numbers come from newer code).
- `payload` is base64url (`A–Z a–z 0–9 - _`, no padding), at most 10 000 characters, of raw deflate (zlib without its header and checksum, `deflate-raw`) of a UTF-8 JSON text of at most 64 KB.

So a reader does, in that order: split at the first `.`; base64url-decode; inflate (raw deflate); parse JSON; then read the arrays below for that version. In Python:

```python
import base64, json, zlib

version, payload = link.split(".", 1)
raw = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
data = json.loads(zlib.decompress(raw, -15))  # -15: raw deflate
```

## Coordinates

Whole decimetres on a portrait court with the goal at the top: `x` runs 0–200 from sideline to sideline, `y` runs 0–400 from the goal line (a half court shows 0–200). The goal is 3 m wide, centred: the posts stand at x = 85 and x = 115. The goal area is 6 m from the posts, the free-throw line 9 m.

## Version 2 (since October 2026)

```
[court, title, lineup, cones, steps]
```

| Part | Shape | Meaning |
|---|---|---|
| `court` | `0` or `1` | `0` = half court, `1` = full court |
| `title` | string | the board's title; `""` = none (at most 40 characters) |
| `lineup` | `[[team] \| [team, label], …]` | every player, once, for all steps: `team` `0` = attack, `1` = defence, `2` = passer (a helper without a label); `label` up to 3 characters (`"LB"`, `"7"`) |
| `cones` | `[x, y, x, y, …]` | cones, the same in every step (at most 16) |
| `steps` | `[step, …]` | 1 to 8 steps |

A step:

```
[positions, balls, arrows, text]
```

| Part | Shape | Meaning |
|---|---|---|
| `positions` | `[x, y, x, y, …]` | one pair per player of the lineup, in its order: where they stand at the start of the step |
| `balls` | `[x, y, x, y, …]` | at most 4 balls |
| `arrows` | `[arrow, …]` | at most 30, in drawing order |
| `text` | string | one sentence that explains the step; `""` = none (at most 100 characters) |

An arrow is one of three shapes, told apart by its kind and length:

| Shape | Meaning |
|---|---|
| `[kind, player, x, y]` or `[kind, player, bx, by, x, y]` (even length) | an arrow of a player (an index into the lineup): it starts where that player is by then; `x, y` is its end, `bx, by` an optional bend the curve passes through |
| `[kind, x1, y1, x2, y2]` or `[kind, x1, y1, bx, by, x2, y2]` (odd length) | an arrow of nobody, with its own start |
| `[4, player, side]` | a shot of a player: `side` `0` = left, `1` = middle, `2` = right of the goal nearest the shooter |

`kind`: `0` = run, `1` = pass, `2` = dribble, `3` = block (a screen, set by an attacker), `4` = shot, `5` = bounce (a pass that touches the floor at its bend).

**Where an arrow of a player starts.** Runs, dribbles and blocks (`0`, `2`, `3`) take the player along: their next arrow in the same step starts where the previous one ended. So an arrow of a player starts where they stand at the start of the step, or where their last run, dribble or block in that step ended, in drawing order. A shot ends on the goal line (y = 0, or y = 400 on a full court when the shooter is in the far half) at x = 90, 100 or 110.

**Playing a step.** The players move along their arrows to the next step's positions; a ball goes with whoever has it and along each pass. The sentence belongs to the step as drawn.

**What a reader may refuse.** Positions, balls, cones and arrow points are whole numbers within the court; a step has exactly as many positions as the lineup has players; a player's index is within the lineup; an arrow of nobody can't be a shot. A `-1` in place of a position is reserved (a player off the court in that step) and refused by version 2 readers.

## Version 1 (September–October 2026)

```
[court, [frame, …]]
frame  = [players, ball, arrows]
player = [team, x, y] | [team, x, y, label]     team: 0 = attack, 1 = defence
ball   = [x, y] | 0                              0 = no ball
arrow  = [kind, x1, y1, x2, y2(, x3, y3)]        kind: 0 = run, 1 = pass, 2 = dribble
```

Every frame lists its players; the arrows have no player and keep their own start. The site reads a version 1 link as a version 2 board with the same drawing (one ball per step at most, no cones, no title or sentences).

## Older boards and the export file

- Boards saved on a device by older versions are JSON of the same shape as the JavaScript objects (`{ v: 1, … }` or `{ v: 2, … }`, see `BoardV1` and `Board` in `format.ts`), not links.
- "Export all boards" in My boards writes one file of links and nothing else:

  ```json
  { "coachboard": 1, "boards": [{ "link": "https://handballcoachboard.com/nl/board/#t=2.…", "folder": "Training 6-0", "at": "2026-11-03T18:00:00.000Z" }] }
  ```

  `folder` is optional; `at` is the board's date as ISO 8601. The boards are in the order of the list, so a folder imports in its order.

## Rules for changing the format

A link in a team chat or on a printed QR code must open forever. So: a change an older reader would refuse — a higher limit, a new kind of arrow or team, the reserved `-1` — is a new version with a new prefix (`3.`) and its own reader; a limit never gets tighter; the fixtures are never edited. Inside one version, only what every reader of that version already accepts may change.
