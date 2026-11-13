<!--
  Open a link in My boards: every link in a pasted text becomes a board in the
  list (src/lib/board/AGENTS.md). In the browser under the list, in the web app
  right under New board; the editor places it.
-->
<script lang="ts">
  import type { BoardStrings } from "../../i18n/ui";
  import { sameBoard } from "../../lib/board/format";
  import * as store from "../../lib/board/boards";

  /** `change` and `readList` as for the list (BoardList.svelte); `onopen` puts a board on the court. */
  let {
    strings,
    change,
    readList,
    show,
    onopen,
  }: {
    strings: BoardStrings;
    change: (run: (storage: Storage) => store.Store) => boolean;
    readList: () => store.Store | null;
    show: (text: string) => void;
    onopen: (s: store.Saved) => void;
  } = $props();

  /** The text in the field. */
  let pasted = $state("");

  /** The notice after Open a link. Never "0 boards added"; which folder, if the text was a folder's message. */
  function linksAdded(added: number, broken: boolean, folder?: string) {
    if (!added) return strings[broken ? "board.linksNoneNew" : "board.linksKnown"];
    const text = folder
      ? strings[added === 1 ? "board.addedToFolderOne" : "board.addedToFolder"].replace("{folder}", folder)
      : strings[added === 1 ? "board.importedOne" : "board.imported"];
    return text.replace("{count}", String(added)) + (broken ? ` ${strings["board.linksSomeBroken"]}` : "");
  }

  /**
   * Open a link: every link in the pasted text becomes a board in the list. A
   * single link also opens: that board if it is already there, in any folder.
   */
  async function openLinks(e: Event) {
    e.preventDefault();
    if (!pasted.trim()) return;
    const { boards: found, links: count, folder } = await store.readMessage(pasted);
    if (!found.length) return show(strings["board.linkBroken"]);
    const single = count === 1 && !folder ? found[0] : undefined;
    const known = single && readList()?.boards.find((s) => sameBoard(s.board, single.board));
    if (known) {
      pasted = "";
      return onopen(known);
    }
    let added: store.Saved[] = [];
    const done = change((storage) =>
      store.update(storage, (list) => {
        const next = store.addImported(list.boards, found);
        added = next.added;
        return { ...list, boards: next.boards };
      }),
    );
    if (!done) return show(strings["board.importFailed"]);
    pasted = "";
    show(linksAdded(added.length, found.length < count, folder));
    if (single) onopen(single);
  }
</script>

<form class="paste" onsubmit={openLinks}>
  <label>
    {strings["board.openLink"]}
    <!-- A folder's message: an input would drop its line breaks. -->
    <textarea rows="2" autocapitalize="off" autocomplete="off" spellcheck="false" bind:value={pasted}></textarea>
  </label>
  <button type="submit">{strings["board.openLinkButton"]}</button>
</form>
