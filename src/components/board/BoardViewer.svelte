<!--
  The viewer, loaded with client:only on /[lang]/board/link/ and
  /[lang]/board/qr/, where a shared link and a QR code open. It shows the
  board in #t= step by step: Previous, Play and Next, a legend, and "Edit a
  copy", which opens the editor. It changes nothing: no link, no My boards.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { ViewerStrings } from "../../i18n/ui";
  import { decode, type Board } from "../../lib/board/format";
  import { reloadForNewer } from "../../lib/board/newer";
  import { moment } from "../../lib/board/play";
  import { legendOf, moveFor, moves, stillFor, type LegendItem } from "../../lib/board/viewer";
  import { viewerIcons as icons } from "../../lib/viewerIcons";
  import Court from "./Court.svelte";

  /**
   * `home`: the home page, linked from the title bar.
   * `editor`: the board page, where "Edit a copy" opens this board.
   */
  let { strings, home, editor }: { strings: ViewerStrings; home: string; editor: string } = $props();

  /** Where "Edit a copy" leaves the link it opens, for the editor (BoardEditor.svelte). */
  const COPY_KEY = "coachboard.copy";
  /** The court of a link that doesn't open: empty, as in the fallback. */
  const EMPTY: Board = { v: 2, court: "half", cones: [], frames: [{ players: [], balls: [], arrows: [] }] };

  const labels: Record<LegendItem, keyof ViewerStrings> = {
    passer: "board.team.passer",
    cone: "board.tool.cone",
    run: "board.tool.run",
    pass: "board.tool.pass",
    bounce: "board.kind.bounce",
    dribble: "board.tool.dribble",
    shot: "board.kind.shot",
    block: "board.kind.block",
  };

  let board = $state.raw<Board | null>(null);
  /** The link in the address bar, as "Edit a copy" passes it on. */
  let link = $state("");
  let broken = $state(false);
  /** The step on the court. */
  let step = $state(0);
  /** Past the last step's move: everyone where its arrows take them (decision K8). */
  let ended = $state(false);
  /** What the court shows while moving or after the last move; null: the step itself. */
  let shown = $state.raw<Board | null>(null);
  /** Playing every step ("all"), or the move to the next step ("next"). */
  let playing = $state<"all" | "next" | null>(null);
  let frameRequest = 0;

  const last = $derived((board?.frames.length ?? 1) - 1);
  const frame = $derived(board?.frames[step]);
  const legend = $derived(board ? legendOf(board) : []);
  /** Per step, whether anything moves from it: if not, nothing waits for it. */
  const moving = $derived(board ? board.frames.map((_, i) => moves(board!, i)) : []);
  /** Next has nothing left to play: past the last move, or on a last step that doesn't move. */
  const done = $derived(!board || ended || (step === last && !moving[last]));

  /** Step `i` at `t` (0 to 1) of its move: the moment of play.ts in place of the step. */
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

  /**
   * Moves the step on the court along its arrows to the next one; with `all`,
   * every step from here on, each first still long enough to read (viewer.ts).
   * The last one ends where its arrows take everyone, and stays there. A step
   * where nothing moves gets no time to move. With reduced motion nothing
   * moves: the board goes from step to step.
   */
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

  /** Play: every step from the first. Tapped while playing, it stops on the step's start. */
  function play() {
    if (!board) return;
    if (playing === "all") return show(step);
    show(0);
    playing = "all";
    run(true);
  }

  /**
   * Next: the move to the next step; on the last step its own move (the shot),
   * after which the board stays there. Tapped while something moves, with
   * reduced motion, or on a step where nothing moves, it goes there at once.
   */
  function next() {
    if (done) return;
    if (playing || reduce() || !moving[step]) return step >= last ? show(step, true) : show(step + 1);
    playing = "next";
    run(false);
  }

  /** Previous: the step before; after the last move, or during a move, the start of this step. */
  function prev() {
    if (!board) return;
    show(ended || playing === "next" ? step : Math.max(0, step - 1));
  }

  async function load() {
    halt();
    // Nothing to show here: the editor, with your own board.
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
    // A link pasted in the address bar of this tab only changes the fragment.
    addEventListener("hashchange", load);
    return () => removeEventListener("hashchange", load);
  });

  function onkeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  }

  /** Edit a copy: the editor keeps this link in My boards at once (decision K4). */
  function copy() {
    try {
      sessionStorage.setItem(COPY_KEY, link);
    } catch {
      // No storage: the editor opens it as a received board, kept at its first change.
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="viewer">
  <div class="titlebar">
    <a class="home" href={home} aria-label={strings["board.home"]} title={strings["board.home"]}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.court} /></svg>
    </a>
    {#if board?.title}<h2 class="title">{board.title}</h2>{/if}
    {#if board}
      <a class="edit" href="{editor}#t={link}" onclick={copy} aria-label={strings["viewer.edit"]} title={strings["viewer.edit"]}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.draw} /></svg>
        <span>{strings["viewer.edit"]}</span>
      </a>
    {/if}
  </div>

  <div class="text">
    {#if board && last > 0}
      {@const where = strings["viewer.step"].replace("{n}", String(step + 1)).replace("{count}", String(last + 1))}
      <span class="count" title={where}><span aria-hidden="true">{step + 1}/{last + 1}</span><span class="visually-hidden">{where}</span></span>
    {/if}
    <p aria-live="polite">{broken ? strings["viewer.broken"] : (frame?.text ?? "")}</p>
    <!-- Wide: every step with its sentence; a tap goes there (decision K10, W2). -->
    {#if board && last > 0}
      <ol class="all" aria-label={strings["board.steps"]}>
        {#each board.frames as f, i (i)}
          <li>
            <button type="button" aria-current={i === step ? "step" : undefined} onclick={() => show(i)}>
              <b>{i + 1}</b><span>{f.text ?? ""}</span>
            </button>
          </li>
        {/each}
      </ol>
    {/if}
  </div>

  <!-- A tap on the court while something moves stops it. -->
  <div class="stage" role="presentation" onpointerdown={() => playing && show(step)}>
    <Court board={shown ?? board ?? EMPTY} frame={step} label={strings["board.court"]} />
  </div>

  <ul class="legend" aria-label={strings["viewer.legend"]}>
    {#each legend as item (item)}
      <li>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#if item === "passer"}
            <circle cx="12" cy="12" r="7" fill="#2563eb" stroke="none" />
          {:else if item === "cone"}
            <path d="M12 5 19 18H5z" fill="#dc2626" stroke="none" />
          {:else}
            <path d={icons[item]} stroke-dasharray={item === "pass" || item === "bounce" ? "3 3" : undefined} />
          {/if}
        </svg>
        {strings[labels[item]]}
      </li>
    {/each}
  </ul>

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
