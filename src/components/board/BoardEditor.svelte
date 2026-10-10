<!--
  The interactive board, loaded with client:only on /[lang]/board/. Wraps
  Court and turns pointer input into the pure operations in edit.ts; the
  board is immutable ($state.raw), so undo is a list of earlier boards.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { BoardStrings } from "../../i18n/ui";
  import * as edit from "../../lib/board/edit";
  import type { Selection } from "../../lib/board/edit";
  import { decode, encode, isNewerLink, MAX_STEPS, MAX_TEXT, MAX_TITLE, toBoard, type Board } from "../../lib/board/format";
  import { SETUPS, setup } from "../../lib/board/defaults";
  import { moment } from "../../lib/board/play";
  import { HIT_R } from "../../lib/board/geometry";
  import { holder, inGoal, nearestPiece, reach } from "../../lib/board/hit";
  import { boardIcons as icons } from "../../lib/icons";
  import * as store from "../../lib/board/boards";
  import Court from "./Court.svelte";

  /**
   * `home`: the home page, linked from the title bar (the board has no site header).
   * `links`: the pages a shared link and a QR code open, so statistics can count them apart.
   * `lineup`: the default lineup, labelled in the page's language.
   */
  let {
    strings,
    home,
    links,
    lineup,
  }: { strings: BoardStrings; home: string; links: { link: string; qr: string }; lineup: Board } = $props();

  type Tool = "move" | "arrow" | "attack" | "defence" | "ball" | "cone";
  type XY = [number, number];
  type Drag =
    | { type: "piece"; piece: Selection; start: Board; offset: XY; origin: XY; moved: boolean }
    | { type: "arrow"; index: number; start: Board; origin: XY; moved: boolean }
    | { type: "handle"; index: number; handle: 0 | 1 | 2; start: Board; moved: boolean }
    | { type: "draw"; kind: "run" | "pass"; from: XY; player?: number; hit: Selection | null; origin: XY; moved: boolean };

  /** The last link that reloaded this tab, so it reloads only once (sessionStorage). */
  const RELOADED_KEY = "coachboard.reloaded";
  const HISTORY = 100;
  /** Pointer travel (dm) before a press counts as a drag rather than a tap. */
  const DRAG_START = 1.5;

  const tools = $derived<{ id: Tool; label: string }[]>([
    { id: "move", label: strings["board.tool.move"] },
    { id: "arrow", label: strings["board.tool.arrow"] },
    { id: "attack", label: strings["board.tool.attack"] },
    { id: "defence", label: strings["board.tool.defence"] },
    { id: "ball", label: strings["board.tool.ball"] },
    { id: "cone", label: strings["board.tool.cone"] },
  ]);
  const kinds = [
    ["run", "board.tool.run"],
    ["pass", "board.tool.pass"],
    ["bounce", "board.kind.bounce"],
    ["dribble", "board.tool.dribble"],
    ["shot", "board.kind.shot"],
    ["block", "board.kind.block"],
  ] as const;
  const teams = [
    ["a", "board.tool.attack", "attack"],
    ["d", "board.tool.defence", "defence"],
    ["p", "board.team.passer", "passer"],
  ] as const;

  // Astro passes props as $state, a proxy that structuredClone() can't copy:
  // take a plain copy once (a board is plain JSON; $state.snapshot() would add
  // runtime code). The lineup prop never changes.
  // svelte-ignore state_referenced_locally
  const defaultLineup: Board = JSON.parse(JSON.stringify(lineup));

  let board = $state.raw<Board>(structuredClone(defaultLineup));
  /** Earlier boards for Undo, each with the step that was on the court. */
  let past = $state.raw<{ board: Board; step: number }[]>([]);
  /** The step on the court: every edit goes to it. */
  let step = $state(0);
  /** The sentence of the step on the court is being typed; `typed` is what it says so far. */
  let editingText = $state(false);
  let typed = $state("");
  let draft = $state.raw<Board | null>(null);
  let tool = $state<Tool>("arrow");
  let selected = $state<Selection | null>(null);
  let notice = $state<string | null>(null);
  let menuOpen = $state(false);
  let editingTitle = $state(false);
  let manualLink = $state<string | null>(null);
  let qr = $state<string | null>(null);
  /**
   * The longest link in a QR code of version 30 (error correction L): the
   * largest the scan test read from phone to phone (docs/metingen.md, phase 11).
   * A larger code still shows, with a note.
   */
  const QR_SCANNED = 1732;
  let qrLarge = $state(false);
  let qrDialog: HTMLDialogElement;
  let listDialog: HTMLDialogElement;
  /** A new board (the first visit, New board, the open board deleted): it offers the starting lineups until its first edit. */
  let isNew = $state(false);
  /** My boards is open: notices show there, above the list. */
  let listOpen = $state(false);
  /** The board whose new folder is being named, or the folder being renamed. */
  let naming = $state<string | null>(null);
  let renaming = $state<string | null>(null);
  let loaded = $state(false);
  let stage: HTMLDivElement;
  let drag: Drag | null = null;
  /** Your boards on this device (boards.ts). */
  let boards = $state.raw<store.Saved[]>([]);
  /** The id of the board on the court in My boards; null until a new or received board is first saved. */
  let current = $state<string | null>(null);
  /**
   * The board as it was opened or last saved, and its link. A board that
   * draws differently is a real change, and only that is saved: a received
   * board, a tactic or a new board stays out of My boards until then.
   */
  let kept: Board | null = null;
  let keptLink: Promise<string> | null = null;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  /** The board a lasting notice was shown for; the first edit clears it. */
  let noticeBoard = $state.raw<Board | null>(null);
  /** A button in the notice, e.g. Undo after deleting a board. */
  let noticeAction = $state<{ label: string; run: () => void } | null>(null);

  const frame = $derived(board.frames[step] ?? board.frames[0]!);

  function commit(next: Board) {
    if (next === board) return false;
    past = [...past.slice(1 - HISTORY), { board, step }];
    board = next;
    return true;
  }

  /**
   * The bar over the court for what is selected: the kinds for an arrow, the
   * teams for a player, else the starting lineups on a new board. Picking a
   * lineup keeps it as the board as it was opened, so it saves nothing. The
   * lineups show no heading: it would be the largest text on a first visit,
   * painted only after this JS (the LCP), and their names say enough.
   */
  type Item = { id: string; label: string; on?: boolean; off?: boolean; icon?: string; dash?: boolean; team?: string; run: () => void };
  const strip = $derived.by((): { title: string; heading?: boolean; items: Item[] } | undefined => {
    const index = selected?.index ?? 0;
    const arrow = selected?.kind === "arrow" ? frame.arrows[index] : undefined;
    const player = selected?.kind === "player" ? frame.players[index] : undefined;
    if (arrow) {
      return {
        title: strings["board.kind"],
        heading: true,
        items: kinds.map(([id, key]) => ({
          id,
          label: strings[key],
          on: arrow.kind === id,
          off: id === "shot" && arrow.from === undefined,
          icon: icons[id],
          dash: id === "pass" || id === "bounce",
          run: () => commit(edit.setKind(board, step, index, id)),
        })),
      };
    }
    if (player) {
      return {
        title: strings["board.team"],
        heading: true,
        items: teams.map(([id, key, team]) => ({
          id,
          label: strings[key],
          on: player.team === id,
          team,
          run: () => commit(edit.setTeam(board, index, id)),
        })),
      };
    }
    if (isNew && past.length === 0 && !selected) {
      return {
        title: strings["board.setup"],
        items: SETUPS.map((id) => ({
          id,
          // A non-breaking hyphen: "Tegen" may wrap above "3-2-1", the defence itself not.
          label: strings[`board.setup.${id}`].replaceAll("-", "\u2011"),
          run: () => keep((board = setup(id, defaultLineup))),
        })),
      };
    }
  });

  /** Undo goes back to the step where the change was, so you see it. */
  function undo() {
    stopPlaying();
    keepText();
    const previous = past.at(-1);
    if (!previous) return;
    past = past.slice(0, -1);
    ({ board, step } = previous);
    selected = null;
  }

  // ===== Steps =====

  /** Puts step `i` on the court. A sentence being typed is kept first. */
  function goTo(i: number) {
    stopPlaying();
    keepText();
    step = i;
    selected = null;
  }

  /** New step: adds the next step after the one on the court and goes there (edit.addStep()). */
  function newStep() {
    stopPlaying();
    keepText();
    if (commit(edit.addStep(board, step))) goTo(step + 1);
  }

  function removeStep() {
    stopPlaying();
    keepText();
    menuOpen = false;
    if (commit(edit.removeStep(board, step))) goTo(Math.max(0, step - 1));
  }

  // ===== Play (decision D4) =====

  /** How long a step shows still, and how long its players then move to the next step (ms). */
  const STILL = 1200;
  const MOVE = 1000;
  let playing = $state(false);
  /**
   * The moment on the court while playing (play.ts). Only to watch: like
   * `draft`, it stays out of `board`, so nothing reaches the link, My boards or
   * Undo, and its places needn't be whole decimetres.
   */
  let shown = $state.raw<Board | null>(null);
  let frameRequest = 0;

  /**
   * Plays the steps in turn from the first: each shows still, then its
   * players move along their arrows to where the next step starts; the last
   * one ends where its arrows take them, and stays a moment. With reduced
   * motion the board goes from step to step without moving.
   */
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

  /** A tap on the sentence stops playing first, so the sentence stays with its step. */
  function editText() {
    stopPlaying();
    typed = frame.text ?? "";
    editingText = true;
  }

  /** Keeps the sentence being typed, as leaving the field does: before New step, another step, Share or Undo. */
  function keepText() {
    if (!editingText) return;
    editingText = false;
    commit(edit.setText(board, step, typed));
  }

  /** Enter keeps the sentence; Escape drops what was typed, and the blur after it keeps nothing. */
  function textKey(e: KeyboardEvent) {
    if (e.key === "Enter") keepText();
    else if (e.key === "Escape") editingText = false;
  }

  /** Shows a notice for six seconds, or with `lasting` until it is dismissed or the board is edited. */
  function show(text: string, lasting = false, action: typeof noticeAction = null) {
    clearTimeout(noticeTimer);
    notice = text;
    noticeAction = action;
    noticeBoard = lasting ? board : null;
    if (!lasting) noticeTimer = setTimeout(() => (notice = null), 6000);
  }

  function dismiss() {
    notice = null;
    noticeBoard = null;
    noticeAction = null;
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
  let qrLibrary: Promise<typeof import("../../lib/board/qr")> | undefined;
  const loadQr = () => (qrLibrary ??= import("../../lib/board/qr"));

  // ===== Loading and saving =====

  async function fromHash(): Promise<Board | null | undefined> {
    if (!location.hash.startsWith("#t=")) return undefined;
    return decode(decodeURIComponent(location.hash.slice(3)));
  }

  /**
   * A link from a newer version reloads the page once: a tab opened before a
   * deploy runs the old code, and the reload fetches the code that reads it.
   * If that code doesn't read it either, the notice for a broken link follows.
   */
  function reloadForNewer(): boolean {
    const link = decodeURIComponent(location.hash.slice(3));
    if (!isNewerLink(link)) return false;
    try {
      if (sessionStorage.getItem(RELOADED_KEY) === link) return false;
      sessionStorage.setItem(RELOADED_KEY, link);
    } catch {
      // No storage, so no way to stop at one reload: show the notice.
      return false;
    }
    location.reload();
    return true;
  }

  /** The board you had on workers.dev, brought along as #own= by the redirect in board.astro. */
  function movedBoard(): Board | undefined {
    if (!location.hash.startsWith("#own=")) return undefined;
    try {
      return toBoard(JSON.parse(decodeURIComponent(location.hash.slice(5)))) ?? undefined;
    } catch {
      return undefined;
    }
  }

  onMount(() => {
    const idle = window.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 500));
    idle(() => loadQr().catch(() => (qrLibrary = undefined)));

    (async () => {
      const shared = await fromHash();
      // Before `loaded`, so the save doesn't replace the link in the address bar.
      if (shared === null && reloadForNewer()) return;
      const list = readList() ?? { current: null, boards: [] };
      boards = list.boards;
      const find = (id: unknown) => list.boards.find((s) => s.id === id);
      // Your own board after a reload or Back: this tab keeps its id in its
      // history, next to the link and not in it. Without that (a browser that
      // lost the tab's history), the link must draw the board you had open.
      let own = find(history.state?.board);
      // A reload opens the step you were on; a link, a QR code or a board from My boards opens step 1.
      const was = Number(history.state?.step) || 0;
      const last = find(list.current);
      if (!own && last && (!shared || (await encode(last.board)) === (await encode(shared)))) own = last;
      if (own) open(own.board, own.id);
      else if (shared) open(shared, null);
      if (own || shared) step = Math.min(was, board.frames.length - 1);
      else {
        // The board you had on workers.dev, only on a device without boards
        // here, and only if you changed it (an untouched lineup says nothing).
        const moved = list.boards.length ? undefined : movedBoard();
        if (moved && !store.isUntouchedDefault(moved)) board = moved;
        else open(board, null, true);
      }
      if (shared === null) show(strings[own ? "board.invalidLink" : "board.invalidLinkDefault"], true);
      loaded = true;
    })();

    // A pasted link in the same tab only changes the fragment.
    // Back to one of your boards brings its id along; anything else is a received board.
    const onHash = async () => {
      const own = readList()?.boards.find((s) => s.id === history.state?.board);
      const was = Number(history.state?.step) || 0;
      const shared = own ? undefined : await fromHash();
      if (own) open(own.board, own.id);
      else if (shared) open(shared, null);
      else if (shared === null && !reloadForNewer()) show(strings["board.invalidLink"], true);
      if (own || shared) step = Math.min(was, board.frames.length - 1);
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  });

  // Every change lands in the URL, so a copied address bar always has the
  // latest board, and every real change in My boards.
  $effect(() => {
    if (!loaded) return;
    const now = board;
    const timer = setTimeout(async () => {
      const link = await encode(now);
      if (now !== kept && link !== (await keptLink)) {
        if (board !== now) return; // changed meanwhile: the next run saves it
        save(now, link);
      }
      try {
        history.replaceState({ ...history.state, board: current, step }, "", `#t=${link}`);
      } catch {
        // Safari throttles replaceState (100 calls per 30 s); the next change retries.
      }
    }, 300);
    return () => clearTimeout(timer);
  });

  // The step on the court, next to the board's id: a reload opens it again.
  $effect(() => {
    const now = step;
    if (!loaded) return;
    try {
      history.replaceState({ ...history.state, step: now }, "");
    } catch {
      // Throttled: the next save writes it.
    }
  });

  // ===== My boards =====

  /** The list in localStorage; null without storage (private mode, blocked). */
  function readList(): store.Store | null {
    try {
      return store.read(localStorage);
    } catch {
      return null;
    }
  }

  /** Changes the list in localStorage (see store.update()) and shows the result. */
  function change(run: (storage: Storage) => store.Store) {
    try {
      boards = run(localStorage).boards;
    } catch {
      // Storage full or blocked: the URL still holds the board.
    }
  }

  function keep(next: Board, link: string | Promise<string> = encode(next)) {
    kept = next;
    keptLink = Promise.resolve(link);
  }

  /** Saves the board on the court: a new board gets an id and goes first. */
  function save(next: Board, link: string) {
    keep(next, link);
    const id = (current ??= store.newId());
    change((storage) => store.saveBoard(storage, id, next));
  }

  /**
   * Saves the board on the court if it changed since it was kept, before
   * another board takes its place: its save may still be waiting (300 ms).
   */
  function flush() {
    const [left, was, id] = [board, keptLink, current];
    if (!loaded || left === kept) return;
    encode(left).then(async (link) => {
      if (link !== (await was)) change((storage) => store.saveBoard(storage, id ?? store.newId(), left, false));
    });
  }

  /** Puts a board on the court with its own undo history: one of yours (`id`), or one not saved yet (`fresh`: a new one). */
  function open(next: Board, id: string | null, fresh = false) {
    stopPlaying();
    flush();
    isNew = fresh;
    editingText = false;
    board = next;
    step = 0;
    keep(next);
    current = id;
    past = [];
    selected = null;
    try {
      history.replaceState({ ...history.state, board: id, step: 0 }, "");
    } catch {
      // Throttled: the next save writes it.
    }
    if (id) change((storage) => store.update(storage, (list) => ({ ...list, current: id })));
  }

  /** Saves the board on the court now if its save (300 ms) is still waiting: as that save would, under its own id. */
  async function saveNow() {
    const now = board;
    if (!loaded || now === kept) return;
    const link = await encode(now);
    if (board === now && link !== (await keptLink)) save(now, link);
  }

  /** Export all boards: one file of links, downloaded. The board on the court goes in with its latest change. */
  async function exportAll() {
    await saveNow();
    const editor = new URL("..", location.origin + links.link);
    const text = await store.exportFile(readList()?.boards ?? boards, `${editor}#t=`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    // Swedish writes the date as 2026-10-09, in local time.
    a.download = strings["board.exportFile"].replace("{date}", new Date().toLocaleDateString("sv"));
    a.click();
    // Safari on the iPhone asks first whether to download; revoke late, as FileSaver.js does.
    setTimeout(() => URL.revokeObjectURL(a.href), 40_000);
  }

  /** Adds the boards in an exported file to My boards, leaving out those already there; nothing is overwritten. */
  async function importBoards(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ""; // so the same file can be chosen again
    if (!file) return;
    const found = await store.importFile(await file.text());
    if (!found.length) return show(strings["board.importNone"]);
    let added: store.Saved[] = [];
    try {
      boards = store.update(localStorage, (list) => {
        added = store.newOnly(list.boards, found);
        return { ...list, boards: [...added, ...list.boards] };
      }).boards;
    } catch {
      return show(strings["board.importFailed"]);
    }
    show(
      added.length === 0
        ? strings["board.importKnown"]
        : added.length === 1
          ? strings["board.importedOne"]
          : strings["board.imported"].replace("{count}", String(added.length)),
    );
  }

  function openList() {
    menuOpen = false;
    listDialog.showModal();
    listOpen = true;
  }

  function newBoard() {
    menuOpen = false;
    listDialog.close();
    open(structuredClone(defaultLineup), null, true);
  }

  function openSaved(s: store.Saved) {
    listDialog.close();
    open(s.board, s.id);
  }

  /** Closes the ⋯ menu a button or field sits in. */
  function closeMenu(e?: Event) {
    const menu = (e?.currentTarget as Element | undefined)?.closest("details");
    if (menu) menu.open = false;
  }

  function duplicate(s: store.Saved, e: Event) {
    closeMenu(e);
    const copy = store.copyOf(s, strings["board.copySuffix"]);
    change((storage) => store.update(storage, (list) => ({ ...list, boards: store.put(list.boards, copy) })));
  }

  function deleteSaved(s: store.Saved, e: Event) {
    closeMenu(e);
    const wasOpen = s.id === current;
    change((storage) => store.deleteBoard(storage, s.id));
    if (wasOpen) {
      kept = board; // deleted: not to be saved again on the way out
      open(structuredClone(defaultLineup), null, true);
    }
    show(strings["board.deleted"], false, {
      label: strings["board.undo"],
      run() {
        change((storage) => store.update(storage, (list) => ({ ...list, boards: store.put(list.boards, s) })));
        if (wasOpen) open(s.board, s.id);
      },
    });
  }

  function moveTo(s: store.Saved, folder: string, e?: Event) {
    closeMenu(e);
    change((storage) =>
      store.update(storage, (list) => ({
        ...list,
        boards: list.boards.map((b) => (b.id === s.id ? store.withFolder(b, folder) : b)),
      })),
    );
  }

  /** Enter or leaving the field keeps a folder name; Escape drops it (and keeps the list open). */
  function finishFolder(e: Event, keepName: boolean) {
    const name = (e.currentTarget as HTMLInputElement).value;
    const s = boards.find((b) => b.id === naming);
    const from = renaming;
    naming = renaming = null;
    if (!keepName) return;
    if (s) moveTo(s, name, e);
    else if (from !== null) {
      change((storage) => store.update(storage, (list) => ({ ...list, boards: store.renameFolder(list.boards, from, name) })));
    }
  }

  function folderKey(e: KeyboardEvent) {
    if (e.key === "Enter") finishFolder(e, true);
    else if (e.key === "Escape") {
      e.preventDefault();
      finishFolder(e, false);
    }
  }

  /** Folders first, the most recently changed first, then the boards without one. */
  const folders = $derived(store.folders(boards));
  const groups = $derived.by(() => {
    const sorted = store.byDate(boards);
    return [...folders, undefined]
      .map((folder) => [folder, sorted.filter((s) => s.folder === folder)] as const)
      .filter(([, list]) => list.length > 0);
  });

  const titleOf = (s: store.Saved) => s.board.title ?? strings["board.untitled"];
  const moreFor = (s: store.Saved) =>
    s.board.title ? strings["board.moreFor"].replace("{title}", s.board.title) : strings["board.moreForUntitled"];
  const date = (at: number) =>
    new Date(at).toLocaleDateString(document.documentElement.lang, { day: "numeric", month: "short" });

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
    return (
      nearestPiece(frame, at, HIT_R, board.cones) ??
      (drawn?.kind === "arrow" ? drawn : nearestPiece(frame, at, tapReach(), board.cones))
    );
  }

  function onpointerdown(e: PointerEvent) {
    if (drag || !e.isPrimary || e.button > 0) return;
    // A tap on the court only closes an open menu.
    if (menuOpen) return void (menuOpen = false);
    // A tap on the court while playing only stops it.
    if (playing) return stopPlaying();
    keepText();
    const at = toCourt(e);
    let hit = hitAt(e.target, at);
    // With Arrow, a press on a player is for them, also under a handle: a pass
    // ends on its receiver, whose drag is the next pass. Move keeps the handle.
    if (tool === "arrow" && hit?.kind === "handle") hit = nearestPiece(frame, at, HIT_R) ?? hit;
    stage.setPointerCapture(e.pointerId);

    if (hit?.kind === "handle" && selected?.kind === "arrow") {
      drag = { type: "handle", index: selected.index, handle: hit.index as 0 | 1 | 2, start: board, moved: false };
    } else if (tool === "arrow") {
      // A tap picks the piece; a drag draws. From a player, a run of theirs:
      // it starts where they are by then, at the end of their run if they
      // already have one; a pass if they received one. From the ball, a pass
      // of whoever has it.
      const ball = hit?.kind === "ball" ? frame.balls[hit.index] : undefined;
      const player = hit?.kind === "player" ? hit.index : ball && holder(frame, ball, tapReach());
      const from: XY = player !== undefined ? edit.endOf(frame, player) : ball ? [...ball] : at;
      const pass = ball || (hit?.kind === "player" && edit.hasBall(frame, hit.index));
      drag = { type: "draw", kind: pass ? "pass" : "run", from, player, hit: hit as Selection | null, origin: at, moved: false };
    } else if (hit?.kind === "player" || hit?.kind === "ball" || hit?.kind === "cone") {
      const piece = hit as Selection;
      const pos = hit.kind === "player" ? frame.players[hit.index]!.at : hit.kind === "ball" ? frame.balls[hit.index]! : board.cones[hit.index]!;
      drag = { type: "piece", piece, start: board, offset: [pos[0] - at[0], pos[1] - at[1]], origin: at, moved: false };
    } else if (hit?.kind === "arrow") {
      drag = { type: "arrow", index: hit.index, start: board, origin: at, moved: false };
    } else {
      // A new piece isn't selected: a bar for it would cover the court where the next one goes.
      selected = null;
      if (tool === "attack" || tool === "defence") commit(edit.addPlayer(board, tool === "attack" ? "a" : "d", at));
      else if (tool === "ball") commit(edit.addBall(board, step, at));
      else if (tool === "cone") commit(edit.addCone(board, at));
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

  /**
   * The arrow a draw released at `at` makes. A pass of a player into a goal
   * is a shot. Else, released on (or near) a player, where they stand or
   * where their run ends, the arrow ends there.
   */
  function arrowTo(d: Extract<Drag, { type: "draw" }>, at: XY): Parameters<typeof edit.addArrow> {
    const shot = d.kind === "pass" && d.player !== undefined && inGoal(board, at, tapReach());
    const spots = [...frame.players, ...frame.players.map((p, i) => ({ ...p, at: edit.endOf(frame, i) }))];
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
      // A start let go on a player gives the arrow to that player.
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
    if ((e.target as Element).closest("input, textarea")) return;
    if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      undo();
    } else if ((e.key === "Delete" || e.key === "Backspace") && selected) {
      e.preventDefault();
      remove();
    } else if (e.key === "Escape") {
      selected = null;
      menuOpen = false;
    } else if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    } else if (tools[+e.key - 1]) {
      tool = tools[+e.key - 1]!.id;
    } else if (e.key === "n" || e.key === "N") {
      newStep();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const i = step + (e.key === "ArrowRight" ? 1 : -1);
      if (board.frames[i]) goTo(i);
    }
  }

  // ===== Actions =====

  function remove() {
    if (!selected) return;
    commit(edit.removeSelected(board, step, selected));
    selected = null;
  }

  /**
   * Clearing, the court size, the default lineup or an empty court. Stops
   * playing first, and keeps the step on the court within the board: the
   * default lineup and an empty court have one step.
   */
  function clearWith(next: Board) {
    stopPlaying();
    keepText();
    commit(next);
    step = Math.min(step, board.frames.length - 1);
    selected = null;
    menuOpen = false;
  }

  function toggleCourt() {
    clearWith(edit.setCourt(board, board.court === "half" ? "full" : "half"));
  }

  // ===== Title =====

  /** Enter, or a tap elsewhere, keeps what was typed; Escape leaves first, so the blur after it keeps nothing. */
  function saveTitle(e: Event) {
    if (!editingTitle) return;
    editingTitle = false;
    commit(edit.setTitle(board, (e.currentTarget as HTMLInputElement).value));
  }

  function titleKey(e: KeyboardEvent) {
    if (e.key === "Enter") saveTitle(e);
    else if (e.key === "Escape") editingTitle = false;
  }

  function focusTitle(input: HTMLInputElement) {
    input.focus();
    input.select();
  }

  // ===== Sharing =====

  async function shareUrl(via: "link" | "qr") {
    return `${location.origin}${links[via]}#t=${await encode(board)}`;
  }

  async function share() {
    keepText();
    const url = await shareUrl("link");
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
    let renderSVG: (typeof import("../../lib/board/qr"))["renderSVG"];
    try {
      ({ renderSVG } = await loadQr());
    } catch {
      qrLibrary = undefined; // Try again next time.
      show(strings["board.qrFailed"]);
      return;
    }
    menuOpen = false;
    const url = await shareUrl("qr");
    try {
      qr = renderSVG(url, { ecc: "L", border: 2 });
    } catch {
      // Over version 40: no QR code holds it.
      return show(strings["board.qrTooLarge"]);
    }
    qrLarge = url.length > QR_SCANNED;
    qrDialog.showModal();
  }

  async function copyJson() {
    menuOpen = false;
    await navigator.clipboard.writeText(JSON.stringify(board));
    show("Board JSON copied.");
  }
