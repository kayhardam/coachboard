// Editing operations on a board. Pure: each returns a new board.

/** A piece in the current frame. */
export interface Selection {
  kind: "player" | "ball" | "arrow";
  index: number;
}
