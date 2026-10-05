import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { defaultBoard } from "../../lib/board/defaults";
import fullLineup from "../../lib/board/fixtures/v1-full-lineup.json";
import { toBoard } from "../../lib/board/format";
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

  it("gives each instance its own marker id (Astro sets idPrefix per component)", () => {
    const id = (idPrefix: string) =>
      render(Court, { props: { board: full }, idPrefix }).body.match(/id="([^"]+)-head"/)![1];
    expect(id("s0")).not.toBe(id("s1"));
  });
});