</script>

<svelte:window {onkeydown} />

<div class="editor">
  <div class="titlebar" role="toolbar" aria-label={strings["board.actions"]}>
    <a class="icon home" href={home} aria-label={strings["board.home"]} title={strings["board.home"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.court} /></svg>
    </a>
    {#if editingTitle}
      <input
        class="title"
        value={board.title ?? ""}
        maxlength={MAX_TITLE}
        enterkeyhint="done"
        aria-label={strings["board.editTitle"]}
        use:focusTitle
        onkeydown={titleKey}
        onblur={saveTitle}
      />
    {:else}
      <button type="button" class="title" class:empty={!board.title} title={strings["board.editTitle"]} onclick={() => (editingTitle = true)}>
        <span>{board.title ?? strings["board.addTitle"]}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.draw} /></svg>
      </button>
    {/if}
    <button type="button" class="icon" onclick={undo} disabled={past.length === 0} title={strings["board.undo"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.undo} /></svg>
      <span class="label">{strings["board.undo"]}</span>
    </button>
    <button type="button" class="share" onclick={share}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.share} /></svg>
      <span>{strings["board.share"]}</span>
    </button>
    <details class="menu" bind:open={menuOpen}>
      <summary class="icon" title={strings["board.more"]}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.more} /></svg>
        <span class="label">{strings["board.more"]}</span>
      </summary>
      <div class="menu-panel">
        <button type="button" onclick={openList}>{strings["board.myBoards"]}</button>
        <button type="button" class="last" onclick={newBoard}>{strings["board.newBoard"]}</button>
        <button type="button" onclick={showQr}>{strings["board.qr"]}</button>
        {#if board.frames.length > 1}
          <button type="button" onclick={removeStep}>{strings["board.removeStep"]}</button>
        {/if}
        <button type="button" onclick={toggleCourt}>{board.court === "half" ? strings["board.fullCourt"] : strings["board.halfCourt"]}</button>
        <button type="button" onclick={() => clearWith(edit.clearArrows(board, step))}>{strings["board.clearArrows"]}</button>
        <button type="button" onclick={() => clearWith(edit.resetLineup(defaultLineup))}>{strings["board.resetLineup"]}</button>
        <button type="button" onclick={() => clearWith(edit.emptyCourt(board))}>{strings["board.emptyCourt"]}</button>
        {#if import.meta.env.DEV}
          <button type="button" onclick={copyJson}>JSON (dev)</button>
        {/if}
      </div>
    </details>
  </div>

  <!-- The steps: one button per step, New step. Wide, each button has its sentence beside it. -->
  <div class="steps" role="toolbar" aria-label={strings["board.steps"]}>
    {#each board.frames as f, i (i)}
      <div class="step" class:on={i === step}>
        <button type="button" class="chip" aria-pressed={i === step} title={strings["board.step"].replace("{n}", String(i + 1))} onclick={() => goTo(i)}>{i + 1}</button>
        {#if i === step}
          {@render sentence()}
        {:else}
          <button type="button" class="said" tabindex="-1" aria-hidden="true" onclick={() => goTo(i)}><span>{f.text ?? ""}</span></button>
        {/if}
      </div>
    {/each}
    <button
      type="button"
      class="new"
      onclick={newStep}
      disabled={board.frames.length >= MAX_STEPS}
      aria-label={strings["board.newStep"]}
      title="{strings['board.newStep']} (N)"
      aria-keyshortcuts="N"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.plus} /></svg>
      <span>{strings["board.newStep"]}</span>
    </button>
    <button
      type="button"
      class="play"
      onclick={play}
      disabled={board.frames.length < 2}
      aria-label={strings[playing ? "board.stop" : "board.play"]}
      title={strings[playing ? "board.stop" : "board.play"]}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={playing ? icons.stop : icons.play} /></svg>
    </button>
  </div>

  <!-- The sentence of the step on the court, below the steps (wide: in the list). -->
  <div class="text">{@render sentence()}</div>

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
    <Court board={shown ?? draft ?? board} frame={step} {selected} label={strings["board.court"]} />
  </div>

  <!-- Over the court's box (in landscape: under the title bar), so the court doesn't move when it comes and goes. -->
  {#if selected}
    <button type="button" class="delete" onclick={remove} title={strings["board.delete"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.delete} /></svg>
      <span>{strings["board.delete"]}</span>
    </button>
  {/if}

  {#if !listOpen}
    {@render noticeBar()}
  {/if}

  {#if strip}
    <div class="strip" role="toolbar" aria-label={strip.title}>
      {#if strip.heading}<span class="strip-title" aria-hidden="true">{strip.title}</span>{/if}
      <div class="strip-row">
        {#each strip.items as item (item.id)}
          <button type="button" class="tool" class:setup={item.on === undefined} aria-pressed={item.on} disabled={item.off} onclick={item.run}>
            {#if item.icon}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} stroke-dasharray={item.dash ? "3 3" : undefined} /></svg>
            {:else if item.team}
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" class={item.team} /></svg>
            {/if}
            <span>{item.label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="bar tools" role="toolbar" aria-label={strings["board.tools"]}>
    {#each tools as t, i (t.id)}
      <button
        type="button"
        class="tool"
        aria-pressed={tool === t.id}
        title="{t.label} ({i + 1})"
        aria-keyshortcuts={String(i + 1)}
        onclick={() => (tool = t.id)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#if t.id === "attack" || t.id === "defence"}
            <circle cx="12" cy="12" r="8" class={t.id} />
          {:else if t.id === "ball"}
            <circle cx="12" cy="12" r="6" class="ball" />
          {:else}
            <path d={icons[t.id === "arrow" ? "run" : t.id]} class={t.id} />
          {/if}
        </svg>
        <span>{t.label}</span>
      </button>
    {/each}
  </div>
</div>

{#snippet sentence()}
  {#if editingText}
    <input
      class="line"
      value={typed}
      maxlength={MAX_TEXT}
      enterkeyhint="done"
      aria-label={strings["board.editText"]}
      use:focusTitle
      oninput={(e) => (typed = e.currentTarget.value)}
      onkeydown={textKey}
      onblur={keepText}
    />
  {:else}
    <button type="button" class="line" class:empty={!frame.text} title={strings["board.editText"]} onclick={editText}>
      <span>{frame.text ?? strings["board.addText"]}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.draw} /></svg>
    </button>
  {/if}
{/snippet}

{#snippet noticeBar()}
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
      {#if noticeAction}
        {@const action = noticeAction}
        <button type="button" class="action" onclick={() => (action.run(), dismiss())}>{action.label}</button>
      {/if}
      <button type="button" class="dismiss" onclick={dismiss} aria-label={strings["board.dismiss"]}>×</button>
    </div>
  {/if}
{/snippet}

<dialog
  class="boards"
  bind:this={listDialog}
  aria-labelledby="boards-title"
  onclose={() => {
    listOpen = false;
    naming = renaming = null;
  }}
>
  <div class="boards-bar">
    <h2 id="boards-title">{strings["board.myBoards"]}</h2>
    <button type="button" class="dismiss" onclick={() => listDialog.close()} aria-label={strings["board.close"]}>×</button>
  </div>
  <!-- Below the bar; in landscape in it (BoardEditor.css), so more boards fit. -->
  <button type="button" class="new" onclick={newBoard}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.plus} /></svg>
    {strings["board.newBoard"]}
  </button>
  {#if listOpen}
    {@render noticeBar()}
  {/if}
  {#if boards.length === 0}
    <p class="empty">{strings["board.noBoards"]}</p>
  {/if}
  {#each groups as [folder, list] (folder ?? "")}
    <h3>
      {#if folder === undefined}
        {strings["board.noFolder"]}
      {:else if renaming === folder}
        <input
          value={folder}
          maxlength={store.MAX_FOLDER}
          aria-label={strings["board.folderName"]}
          use:focusTitle
          onkeydown={folderKey}
          onblur={(e) => renaming !== null && finishFolder(e, true)}
        />
      {:else}
        <button type="button" title={strings["board.renameFolder"]} onclick={() => (renaming = folder)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.folder} /></svg>
          {folder}
        </button>
      {/if}
    </h3>
    <ul>
      {#each list as s (s.id)}
        <li class:current={s.id === current}>
          <button type="button" class="open" onclick={() => openSaved(s)}>
            <span class="thumb" aria-hidden="true"><Court board={s.board} label={titleOf(s)} /></span>
            <span class="name">{titleOf(s)}</span>
            <time datetime={new Date(s.at).toISOString()}>{date(s.at)}</time>
          </button>
          <details class="actions">
            <summary aria-label={moreFor(s)} title={moreFor(s)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.more} /></svg>
            </summary>
            <div class="actions-panel">
              <button type="button" onclick={(e) => duplicate(s, e)}>{strings["board.duplicate"]}</button>
              <p>{strings["board.folder"]}</p>
              {#each ["", ...folders] as f (f)}
                <button type="button" aria-pressed={(s.folder ?? "") === f} onclick={(e) => moveTo(s, f, e)}>
                  {#if (s.folder ?? "") === f}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.check} /></svg>{/if}
                  {f || strings["board.noFolder"]}
                </button>
              {/each}
              {#if naming === s.id}
                <input
                  maxlength={store.MAX_FOLDER}
                  aria-label={strings["board.folderName"]}
                  use:focusTitle
                  onkeydown={folderKey}
                  onblur={(e) => naming !== null && finishFolder(e, true)}
                />
              {:else}
                <button type="button" onclick={() => (naming = s.id)}>{strings["board.newFolder"]}</button>
              {/if}
              <button type="button" class="delete-board" onclick={(e) => deleteSaved(s, e)}>{strings["board.delete"]}</button>
            </div>
          </details>
        </li>
      {/each}
    </ul>
  {/each}
  <!-- After the list: you use it now and then, the list every training. -->
  <div class="backup">
    {#if boards.length}
      <p>{strings["board.exportHint"]}</p>
      <button type="button" onclick={exportAll}>{strings["board.exportAll"]}</button>
    {/if}
    <label>
      {strings["board.import"]}
      <input type="file" accept=".json,application/json" onchange={importBoards} />
    </label>
  </div>
</dialog>

<dialog class="qr" bind:this={qrDialog} aria-label={strings["board.qr"]} onclose={() => (qr = null)}>
  <button type="button" class="dismiss close" onclick={() => qrDialog.close()} aria-label={strings["board.close"]}>×</button>
  {#if qr}
    <div class="code">{@html qr}</div>
    <p>{strings[qrLarge ? "board.qrLarge" : "board.qrHint"]}</p>
  {/if}
</dialog>
