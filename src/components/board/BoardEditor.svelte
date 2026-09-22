<!--
  The interactive board, loaded with client:only on /[lang]/board/. Wraps
  Court and turns pointer input into the pure operations in edit.ts; the
  board is immutable ($state.raw), so undo is a list of earlier boards.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { renderSVG } from "uqr";
  import type { BoardStrings } from "../../i18n/ui";
  import { defaultBoard } from "../../lib/board/defaults";
  import * as edit from "../../lib/board/edit";
  import type { Selection } from "../../lib/board/edit";
  import { decode, encode, isBoard, type Board } from "../../lib/board/format";
  import Court from "./Court.svelte";

  let { strings }: { strings: BoardStrings } = $props();

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
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

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

  function show(text: string) {
    clearTimeout(noticeTimer);
    notice = text;
    noticeTimer = setTimeout(() => (notice = null), 6000);
  }

  // ===== Loading and saving =====

  async function fromHash(): Promise<Board | null | undefined> {
    if (!location.hash.startsWith("#t=")) return undefined;
    return decode(decodeURIComponent(location.hash.slice(3)));
  }

  onMount(() => {
    (async () => {
      const shared = await fromHash();
      if (shared) board = shared;
      else if (shared === null) show(strings["board.invalidLink"]);
      else {
        try {
          const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
          if (isBoard(saved)) board = saved;
        } catch {
          // No storage (private mode, blocked): start from the default lineup.
        }
      }
      loaded = true;
    })();

    // A pasted link in the same tab only changes the fragment.
    const onHash = async () => {
      const shared = await fromHash();
      if (shared) {
        commit(shared);
        selected = null;
      } else if (shared === null) show(strings["board.invalidLink"]);
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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // Storage full or blocked: the URL still holds the board.
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

  function pieceAt(target: EventTarget | Element | null): { kind: string; index: number } | null {
    const el = (target as Element | null)?.closest?.("[data-kind]");
    if (!el) return null;
    return { kind: el.getAttribute("data-kind")!, index: Number(el.getAttribute("data-index")) };
  }

  const isDrawTool = (t: Tool): t is "run" | "pass" | "dribble" =>
    t === "run" || t === "pass" || t === "dribble";

  function onpointerdown(e: PointerEvent) {
    if (drag || !e.isPrimary || e.button > 0) return;
    const hit = pieceAt(e.target);
    const at = toCourt(e);
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
      // Released on a player: the arrow ends at that player.
      const hit = pieceAt(document.elementFromPoint(e.clientX, e.clientY));
      const to = hit?.kind === "player" ? ([...frame.players[hit.index]!.at] as XY) : toCourt(e);
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
    qr = renderSVG(await shareUrl(), { ecc: "L", border: 2 });
    qrDialog.showModal();
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(board));
    show("Board JSON copied.");
  }

  // ===== Icons (24×24, stroked unless filled below) =====

  const icons: Record<string, string> = {
    move: "M12 3v18M3 12h18M12 3l-3 3m3-3 3 3m-3 15-3-3m3 3 3-3M3 12l3-3m-3 3 3 3m15-3-3-3m3 3-3 3",
    run: "M5 19 19 5m0 0h-8m8 0v8",
    pass: "M5 19 19 5m0 0h-8m8 0v8",
    dribble: "M4 18c2-1 1-4 3-5s3 1 5-1-0-4 2-5 3 0 5-3m0 0h-7m7 0v7",
    undo: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4",
    delete: "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3",
    clear: "M19 20H9l-5-5 9-9 7 7-5 5m-7-7 7 7",
    court: "M5 3h14v18H5zM9 3v3h6V3",
    courtFull: "M5 3h14v18H5zM5 12h14M9 3v3h6V3M9 21v-3h6v3",
    json: "M8 4H6v16h2m8-16h2v16h-2",
    share: "M12 3v12m0-12-4 4m4-4 4 4M5 13v7h14v-7",
    qr: "M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h2v2h-2zm4 4h2v2h-2zm-4 2h2m2-6h2",
  };
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
      <button type="button" class="dismiss" onclick={() => (notice = null)} aria-label={strings["board.dismiss"]}>×</button>
    </div>
  {/if}

  <div class="bar" role="toolbar" aria-label={strings["board.tools"]}>
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

  <div class="bar" role="toolbar" aria-label={strings["board.actions"]}>
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
  .editor {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto auto;
    height: 100%;
    max-width: 720px;
    margin-inline: auto;
    padding: 8px 8px max(8px, env(safe-area-inset-bottom));
    gap: 6px;
    position: relative;
  }

  .stage {
    min-height: 0;
    touch-action: none;
    -webkit-touch-callout: none;
    cursor: crosshair;
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
