// The tactic's share image, next to its page: /en/tactics/<slug>/og.png.
import type { APIRoute } from "astro";
import { courtPng } from "../../../../components/board/courtPng";
import { tacticPaths, type Tactic } from "../../../../data/tactics";

export const getStaticPaths = tacticPaths;

export const GET: APIRoute<{ tactic: Tactic }> = async ({ props }) => {
  const { board, title } = props.tactic.entry.data;
  const png = await courtPng(board, title);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
