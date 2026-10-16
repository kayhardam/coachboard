// The tactic's share image, next to its page: /en/tactics/<slug>/og.png.
import type { APIRoute } from "astro";
import { courtPng } from "../../../../components/board/courtPng";
import { itemPaths, type Item } from "../../../../data/library";

export const getStaticPaths = () => itemPaths("tactic");

export const GET: APIRoute<{ item: Item }> = async ({ props }) => {
  const { board, title } = props.item.entry.data;
  const png = await courtPng(board, title);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
