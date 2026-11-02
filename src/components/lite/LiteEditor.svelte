<!--
  The lite editor (the MVP, on /[lang]/lite/): only the core — draw on the
  court, steps, undo, share a link or QR code. No My boards, no storage, no
  beacon. It wraps Court (chalk theme) and turns pointer input into the pure
  operations in src/lib/board/edit.ts; the board is immutable ($state.raw), so
  undo is a list of earlier boards. Every change lands in the address bar as
  #t=, a normal "2." link: the lite viewer and the board's own viewer both
  open it.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { LiteKey, LiteStrings } from "../../i18n/ui";
  import * as edit from "../../lib/board/edit";
  import type { Selection } from "../../lib/board/edit";
  import { decode, encode, MAX_STEPS, MAX_TEXT, MAX_TITLE, type Board } from "../../lib/board/format";
  import { reloadForNewer } from "../../lib/board/newer";
  import { moment } from "../../lib/board/play";
  import { endOf } from "../../lib/board/moves";
  import { HIT_R } from "../../lib/board/geometry";
  import { holder, inGoal, nearestPiece, reach } from "../../lib/board/hit";
  import { boardIcons as icons } from "../../lib/icons";
  import { LITE_KINDS, LITE_TOOLS, shareUrl, type LiteTool } from "../../lib/lite/lite";
  import Court from "../board/Court.svelte";

  /** `viewer`: the lite viewer's path, where the shared link and QR code open. `lineup`: the default lineup in the page's language. */
  let { strings, home, viewer, lineup }: { strings: LiteStrings; home: string; viewer: string; lineup: Board } = $props();

  type XY = [number, number];
  type Drag =
    | { type: "piece"; piece: Selection; start: Board; offset: XY; origin: XY; moved: boolean }
    | { type: "arrow"; index: number; start: Board; origin: XY; moved: boolean }
    | { type: "handle"; index: number; handle: 0 | 1 | 2; start: Board; moved: boolean }
    | { type: "draw"; kind: "run" | "pass"; from: XY; player?: number; hit: Selection | null; origin: XY; moved: boolean };

  const HISTORY = 100;
  /** Pointer travel (dm) before a press counts as a drag rather than a tap. */
  const DRAG_START = 1.5;
  /** How long a step shows still, and how long its move to the next step takes (ms), as in the board's editor. */
  const STILL = 1200;
  const MOVE = 1000;

  const toolKeys: Record<LiteTool, LiteKey> = {
    move: "board.tool.move",
    arrow: "board.tool.arrow",
    attack: "board.tool.attack",
    defence: "board.tool.defence",
    ball: "board.tool.ball",
  };
  const kindKeys = {
    run: "board.tool.run",
    pass: "board.tool.pass",
    dribble: "board.tool.dribble",
    shot: "board.kind.shot",
  } as const satisfies Record<(typeof LITE_KINDS)[number], LiteKey>;
  const teamKeys = {
    a: "board.tool.attack",
    d: "board.tool.defence",
    p: "board.team.passer",
  } as const satisfies Record<string, LiteKey>;

  // Astro passes props as $state, a proxy that structuredClone() can't copy: take a plain copy once.
  // svelte-ignore state_referenced_locally
  const defaultLineup: Board = JSON.parse(JSON.stringify(lineup));

  let board = $state.raw<Board>(structuredClone(defaultLineup));
  let past = $state.raw<{ board: Board; step: number }[]>([]);
  let step = $state(0);
  let tool = $state<LiteTool>("arrow");
  let selected = $state<Selection | null>(null);
  let draft = $state.raw<Board | null>(null);
  let shown = $state.raw<Board | null>(null);
  let playing = $state(false);
  let frameRequest = 0;
  let loaded = $state(false);
  let stage: HTMLDivElement;
  let drag: Drag | null = null;
  let title = $state("");
  let sentence = $state("");
  let notice = $state<string | null>(null);
  let manualLink = $state<string | null>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  let shareDialog: HTMLDialogElement;
  let shareLink = $state("");
  let qr = $state<string | null>(null);
  let qrFailed = $state(false);
  /** The QR library loads later; it isn't needed to draw. */
  let qrLibrary: Promise<typeof import("../../lib/board/qr")> | undefined;

  const frame = $derived(board.frames[step] ?? board.frames[0]!);

  function commit(next: Board) {
    if (next === board) return false;
    past = [...past.slice(1 - HISTORY), { board, step }];
    board = next;
    return true;
  }

  function syncFields() {
    title = board.title ?? "";
    sentence = frame.text ?? "";
  }

  function undo() {
    stopPlaying();
    keepTitle();
    keepSentence();
    const previous = past.at(-1);
    if (!previous) return;
    past = past.slice(0, -1);
    ({ board, step } = previous);
    selected = null;
    syncFields();
  }

  function goTo(i: number) {
    stopPlaying();
    keepSentence();
    step = i;
    selected = null;
    sentence = board.frames[i]?.text ?? "";
  }

  function newStep() {
    stopPlaying();
    keepSentence();
    if (commit(edit.addStep(board, step))) goTo(step + 1);
  }

  function removeStep() {
    stopPlaying();
    keepSentence();
    if (commit(edit.removeStep(board, step))) goTo(Math.max(0, step - 1));
  }

  // ===== Title and sentence: kept on Enter or leaving the field =====

  function keepTitle() {
    commit(edit.setTitle(board, title));
  }

  function keepSentence() {
    commit(edit.setText(board, step, sentence));
  }

  function fieldKey(e: KeyboardEvent) {
    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
    else if (e.key === "Escape") syncFields();
  }

  // ===== Play: each step still, then its players move along their arrows =====

  function play() {
    if (playing) return stopPlaying();
    goTo(0);
    playing = true;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let start = performance.now();
    const tick = (now: number) => {
      const t = (now - start - STILL) / MOVE;
      const last = step >= board.frames.length - 1;
      if (t >= (last ? 1 + STILL / MOVE : 1)) {
        shown = null;
        if (last) return stopPlaying();
        step++;
        start = now;
      } else if (t > 0 && !still) {
        const at = moment(board, step, Math.min(t, 1));
        shown = { ...board, frames: board.frames.map((f, j) => (j === step ? at : f)) };
      }
      frameRequest = requestAnimationFrame(tick);
    };
    frameRequest = requestAnimationFrame(tick);
  }

  function stopPlaying() {
    cancelAnimationFrame(frameRequest);
    playing = false;
    shown = null;
  }

  // ===== Loading: a shared board in #t=, else the default lineup =====

  function open(next: Board) {
    stopPlaying();
    board = next;
    step = 0;
    past = [];
    selected = null;
    syncFields();
  }

  async function loadFromHash() {
    if (!location.hash.startsWith("#t=")) return;
    const link = decodeURIComponent(location.hash.slice(3));
    const opened = await decode(link);
    if (!opened) {
      if (reloadForNewer(link)) return;
      show(strings["board.invalidLink"]);
      return;
    }
    open(opened);
  }

  onMount(() => {
    (async () => {
      await loadFromHash();
      loaded = true;
    })();
    const onHash = () => void loadFromHash();
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  });

  // Every change lands in the URL (300 ms debounce), so it is always a shareable link.
  $effect(() => {
    if (!loaded) return;
    const now = board;
    const timer = setTimeout(async () => {
      if (board !== now) return;
      const link = await encode(now);
      try {
        history.replaceState(history.state, "", `#t=${link}`);
      } catch {
        // Throttled: the next change retries.
      }
    }, 300);
    return () => clearTimeout(timer);
  });

  // ===== Pointer input =====

  function toCourt(e: PointerEvent): XY {
    const ctm = stage.querySelector("svg")?.getScreenCTM();
    if (!ctm) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y];
  }

  function tapReach(): number {
    const ctm = stage.querySelector("svg")?.getScreenCTM();
    return ctm ? reach(Math.hypot(ctm.a, ctm.b)) : HIT_R;
  }

  function pieceAt(target: EventTarget | null): { kind: string; index: number } | null {
    const el = (target as Element | null)?.closest?.("[data-kind]");
    return el ? { kind: el.getAttribute("data-kind")!, index: Number(el.getAttribute("data-index")) } : null;
  }

  /** A handle of the selected arrow; else the nearest piece in its drawn touch area; else an arrow; else the nearest piece within a finger's reach. */
  function hitAt(target: EventTarget | null, at: XY): { kind: string; index: number } | null {
    const drawn = pieceAt(target);
    if (drawn?.kind === "handle") return drawn;
    return (
      nearestPiece(frame, at, HIT_R, board.cones) ??
      (drawn?.kind === "arrow" ? drawn : nearestPiece(frame, at, tapReach(), board.cones))
    );
  }

  function onpointerdown(e: PointerEvent) {
    if (drag || !e.isPrimary || e.button > 0) return;
    if (playing) return stopPlaying();
    keepTitle();
    keepSentence();
    const at = toCourt(e);
    let hit = hitAt(e.target, at);
    // With Arrow, a press on a player is for them, also under a handle: a pass ends on its receiver.
    if (tool === "arrow" && hit?.kind === "handle") hit = nearestPiece(frame, at, HIT_R) ?? hit;
    stage.setPointerCapture(e.pointerId);

    if (hit?.kind === "handle" && selected?.kind === "arrow") {
      drag = { type: "handle", index: selected.index, handle: hit.index as 0 | 1 | 2, start: board, moved: false };
    } else if (tool === "arrow") {
      // A tap picks the piece; a drag draws. From a player, their run (a pass if they have the ball); from the ball, a pass of whoever has it.
      const ball = hit?.kind === "ball" ? frame.balls[hit.index] : undefined;
      const player = hit?.kind === "player" ? hit.index : ball && holder(frame, ball, tapReach());
      const from: XY = player !== undefined ? endOf(frame, player) : ball ? [...ball] : at;
      const pass = ball || (hit?.kind === "player" && edit.hasBall(frame, hit.index));
      drag = { type: "draw", kind: pass ? "pass" : "run", from, player, hit: hit as Selection | null, origin: at, moved: false };
    } else if (hit?.kind === "player" || hit?.kind === "ball" || hit?.kind === "cone") {
      const piece = hit as Selection;
      const pos = hit.kind === "player" ? frame.players[hit.index]!.at : hit.kind === "ball" ? frame.balls[hit.index]! : board.cones[hit.index]!;
      drag = { type: "piece", piece, start: board, offset: [pos[0] - at[0], pos[1] - at[1]], origin: at, moved: false };
    } else if (hit?.kind === "arrow") {
      drag = { type: "arrow", index: hit.index, start: board, origin: at, moved: false };
    } else {
      selected = null;
      if (tool === "attack" || tool === "defence") commit(edit.addPlayer(board, tool === "attack" ? "a" : "d", at));
      else if (tool === "ball") commit(edit.addBall(board, step, at));
    }
  }

  function onpointermove(e: PointerEvent) {
    if (!drag || !e.isPrimary) return;
    const at = toCourt(e);

    if (drag.type !== "handle" && !drag.moved) {
      drag.moved = Math.hypot(at[0] - drag.origin[0], at[1] - drag.origin[1]) > DRAG_START;
      if (!drag.moved) return;
    }
    drag.moved = true;

    if (drag.type === "draw") {
      draft = edit.addArrow(...arrowTo(drag, at));
    } else if (drag.type === "piece") {
      board = edit.movePiece(drag.start, step, drag.piece, [at[0] + drag.offset[0], at[1] + drag.offset[1]]);
    } else if (drag.type === "arrow") {
      board = edit.moveArrow(drag.start, step, drag.index, [at[0] - drag.origin[0], at[1] - drag.origin[1]]);
    } else {
      board = edit.moveHandle(drag.start, step, drag.index, drag.handle, at);
    }
  }

  /** The arrow a draw released at `at` makes: a pass into a goal is a shot; released on a player, it ends where they stand or end their run. */
  function arrowTo(d: Extract<Drag, { type: "draw" }>, at: XY): Parameters<typeof edit.addArrow> {
    const shot = d.kind === "pass" && d.player !== undefined && inGoal(board, at, tapReach());
    const spots = [...frame.players, ...frame.players.map((p, i) => ({ ...p, at: endOf(frame, i) }))];
    const hit = shot ? null : nearestPiece({ ...frame, balls: [], players: spots }, at, tapReach());
    return [board, step, shot ? "shot" : d.kind, d.from, hit ? [...spots[hit.index]!.at] : at, d.player];
  }

  function onpointerup(e: PointerEvent) {
    if (!drag || !e.isPrimary) return;
    const done = drag;
    drag = null;
    draft = null;

    if (done.type === "draw") {
      if (done.moved && commit(edit.addArrow(...arrowTo(done, toCourt(e))))) {
        selected = { kind: "arrow", index: frame.arrows.length - 1 };
      } else {
        selected = done.hit;
      }
      return;
    }

    if (done.moved) {
      // The drag already showed the moves; one undo step takes it all back.
      past = [...past.slice(1 - HISTORY), { board: done.start, step }];
    }
    if (done.type === "handle" && done.handle === 0 && done.moved) {
      const hit = nearestPiece({ ...frame, balls: [] }, toCourt(e), tapReach());
      if (hit) board = edit.attachArrow(board, step, done.index, hit.index);
    }
    if (done.type === "piece") selected = done.piece;
    if (done.type === "arrow") selected = { kind: "arrow", index: done.index };
  }

  function onpointercancel() {
    if (drag && drag.type !== "draw") board = drag.start;
    drag = null;
    draft = null;
  }

  function onkeydown(e: KeyboardEvent) {
    if ((e.target as Element).closest("input, textarea, dialog")) return;
    if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      undo();
    } else if ((e.key === "Delete" || e.key === "Backspace") && selected) {
      e.preventDefault();
      remove();
    } else if (e.key === "Escape") {
      selected = null;
    } else if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    } else if (LITE_TOOLS[+e.key - 1]) {
      tool = LITE_TOOLS[+e.key - 1]!;
    } else if (e.key === "n" || e.key === "N") {
      newStep();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const i = step + (e.key === "ArrowRight" ? 1 : -1);
      if (board.frames[i]) goTo(i);
    }
  }

  function remove() {
    if (!selected) return;
    commit(edit.removeSelected(board, step, selected));
    selected = null;
  }

  // ===== The bar over the court for a selection: kinds for an arrow, teams for a player =====

  const strip = $derived.by((): { label: string; items: { id: string; label: string; on?: boolean; off?: boolean; icon?: string; dash?: boolean; team?: string; run: () => void }[] } | undefined => {
    const index = selected?.index ?? 0;
    const arrow = selected?.kind === "arrow" ? frame.arrows[index] : undefined;
    const player = selected?.kind === "player" ? frame.players[index] : undefined;
    if (arrow) {
      return {
        label: strings["board.kind"],
        items: LITE_KINDS.map((id) => ({
          id,
          label: strings[kindKeys[id]],
          on: arrow.kind === id,
          off: id === "shot" && arrow.from === undefined,
          icon: icons[id],
          dash: id === "pass",
          run: () => commit(edit.setKind(board, step, index, id)),
        })),
      };
    }
    if (player) {
      return {
        label: strings["board.team"],
        items: (["a", "d", "p"] as const).map((id) => ({
          id,
          label: strings[teamKeys[id]],
          on: player.team === id,
          team: id,
          run: () => commit(edit.setTeam(board, index, id)),
        })),
      };
    }
  });

  // ===== Sharing: one dialog with the QR code and the link =====

  function show(text: string) {
    clearTimeout(noticeTimer);
    notice = text;
    noticeTimer = setTimeout(() => (notice = null), 6000);
  }

  async function openShare() {
    stopPlaying();
    keepTitle();
    keepSentence();
    const link = await encode(board);
    shareLink = shareUrl(location.origin, viewer, link);
    qr = null;
    qrFailed = false;
    shareDialog.showModal();
    try {
      const { renderSVG } = await (qrLibrary ??= import("../../lib/board/qr"));
      qr = renderSVG(shareLink, { ecc: "L", border: 2 });
    } catch {
      // No code holds this board, or the library didn't load: the link still works.
      qrLibrary = undefined;
      qrFailed = true;
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      show(strings["board.linkCopied"]);
    } catch {
      manualLink = shareLink;
      shareDialog.close();
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="lite">
  <header class="top" role="toolbar" aria-label={strings["board.actions"]}>
    <a class="home" href={home} aria-label={strings["board.home"]} title={strings["board.home"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.court} /></svg>
    </a>
    <input
      class="title"
      bind:value={title}
      maxlength={MAX_TITLE}
      placeholder={strings["board.addTitle"]}
      aria-label={strings["board.editTitle"]}
      enterkeyhint="done"
      onkeydown={fieldKey}
      onblur={keepTitle}
    />
    <button type="button" class="icon" onclick={undo} disabled={past.length === 0} aria-label={strings["board.undo"]} title={strings["board.undo"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.undo} /></svg>
    </button>
    <button type="button" class="share" onclick={openShare}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.share} /></svg>
      <span>{strings["board.share"]}</span>
    </button>
  </header>

  <div class="steps" role="toolbar" aria-label={strings["board.steps"]}>
    {#each board.frames as f, i (i)}
      <button
        type="button"
        class="pill"
        class:on={i === step}
        aria-pressed={i === step}
        title={strings["board.step"].replace("{n}", String(i + 1))}
        onclick={() => goTo(i)}
      >
        {i + 1}
      </button>
    {/each}
    <button
      type="button"
      class="pill new"
      onclick={newStep}
      disabled={board.frames.length >= MAX_STEPS}
      aria-label={strings["board.newStep"]}
      title={strings["board.newStep"]}
      aria-keyshortcuts="N"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.plus} /></svg>
      <span>{strings["board.newStep"]}</span>
    </button>
    {#if board.frames.length > 1}
      <button type="button" class="pill del" onclick={removeStep} aria-label={strings["board.removeStep"]} title={strings["board.removeStep"]}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.delete} /></svg>
      </button>
    {/if}
    <button
      type="button"
      class="pill play"
      onclick={play}
      disabled={board.frames.length < 2}
      aria-label={strings[playing ? "board.stop" : "board.play"]}
      title={strings[playing ? "board.stop" : "board.play"]}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={playing ? icons.stop : icons.play} /></svg>
    </button>
  </div>

  <div
    class="stage"
    bind:this={stage}
    role="application"
    aria-label={strings["board.court"]}
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    {onpointercancel}
  >
    <Court board={shown ?? draft ?? board} frame={step} {selected} theme="chalk" label={strings["board.court"]} />
    {#if selected}
      <button type="button" class="float-del" onclick={remove} aria-label={strings["board.delete"]} title={strings["board.delete"]}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.delete} /></svg>
      </button>
    {/if}
    {#if strip}
      <div class="strip" role="toolbar" aria-label={strip.label}>
        {#each strip.items as item (item.id)}
          <button type="button" aria-pressed={item.on} disabled={item.off} onclick={item.run} title={item.label}>
            {#if item.icon}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} stroke-dasharray={item.dash ? "3 3" : undefined} /></svg>
            {:else if item.team}
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" class={item.team} /></svg>
            {/if}
            <span>{item.label}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <input
    class="sentence"
    bind:value={sentence}
    maxlength={MAX_TEXT}
    placeholder={strings["board.addText"]}
    aria-label={strings["board.editText"]}
    enterkeyhint="done"
    onkeydown={fieldKey}
    onblur={keepSentence}
  />

  <div class="dock" role="toolbar" aria-label={strings["board.tools"]}>
    {#each LITE_TOOLS as id, i (id)}
      <button
        type="button"
        class="tool"
        class:on={tool === id}
        aria-pressed={tool === id}
        title="{strings[toolKeys[id]]} ({i + 1})"
        aria-keyshortcuts={String(i + 1)}
        onclick={() => (tool = id)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#if id === "attack" || id === "defence"}
            <circle cx="12" cy="12" r="8" class={id} />
          {:else if id === "ball"}
            <circle cx="12" cy="12" r="6" class="ball" />
          {:else}
            <path d={icons[id === "arrow" ? "run" : id]} />
          {/if}
        </svg>
        <span>{strings[toolKeys[id]]}</span>
      </button>
    {/each}
  </div>

  {#if manualLink}
    <div class="notice" role="status">
      <label>
        {strings["board.copyManually"]}
        <input readonly value={manualLink} onfocus={(e) => e.currentTarget.select()} />
      </label>
      <button type="button" class="dismiss" onclick={() => (manualLink = null)} aria-label={strings["board.dismiss"]}>×</button>
    </div>
  {:else if notice}
    <div class="notice" role="status">
      <span>{notice}</span>
      <button type="button" class="dismiss" onclick={() => (notice = null)} aria-label={strings["board.dismiss"]}>×</button>
    </div>
  {/if}
</div>

<dialog class="share" bind:this={shareDialog} aria-label={strings["board.share"]}>
  <div class="share-bar">
    <h2>{strings["board.share"]}</h2>
    <button type="button" class="dismiss" onclick={() => shareDialog.close()} aria-label={strings["board.close"]}>×</button>
  </div>
  {#if qr}
    <div class="code">{@html qr}</div>
    <p>{strings[qrFailed ? "board.qrTooLarge" : "board.qrHint"]}</p>
  {:else}
    <p>{strings[qrFailed ? "board.qrTooLarge" : "board.qrFailed"]}</p>
  {/if}
  <div class="linkrow">
    <input readonly value={shareLink} aria-label={strings["board.share"]} onfocus={(e) => e.currentTarget.select()} />
    <button type="button" onclick={copyLink}>{strings["lite.copy"]}</button>
  </div>
</dialog>
