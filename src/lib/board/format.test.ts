import { describe, expect, it } from "vitest";
import { defaultBoard } from "./defaults";
import { decode, encode, isBoard, type Board } from "./format";

interface Fixture {
  link: string;
  board: Board;
}

const fixtures = import.meta.glob<Fixture>("./fixtures/*.json", {
  eager: true,
  import: "default",
});
const fullLineup = fixtures["./fixtures/v1-full-lineup.json"]!.board;

/** Packs any JSON the way encode() does, to build hostile links. */
async function linkFromJson(json: string): Promise<string> {
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `1.${btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")}`;
}

describe("v1 fixtures", () => {
  it("exist", () => {
    expect(Object.keys(fixtures).length).toBeGreaterThanOrEqual(3);
  });

  it.each(Object.entries(fixtures))("%s decodes to its board", async (_, fixture) => {
    expect(await decode(fixture.link)).toEqual(fixture.board);
  });
});

describe("encode and decode", () => {
  it.each(Object.entries(fixtures))("%s survives a roundtrip", async (_, { board }) => {
    expect(await decode(await encode(board))).toEqual(board);
  });

  it("keeps the default lineup valid", () => {
    expect(isBoard(defaultBoard)).toBe(true);
  });

  it("fits a full lineup in the QR budget of 300 characters", async () => {
    const frame = fullLineup.frames[0]!;
    expect(frame.players).toHaveLength(14);
    expect(frame.ball).toBeDefined();
    expect(frame.arrows).toHaveLength(6);
    expect((await encode(fullLineup)).length).toBeLessThanOrEqual(300);
  });
});

describe("decode rejects", () => {
  const valid = fixtures["./fixtures/v1-default.json"]!.link;

  it.each([
    ["an empty string", ""],
    ["text without a version", "hello"],
    ["an empty payload", "1."],
    ["an unknown version", `2.${valid.slice(2)}`],
    ["no version", valid.slice(1)],
    ["characters outside base64url", "1.abc+/def"],
    ["a truncated payload", valid.slice(0, -12)],
    ["an oversized payload", `1.${"A".repeat(5000)}`],
  ])("%s", async (_, link) => {
    expect(await decode(link)).toBeNull();
  });

  it.each([
    ["JSON that isn't the v1 shape", '{"court":0}'],
    ["a board without frames", "[0,[]]"],
    ["an unknown court", "[2,[[[],0,[]]]]"],
    ["a court index as a string", '["0",[[[],0,[]]]]'],
    ["a player outside the court", "[0,[[[[0,201,10]],0,[]]]]"],
    ["a coordinate that isn't a whole number", "[0,[[[[0,10.5,10]],0,[]]]]"],
    ["a label longer than 3 characters", '[0,[[[[0,10,10,"LONG"]],0,[]]]]'],
    ["an arrow with one point", "[0,[[[],0,[[0,10,10]]]]]"],
    ["an arrow with an odd coordinate count", "[0,[[[],0,[[0,10,10,20]]]]]"],
    ["an unknown arrow kind", "[0,[[[],0,[[3,10,10,20,20]]]]]"],
    ["too many players", `[0,[[[${Array(31).fill("[0,10,10]").join(",")}],0,[]]]]`],
    ["text that isn't JSON", "not json"],
  ])("%s", async (_, json) => {
    expect(await decode(await linkFromJson(json))).toBeNull();
  });

  it("nothing that is valid (control for the cases above)", async () => {
    expect(await decode(await linkFromJson(`[0,[[[[0,10,10]],0,[]]]${" ".repeat(1000)}]`))).toEqual({
      v: 1,
      court: "half",
      frames: [{ players: [{ team: "a", at: [10, 10] }], arrows: [] }],
    });
  });

  it("a valid board that inflates past 64 KB", async () => {
    const padded = `[0,[[[[0,10,10]],0,[]]]${" ".repeat(70_000)}]`;
    const link = await linkFromJson(padded);
    expect(link.length).toBeLessThan(4000);
    expect(await decode(link)).toBeNull();
  });
});
