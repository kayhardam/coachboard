<!--
  Draws a board as SVG. Pure: no browser APIs, so Astro can render it
  statically (tactic pages, the board's no-JS fallback) and BoardEditor can
  wrap it. Pieces carry data-kind / data-index for the editor's pointer
  handling.
-->
<script lang="ts">
  import type { Selection } from "../../lib/board/edit";
  import { COURT_WIDTH, type Board } from "../../lib/board/format";
  import {
    arrowMid,
    arrowPath,
    areaPath,
    BALL_R,
    HIT_R,
    PLAYER_R,
    POST_LEFT,
    POST_RIGHT,
  } from "../../lib/board/geometry";

  interface Props {
    board: Board;
    frame?: number;
    selected?: Selection | null;
    label?: string;
  }

  let { board, frame = 0, selected = null, label = "Handball court" }: Props = $props();

  const uid = $props.id();
  const current = $derived(board.frames[frame] ?? board.frames[0]!);
  const length = $derived(board.court === "full" ? 400 : 200);
  const goals = $derived(board.court === "full" ? [0, 400] : [0]);
  const viewBox = $derived(`-8 -14 ${COURT_WIDTH + 16} ${length + 14 + (length === 400 ? 14 : 8)}`);

  const colors = {
    court: "#f1f5f9",
    area: "#dbe4ee",
    line: "#64748b",
    ink: "#0f172a",
    attack: "#15803d",
    defence: "#0f172a",
    ball: "#f59e0b",
    ballEdge: "#78350f",
    select: "#16a34a",
  };

  /** Stop an arrow short when it ends on a player, so its head stays visible. */
  function trimFor(end: [number, number]): number {
    const onPlayer = current.players.some(
      (p) => Math.hypot(p.at[0] - end[0], p.at[1] - end[1]) <= PLAYER_R + 2,
    );
    return onPlayer ? PLAYER_R + 1.5 : 0;
  }

  const arrows = $derived(
    current.arrows.map((a) => ({
      kind: a.kind,
      d: arrowPath(a, trimFor(a.pts[a.pts.length - 1]!)),
      hit: arrowPath({ ...a, kind: "run" }),
    })),
  );

  const handles = $derived.by(() => {
    if (selected?.kind !== "arrow") return [];
    const a = current.arrows[selected.index];
    if (!a) return [];
    return [a.pts[0]!, arrowMid(a), a.pts[a.pts.length - 1]!];
  });
</script>

<svg {viewBox} role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="{uid}-court">
      <rect x="0" y="0" width={COURT_WIDTH} height={length} />
    </clipPath>
    <marker
      id="{uid}-head"
      viewBox="0 0 10 10"
      refX="7"
      refY="5"
      markerWidth="3.5"
      markerHeight="3.5"
      orient="auto-start-reverse"
    >
      <path d="M0,0 L10,5 L0,10 z" fill={colors.ink} />
    </marker>
  </defs>

  <!-- Court -->
  <rect x="0" y="0" width={COURT_WIDTH} height={length} fill={colors.court} />
  <g clip-path="url(#{uid}-court)" fill="none" stroke={colors.line} stroke-width="1">
    {#each goals as goalY (goalY)}
      <path d={areaPath(60, goalY)} fill={colors.area} />
      <path d={areaPath(90, goalY)} stroke-dasharray="4 3" />
      <line
        x1="95"
        x2="105"
        y1={goalY === 0 ? 70 : 330}
        y2={goalY === 0 ? 70 : 330}
      />
    {/each}
    {#if length === 400}
      <line x1="0" x2={COURT_WIDTH} y1="200" y2="200" />
    {/if}
  </g>
  <rect
    x="0"
    y="0"
    width={COURT_WIDTH}
    height={length}
    fill="none"
    stroke={colors.line}
    stroke-width="1.2"
  />
  {#each goals as goalY (goalY)}
    <rect
      x={POST_LEFT}
      y={goalY === 0 ? -10 : 400}
      width={POST_RIGHT - POST_LEFT}
      height="10"
      fill="#ffffff"
      stroke={colors.ink}
      stroke-width="1.2"
    />
  {/each}

  <!-- Arrows -->
  {#each arrows as arrow, i (i)}
    <g data-kind="arrow" data-index={i}>
      <path d={arrow.hit} fill="none" stroke="transparent" stroke-width={HIT_R} />
      <path
        d={arrow.d}
        fill="none"
        stroke={colors.ink}
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-dasharray={arrow.kind === "pass" ? "4 3" : undefined}
        marker-end="url(#{uid}-head)"
      />
    </g>
  {/each}

  <!-- Players -->
  {#each current.players as player, i (i)}
    <g data-kind="player" data-index={i} transform="translate({player.at[0]} {player.at[1]})">
      <circle r={HIT_R} fill="transparent" />
      {#if selected?.kind === "player" && selected.index === i}
        <circle r={PLAYER_R + 3} fill="none" stroke={colors.select} stroke-width="1.5" />
      {/if}
      <circle
        r={PLAYER_R}
        fill={player.team === "a" ? colors.attack : colors.defence}
        stroke="#ffffff"
        stroke-width="1"
      />
      {#if player.label}
        <text
          y="0.5"
          fill="#ffffff"
          font-family="system-ui, sans-serif"
          font-size={player.label.length > 2 ? 6 : 7.5}
          font-weight="700"
          text-anchor="middle"
          dominant-baseline="central">{player.label}</text
        >
      {/if}
    </g>
  {/each}

  <!-- Balls -->
  {#each current.balls as ball, i (i)}
    <g data-kind="ball" data-index={i} transform="translate({ball[0]} {ball[1]})">
      <circle r={HIT_R} fill="transparent" />
      {#if selected?.kind === "ball" && selected.index === i}
        <circle r={BALL_R + 3} fill="none" stroke={colors.select} stroke-width="1.5" />
      {/if}
      <circle r={BALL_R} fill={colors.ball} stroke={colors.ballEdge} stroke-width="0.8" />
    </g>
  {/each}

  <!-- Handles of the selected arrow: start, bend, end -->
  {#each handles as [x, y], h (h)}
    <g data-kind="handle" data-index={h} transform="translate({x} {y})">
      <circle r={HIT_R} fill="transparent" />
      <circle
        r="3.5"
        fill="#ffffff"
        stroke={colors.select}
        stroke-width="1.5"
        stroke-dasharray={h === 1 ? "2 1.5" : undefined}
      />
    </g>
  {/each}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
    user-select: none;
    -webkit-user-select: none;
  }

  text {
    pointer-events: none;
  }
</style>
