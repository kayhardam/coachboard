<!--
  The lite viewer (on /[lang]/lite/v/), where a lite share link or QR code
  opens: the board in #t= step by step, Previous / Play / Next, and a link to
  open it in the lite editor. It changes nothing. Every link the board's own
  viewer opens, it opens too: same decode(), same "2." links.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { ViewerStrings } from "../../i18n/ui";
  import { decode, type Board } from "../../lib/board/format";
  import { reloadForNewer } from "../../lib/board/newer";
  import { moment } from "../../lib/board/play";
  import { moveFor, moves, stillFor } from "../../lib/board/viewer";
  import { viewerIcons as icons } from "../../lib/viewerIcons";
  import Court from "../board/Court.svelte";

  /** `editor`: the lite editor's path, where the "Edit a copy" link opens this board. */
  let { strings, home, editor }: { strings: ViewerStrings; home: string; editor: string } = $props();

  /** The court of a link that doesn't open: empty, as in the fallback. */
  const EMPTY: Board = { v: 2, court: "half", cones: [], frames: [{ players: [], balls: [], arrows: [] }] };

  let board = $state.raw<Board | null>(null);
  let link = $state("");
  let broken = $state(false);
  let step = $state(0);
  let ended = $state(false);
  let shown = $state.raw<Board | null>(null);
  let playing = $state<"all" | "next" | null>(null);
  let frameRequest = 0;

  const last = $derived((board?.frames.length ?? 1) - 1);
  const frame = $derived(board?.frames[step]);
  const moving = $derived(board ? board.frames.map((_, i) => moves(board!, i)) : []);
  const done = $derived(!board || ended || (step === last && !moving[last]));

  /** Step `i` at `t` (0 to 1) of its move. */
  function at(i: number, t: number): Board {
    const b = board!;
    return { ...b, frames: b.frames.map((f, j) => (j === i ? moment(b, i, t) : f)) };
  }

  function halt() {
    cancelAnimationFrame(frameRequest);
    playing = null;
  }

  /** Puts step `i` on the court, still; with `end`, where its arrows take everyone. */
  function show(i: number, end = false) {
    halt();
    step = i;
    ended = end;
    shown = end ? at(i, 1) : null;
  }

  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Moves the step on the court along its arrows to the next one; with `all`, every step from here on. */
  function run(all: boolean) {
    const still = reduce();
    let start = performance.now();
    const tick = (now: number) => {
      const f = board!.frames[step]!;
      const move = moving[step] ? moveFor(f) : 0;
      const since = now - start - (all ? stillFor(f) : 0);
      const t = move ? since / move : since >= 0 ? 1 : 0;
      if (t >= 1) {
        if (step >= last) return show(step, moving[step]);
        step++;
        shown = null;
        if (!all) return halt();
        start = now;
      } else if (t > 0 && !still) {
        shown = at(step, t);
      }
      frameRequest = requestAnimationFrame(tick);
    };
    frameRequest = requestAnimationFrame(tick);
  }

  function play() {
    if (!board) return;
    if (playing === "all") return show(step);
    show(0);
    playing = "all";
    run(true);
  }

  function next() {
    if (done) return;
    if (playing || reduce() || !moving[step]) return step >= last ? show(step, true) : show(step + 1);
    playing = "next";
    run(false);
  }

  function prev() {
    if (!board) return;
    show(ended || playing === "next" ? step : Math.max(0, step - 1));
  }

  async function load() {
    halt();
    // Nothing to show here: the lite editor.
    if (!location.hash.startsWith("#t=")) return location.replace(editor);
    link = decodeURIComponent(location.hash.slice(3));
    const opened = await decode(link);
    if (!opened && reloadForNewer(link)) return;
    board = opened;
    broken = !opened;
    show(0);
  }

  onMount(() => {
    load();
    addEventListener("hashchange", load);
    return () => removeEventListener("hashchange", load);
  });

  function onkeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  }
</script>

<svelte:window {onkeydown} />

<div class="lite viewer-lite">
  <header class="top">
    <a class="home" href={home} aria-label={strings["board.home"]} title={strings["board.home"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.court} /></svg>
    </a>
    {#if board?.title}<h2 class="title">{board.title}</h2>{/if}
    {#if board}
      <a class="edit" href="{editor}#t={link}" aria-label={strings["viewer.edit"]} title={strings["viewer.edit"]}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.draw} /></svg>
        <span>{strings["viewer.edit"]}</span>
      </a>
    {/if}
  </header>

  <div class="text">
    {#if board && last > 0}
      {@const where = strings["viewer.step"].replace("{n}", String(step + 1)).replace("{count}", String(last + 1))}
      <span class="count" title={where}><span aria-hidden="true">{step + 1}/{last + 1}</span><span class="visually-hidden">{where}</span></span>
    {/if}
    <p aria-live="polite">{broken ? strings["viewer.broken"] : (frame?.text ?? "")}</p>
  </div>

  <!-- A tap on the court while something moves stops it. -->
  <div class="stage" role="presentation" onpointerdown={() => playing && show(step)}>
    <Court board={shown ?? board ?? EMPTY} frame={step} theme="chalk" label={strings["board.court"]} />
  </div>

  <div class="controls">
    <button type="button" class="prev" onclick={prev} disabled={!board || (step === 0 && !ended && !playing)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.prev} /></svg>
      <span>{strings["viewer.prev"]}</span>
    </button>
    <button type="button" class="play" onclick={play} disabled={!board || (last === 0 && !moving[0])}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={playing === "all" ? icons.stop : icons.play} /></svg>
      <span>{strings[playing === "all" ? "board.stop" : "board.play"]}</span>
    </button>
    <button type="button" class="next" onclick={next} disabled={done}>
      <span>{strings["viewer.next"]}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.next} /></svg>
    </button>
  </div>
</div>
