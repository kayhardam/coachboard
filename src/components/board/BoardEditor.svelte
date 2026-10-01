<!--
  The interactive board, loaded with client:only on /[lang]/board/. Wraps
  Court and turns pointer input into the pure operations in edit.ts; the
  board is immutable ($state.raw), so undo is a list of earlier boards.
-->
<svelte:options css="injected" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { BoardStrings } from "../../i18n/ui";
  import { defaultBoard } from "../../lib/board/defaults";
  import * as edit from "../../lib/board/edit";
  import type { Selection } from "../../lib/board/edit";
  import { decode, encode, isBoard, type Board } from "../../lib/board/format";
  import { HIT_R } from "../../lib/board/geometry";
  import { nearestPiece, reach } from "../../lib/board/hit";
  import { icons } from "../../lib/icons";
  import Court from "./Court.svelte";

  /** `home`: the home page, linked from the bar in landscape, where the header is hidden. */
  let { strings, home }: { strings: BoardStrings; home: string } = $props();

  type Tool = "move" | "attack" | "defence" | "ball" | "run" | "pass" | "dribble";
  type XY = [number, number];
  type Drag =
    | { type: "piece"; piece: Selection; start: Board; offset: XY; origin: XY; moved: boolean }
    | { type: "arrow"; index: number; start: Board; origin: XY; moved: boolean }
    | { type: "handle"; index: number; handle: 0 | 1 | 2; start: Board; moved: boolean }
    | { type: "draw"; kind: "run" | "pass" | "dribble"; from: XY; to: XY };

  const STORAGE_KEY = "coachboard.board";
  const HISTORY = 100;
  /** Pointer travel (dm) before a press counts as a drag rather than a tap. */
  const DRAG_START = 1.5;

  const tools = $derived<{ id: Tool; label: string }[]>([
    { id: "move", label: strings["board.tool.move"] },
    { id: "attack", label: strings["board.tool.attack"] },
    { id: "defence", label: strings["board.tool.defence"] },
    { id: "ball", label: strings["board.tool.ball"] },
    { id: "run", label: strings["board.tool.run"] },
    { id: "pass", label: strings["board.tool.pass"] },
    { id: "dribble", label: strings["board.tool.dribble"] },
  ]);

  let board = $state.raw<Board>(structuredClone(defaultBoard));
  let past = $state.raw<Board[]>([]);
  let draft = $state.raw<Board | null>(null);
  let tool = $state<Tool>("move");
  let selected = $state<Selection | null>(null);
  let notice = $state<string | null>(null);
  let clearOpen = $state(false);
  let manualLink = $state<string | null>(null);
  let qr = $state<string | null>(null);
  let qrDialog: HTMLDialogElement;
  let loaded = $state(false);
  let stage: HTMLDivElement;
  let drag: Drag | null = null;
  /** The board as it came from a #t= link, until the first edit. */
  let linked: Board | null = null;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  /** The board a lasting notice was shown for; the first edit clears it. */
  let noticeBoard = $state.raw<Board | null>(null);

  const frame = $derived(board.frames[0]!);

  function commit(next: Board) {
    if (next === board) return false;
    past = [...past.slice(1 - HISTORY), board];
    board = next;
    return true;
  }

  function undo() {
    const previous = past.at(-1);
    if (!previous) return;
    past = past.slice(0, -1);
    board = previous;
    selected = null;
  }

  /** Shows a notice for six seconds, or with `lasting` until it is dismissed or the board is edited. */
  function show(text: string, lasting = false) {
    clearTimeout(noticeTimer);
    notice = text;
    noticeBoard = lasting ? board : null;
    if (!lasting) noticeTimer = setTimeout(() => (notice = null), 6000);
  }

  function dismiss() {
    notice = null;
    noticeBoard = null;
  }

  // Every edit makes a new board (edit.ts is pure), so a new board means an edit.
  $effect(() => {
    if (noticeBoard && board !== noticeBoard) dismiss();
  });

  /**
   * The QR library isn't needed to draw, so it stays out of the first load.
   * It is fetched once the board is up, so the QR code still opens after the
   * phone goes offline.
   */
  let qrLibrary: Promise<typeof import("uqr")> | undefined;
  const loadQr = () => (qrLibrary ??= import("uqr"));

  // ===== Loading and saving =====

  async function fromHash(): Promise<Board | null | undefined> {
    if (!location.hash.startsWith("#t=")) return undefined;
    return decode(decodeURIComponent(location.hash.slice(3)));
  }

  /** The board you had on workers.dev, brought along as #own= by the redirect in board.astro. */
  function movedBoard(): Board | undefined {
    if (!location.hash.startsWith("#own=")) return undefined;
    try {
      const moved: unknown = JSON.parse(decodeURIComponent(location.hash.slice(5)));
      return isBoard(moved) ? moved : undefined;
    } catch {
      return undefined;
    }
  }

  onMount(() => {
    const idle = window.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 500));
    idle(() => loadQr().catch(() => (qrLibrary = undefined)));

    (async () => {
      const shared = await fromHash();
      if (shared) board = linked = shared;
      else {
        // A broken link falls back to your own board, so the save below
        // doesn't replace it with the default lineup.
        let own = false;
        try {
          const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
          if (isBoard(saved)) board = saved;
          own = isBoard(saved);
        } catch {
          // No storage (private mode, blocked): start from the default lineup.
        }
        // Not linked, so the save below keeps it. A board already saved on
        // this domain wins, and the address bar gets its #t= instead.
        const moved = own ? undefined : movedBoard();
        if (moved) board = moved;
        if (shared === null) show(strings[own ? "board.invalidLink" : "board.invalidLinkDefault"], true);
      }
      loaded = true;
    })();

    // A pasted link in the same tab only changes the fragment.
    const onHash = async () => {
      const shared = await fromHash();
      if (shared) {
        commit(shared);
        linked = shared;
        selected = null;
      } else if (shared === null) show(strings["board.invalidLink"], true);
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  });

  // Every change lands in localStorage and in the URL, so a reload or a
  // copied address bar always has the latest board.
  $effect(() => {
    if (!loaded) return;
    const current = board;
    const timer = setTimeout(async () => {
      // Opening someone's link (or a tactic) doesn't replace your own saved
      // board; editing it does.
      if (current !== linked) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch {
          // Storage full or blocked: the URL still holds the board.
        }
      }
      const link = await encode(current);
      try {
        history.replaceState(history.state, "", `#t=${link}`);
      } catch {
        // Safari throttles replaceState (100 calls per 30 s); the next change retries.
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

  /** How far a tap reaches on the court as it is drawn now (see hit.ts). */
  function tapReach(): number {
    const ctm = stage.querySelector("svg")?.getScreenCTM();
    return ctm ? reach(Math.hypot(ctm.a, ctm.b)) : HIT_R;
  }

  function pieceAt(target: EventTarget | Element | null): { kind: string; index: number } | null {
    const el = (target as Element | null)?.closest?.("[data-kind]");
    if (!el) return null;
    return { kind: el.getAttribute("data-kind")!, index: Number(el.getAttribute("data-index")) };
  }

  /**
   * What a press at `at` is for: a handle of the selected arrow; else the
   * nearest piece whose drawn touch area it is in; else an arrow; else the
   * nearest piece within a finger's reach, so small pieces stay easy to hit
   * without covering the arrows round them.
   */
  function hitAt(target: EventTarget | null, at: XY): { kind: string; index: number } | null {
    const drawn = pieceAt(target);
    if (drawn?.kind === "handle") return drawn;
    return nearestPiece(frame, at, HIT_R) ?? (drawn?.kind === "arrow" ? drawn : nearestPiece(frame, at, tapReach()));
  }

  const isDrawTool = (t: Tool): t is "run" | "pass" | "dribble" =>
    t === "run" || t === "pass" || t === "dribble";

  function onpointerdown(e: PointerEvent) {
    if (drag || !e.isPrimary || e.button > 0) return;
    const at = toCourt(e);
    const hit = hitAt(e.target, at);
    stage.setPointerCapture(e.pointerId);

    if (hit?.kind === "handle" && selected?.kind === "arrow") {
      drag = { type: "handle", index: selected.index, handle: hit.index as 0 | 1 | 2, start: board, moved: false };
    } else if (isDrawTool(tool)) {
      const from = hit?.kind === "player" ? [...frame.players[hit.index]!.at] as XY : at;
      drag = { type: "draw", kind: tool, from, to: from };
    } else if (hit?.kind === "player" || hit?.kind === "ball") {
      const piece: Selection = { kind: hit.kind, index: hit.index };
      const pos = hit.kind === "player" ? frame.players[hit.index]!.at : frame.ball!;
      drag = { type: "piece", piece, start: board, offset: [pos[0] - at[0], pos[1] - at[1]], origin: at, moved: false };
    } else if (hit?.kind === "arrow") {
      drag = { type: "arrow", index: hit.index, start: board, origin: at, moved: false };
    } else if (tool === "attack" || tool === "defence") {
      if (commit(edit.addPlayer(board, tool === "attack" ? "a" : "d", at))) {
        selected = { kind: "player", index: frame.players.length - 1 };
      }
    } else if (tool === "ball") {
      commit(edit.placeBall(board, at));
      selected = { kind: "ball", index: 0 };
    } else {
      selected = null;
    }
  }

  function onpointermove(e: PointerEvent) {
    if (!drag || !e.isPrimary) return;
    const at = toCourt(e);

    if (drag.type === "draw") {
      drag.to = at;
      draft = edit.addArrow(board, drag.kind, drag.from, at);
      return;
    }
    if (drag.type !== "handle" && !drag.moved) {
      drag.moved = Math.hypot(at[0] - drag.origin[0], at[1] - drag.origin[1]) > DRAG_START;
      if (!drag.moved) return;
    }
    drag.moved = true;

    if (drag.type === "piece") {
      board = edit.movePiece(drag.start, drag.piece, [at[0] + drag.offset[0], at[1] + drag.offset[1]]);
    } else if (drag.type === "arrow") {
      board = edit.moveArrow(drag.start, drag.index, [at[0] - drag.origin[0], at[1] - drag.origin[1]]);
    } else {
      board = edit.moveHandle(drag.start, drag.index, drag.handle, at);
    }
  }

  function onpointerup(e: PointerEvent) {
    if (!drag || !e.isPrimary) return;
    const done = drag;
    drag = null;
    draft = null;

    if (done.type === "draw") {
      // Released on (or near) a player: the arrow ends at that player.
      const at = toCourt(e);
      const hit = nearestPiece({ ...frame, ball: undefined }, at, tapReach());
      const to = hit ? ([...frame.players[hit.index]!.at] as XY) : at;
      if (commit(edit.addArrow(board, done.kind, done.from, to))) {
        selected = { kind: "arrow", index: frame.arrows.length - 1 };
      } else {
        selected = null;
      }
      return;
    }

    if (done.moved) {
      // The drag already showed the moves; one undo step takes it all back.
      past = [...past.slice(1 - HISTORY), done.start];
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
    if ((e.target as Element).closest("input, textarea")) return;
    if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      undo();
    } else if ((e.key === "Delete" || e.key === "Backspace") && selected) {
      e.preventDefault();
      remove();
    } else if (e.key === "Escape") {
      selected = null;
    }
  }

  // ===== Actions =====

  function remove() {
    if (!selected) return;
    commit(edit.removeSelected(board, selected));
    selected = null;
  }

  function clearWith(next: Board) {
    commit(next);
    selected = null;
    clearOpen = false;
  }

  function toggleCourt() {
    commit(edit.setCourt(board, board.court === "half" ? "full" : "half"));
    selected = null;
  }

  // ===== Sharing =====

  async function shareUrl() {
    return `${location.origin}${location.pathname}#t=${await encode(board)}`;
  }

  async function share() {
    const url = await shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
        return;
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return;
        // Not allowed here (e.g. desktop without a share target): copy instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      show(strings["board.linkCopied"]);
    } catch {
      manualLink = url;
    }
  }

  async function showQr() {
    let renderSVG: (typeof import("uqr"))["renderSVG"];
    try {
      ({ renderSVG } = await loadQr());
    } catch {
      qrLibrary = undefined; // Try again next time.
      show(strings["board.qrFailed"]);
      return;
    }
    qr = renderSVG(await shareUrl(), { ecc: "L", border: 2 });
    qrDialog.showModal();
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(board));
    show("Board JSON copied.");
  }
</script>

<svelte:window {onkeydown} />

<div class="editor">
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
    <Court board={draft ?? board} {selected} label={strings["board.court"]} />
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
      <button type="button" class="dismiss" onclick={dismiss} aria-label={strings["board.dismiss"]}>×</button>
    </div>
  {/if}

  <div class="bar tools" role="toolbar" aria-label={strings["board.tools"]}>
    {#each tools as t (t.id)}
      <button
        type="button"
        class="tool"
        aria-pressed={tool === t.id}
        title={t.label}
        onclick={() => (tool = t.id)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#if t.id === "attack" || t.id === "defence"}
            <circle cx="12" cy="12" r="8" class={t.id} />
          {:else if t.id === "ball"}
            <circle cx="12" cy="12" r="6" class="ball" />
          {:else}
            <path d={icons[t.id]} stroke-dasharray={t.id === "pass" ? "3 3" : undefined} />
          {/if}
        </svg>
        <span>{t.label}</span>
      </button>
    {/each}
  </div>

  <div class="bar actions" role="toolbar" aria-label={strings["board.actions"]}>
    <a class="tool home" href={home} title={strings["board.home"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.court} /></svg>
      <span>{strings["board.home"]}</span>
    </a>
    <button type="button" class="tool" onclick={undo} disabled={past.length === 0} title={strings["board.undo"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.undo} /></svg>
      <span>{strings["board.undo"]}</span>
    </button>
    <button type="button" class="tool" onclick={remove} disabled={!selected} title={strings["board.delete"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.delete} /></svg>
      <span>{strings["board.delete"]}</span>
    </button>
    <details class="menu" bind:open={clearOpen}>
      <summary class="tool" title={strings["board.clear"]}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.clear} /></svg>
        <span>{strings["board.clear"]}</span>
      </summary>
      <div class="menu-panel">
        <button type="button" onclick={() => clearWith(edit.clearArrows(board))}>{strings["board.clearArrows"]}</button>
        <button type="button" onclick={() => clearWith(edit.resetLineup())}>{strings["board.resetLineup"]}</button>
        <button type="button" onclick={() => clearWith(edit.emptyCourt(board))}>{strings["board.emptyCourt"]}</button>
      </div>
    </details>
    <button type="button" class="tool" onclick={toggleCourt} title={board.court === "half" ? strings["board.fullCourt"] : strings["board.halfCourt"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={board.court === "half" ? icons.courtFull : icons.court} /></svg>
      <span>{board.court === "half" ? strings["board.fullCourt"] : strings["board.halfCourt"]}</span>
    </button>
    <button type="button" class="tool" onclick={share} title={strings["board.share"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.share} /></svg>
      <span>{strings["board.share"]}</span>
    </button>
    <button type="button" class="tool" onclick={showQr} title={strings["board.qr"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.qr} /></svg>
      <span>{strings["board.qr"]}</span>
    </button>
    {#if import.meta.env.DEV}
      <button type="button" class="tool" onclick={copyJson} title="Copy JSON (dev only)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.json} /></svg>
        <span>JSON</span>
      </button>
    {/if}
  </div>
</div>

<dialog class="qr" bind:this={qrDialog} aria-label={strings["board.qr"]} onclose={() => (qr = null)}>
  <button type="button" class="dismiss close" onclick={() => qrDialog.close()} aria-label={strings["board.close"]}>×</button>
  {#if qr}
    <div class="code">{@html qr}</div>
    <p>{strings["board.qrHint"]}</p>
  {/if}
</dialog>

<style>
  /* The fallback in board.astro mirrors this box: keep them in step. */
  .editor {
    display: grid;
    grid-template-rows: minmax(0, 1fr) minmax(var(--board-bar), auto) minmax(var(--board-bar), auto);
    width: 100%;
    min-height: 0;
    max-width: 720px;
    margin-inline: auto;
    padding: 8px 8px max(8px, env(safe-area-inset-bottom));
    gap: var(--board-gap);
    position: relative;
  }

  /* The court is taken out of the flow, so its aspect ratio can't size the
     row: it fits (letterboxed) in whatever space the bars leave. */
  .stage {
    position: relative;
    min-height: 0;
    touch-action: none;
    -webkit-touch-callout: none;
    cursor: crosshair;
  }

  .stage > :global(svg) {
    position: absolute;
    inset: 0;
  }

  .bar {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 4px;
  }

  .tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: var(--tap);
    min-width: 0;
    padding: 4px 2px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    font: inherit;
    font-size: 0.6875rem;
    line-height: 1.1;
    cursor: pointer;
    list-style: none;
  }
  .tool::-webkit-details-marker {
    display: none;
  }
  .tool span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tool[aria-pressed="true"] {
    border-color: var(--color-accent-dark);
    background: #dcfce7;
    color: var(--color-accent-darker);
    font-weight: 600;
  }
  .tool:disabled {
    color: var(--color-text-muted);
    opacity: 0.5;
    cursor: default;
  }

  .tool svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tool .attack {
    fill: var(--color-accent-dark);
    stroke: none;
  }
  .tool .defence {
    fill: var(--color-primary);
    stroke: none;
  }
  .tool .ball {
    fill: #f59e0b;
    stroke: #78350f;
    stroke-width: 1.5;
  }

  .menu {
    position: relative;
    display: grid;
  }
  .menu-panel {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    z-index: 10;
    display: grid;
    min-width: 200px;
    translate: -50% 0;
    padding: 4px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
  }
  .menu-panel button {
    min-height: var(--tap);
    padding: 8px 12px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .menu-panel button:hover {
    background: var(--color-bg-soft);
  }

  /* The brand mark, as in the header it stands in for. */
  .home {
    display: none;
    text-decoration: none;
  }
  .home svg {
    padding: 2px;
    border-radius: 6px;
    background: var(--color-accent);
    color: #fff;
  }

  /*
   * A phone in landscape has no height to spare. BaseLayout hides the header,
   * and the bars become columns at the sides, in reach of both thumbs, so the
   * court gets the full height. Same query as in BaseLayout.astro.
   */
  @media (orientation: landscape) and (max-height: 559px) {
    .editor {
      grid-template: minmax(0, 1fr) / auto minmax(0, 1fr) auto;
      max-width: none;
      padding: 4px 4px max(4px, env(safe-area-inset-bottom));
    }
    .stage {
      grid-area: 1 / 2;
    }
    .tools {
      grid-area: 1 / 1;
    }
    .actions {
      grid-area: 1 / 3;
    }
    .bar {
      grid-auto-flow: row;
      grid-auto-rows: minmax(0, 1fr);
      width: var(--board-side);
      gap: 2px;
    }
    .home {
      display: flex;
    }
    .menu-panel {
      top: 0;
      right: calc(100% + 6px);
      bottom: auto;
      left: auto;
      translate: none;
    }
  }

  .notice {
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    width: max-content;
    max-width: calc(100% - 24px);
    translate: -50% 0;
    padding: 4px 4px 4px 14px;
    background: var(--color-primary);
    color: #fff;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
    font-size: 0.875rem;
  }
  .notice label {
    display: grid;
    gap: 4px;
    padding-block: 8px;
  }
  .notice input {
    width: 100%;
    min-width: 0;
    padding: 6px 8px;
    border: 0;
    border-radius: 4px;
    font: inherit;
    font-size: 0.8125rem;
  }

  .qr {
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 16px;
    border: 0;
    background: #fff;
  }
  .qr[open] {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 12px;
  }
  .code {
    width: min(92vw, 78dvh);
  }
  .code :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
  .qr p {
    color: var(--color-text-muted);
    text-align: center;
  }
  .close {
    position: absolute;
    top: 8px;
    right: 8px;
    color: var(--color-text);
    font-size: 1.75rem;
  }

  .dismiss {
    min-width: var(--tap);
    min-height: var(--tap);
    border: 0;
    background: none;
    color: inherit;
    font-size: 1.25rem;
    cursor: pointer;
  }
</style>
