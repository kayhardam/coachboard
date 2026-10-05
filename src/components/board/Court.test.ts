import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { defaultBoard } from "../../lib/board/defaults";
import fullLineup from "../../lib/board/fixtures/v1-full-lineup.json";
import { settle, toBoard, type Board } from "../../lib/board/format";
import Court from "./Court.svelte";

const count = (html: string, text: string) => html.split(text).length - 1;
const full = toBoard(fullLineup.board)!;

describe("Court", () => {
  it("renders the default lineup without browser APIs", () => {
    const { body } = render(Court, { props: { board: defaultBoard } });
    expect(body).toContain("<svg");
    expect(body).not.toContain("<script");
    expect(count(body, 'data-kind="player"')).toBe(13);
    expect(count(body, 'data-kind="ball"')).toBe(1);
    expect(count(body, 'data-kind="arrow"')).toBe(0);
    expect(body).toContain('viewBox="-8 -14 216 222"');
  });

  it("draws both goals and the arrows on a full court", () => {
    const { body } = render(Court, { props: { board: full } });
    expect(count(body, 'data-kind="arrow"')).toBe(6);
    expect(count(body, "stroke-dasharray=\"4 3\"")).toBe(2 + 2); // two 9 m lines, two passes
    expect(body).toContain('viewBox="-8 -14 216 428"');
  });

  it("shows handles only for a selected arrow", () => {
    const none = render(Court, { props: { board: full } }).body;
    const picked = render(Court, { props: { board: full, selected: { kind: "arrow", index: 1 } } }).body;
    expect(count(none, 'data-kind="handle"')).toBe(0);
    expect(count(picked, 'data-kind="handle"')).toBe(3);
  });

  it("draws passers, cones, balls and every kind of arrow", () => {
    const board: Board = settle({
      v: 2,
      court: "half",
      cones: [[70, 120], [130, 120]],
      frames: [
        {
          players: [
            { team: "a", label: "LO", at: [40, 150] },
            { team: "p", at: [20, 70] },
          ],
          balls: [[46, 145], [26, 66]],
          arrows: [
            { kind: "run", from: 0, pts: [[0, 0], [70, 112]] },
            { kind: "shot", from: 0, pts: [[0, 0], [90, 0]] },
            { kind: "block", pts: [[100, 80], [118, 72]] },
            { kind: "bounce", from: 1, pts: [[0, 0], [40, 150]] },
          ],
        },
      ],
    });
    const { body } = render(Court, { props: { board } });
    expect(count(body, 'data-kind="cone"')).toBe(2);
    expect(count(body, 'data-kind="ball"')).toBe(2);
    expect(count(body, 'fill="#2563eb"')).toBe(1); // the passer
    expect(count(body, 'data-kind="arrow"')).toBe(4);
    expect(count(body, 'stroke-width="4.2"')).toBe(1); // the shot's double line
    expect(count(body, "-head)")).toBe(3); // every arrow but the block has a head
    expect(count(body, 'r="1.8"')).toBe(1); // where the bounce touches the floor
    // A shot moves only its end; an arrow of a player has no start handle.
    const handles = (index: number) =>
      count(render(Court, { props: { board, selected: { kind: "arrow", index } } }).body, 'data-kind="handle"');
    expect([0, 1, 2, 3].map(handles)).toEqual([2, 1, 3, 2]);
  });

  it("gives each instance its own marker id (Astro sets idPrefix per component)", () => {
    const id = (idPrefix: string) =>
      render(Court, { props: { board: full }, idPrefix }).body.match(/id="([^"]+)-head"/)![1];
    expect(id("s0")).not.toBe(id("s1"));
  });
});
