<!--
  The list in My boards (inside the editor's <dialog class="boards">): the
  folders and their boards, each with its ⋯ menu, then Export and Import. The
  list itself is the editor's (`boards`); every change goes through `change()`.
-->
<script lang="ts">
  import type { BoardStrings } from "../../i18n/ui";
  import { boardIcons as icons } from "../../lib/icons";
  import * as store from "../../lib/board/boards";
  import Court from "./Court.svelte";
  import { focusField } from "./focus";

  /**
   * `change`: changes the list in localStorage and shows it (false when it couldn't); `readList`: reads it again.
   * `saveNow`: saves the board on the court if its save is still waiting.
   * `onopen`: puts a board on the court; `ondelete`: deletes one, with Undo.
   */
  let {
    strings,
    boards,
    folders,
    current,
    links,
    inWebApp,
    change,
    readList,
    show,
    send,
    saveNow,
    onopen,
    ondelete,
  }: {
    strings: BoardStrings;
    boards: store.Saved[];
    folders: string[];
    current: string | null;
    links: { link: string; qr: string };
    inWebApp: boolean;
    change: (run: (storage: Storage) => store.Store) => boolean;
    readList: () => store.Store | null;
    show: (text: string) => void;
    send: (data: { text: string }, copied: string) => Promise<void>;
    saveNow: () => Promise<void>;
    onopen: (s: store.Saved) => void;
    ondelete: (s: store.Saved) => void;
  } = $props();

  /** An iPhone or iPad (iPadOS says it is a Mac): where Safari clears a site's storage after a week. */
  const onIos = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  /** The board whose new folder is being named, or the folder being renamed. */
  let naming = $state<string | null>(null);
  let renaming = $state<string | null>(null);

  /** Closing My boards drops a name being typed. */
  export function reset() {
    naming = renaming = null;
  }

  /** Closes the ⋯ menu a button or field sits in. */
  function closeMenu(e?: Event) {
    const menu = (e?.currentTarget as Element | undefined)?.closest("details");
    if (menu) menu.open = false;
  }

  function duplicate(s: store.Saved, e: Event) {
    closeMenu(e);
    const copy = store.copyOf(s, strings["board.copySuffix"]);
    change((storage) => store.update(storage, (list) => ({ ...list, boards: store.putAfter(list.boards, s.id, copy) })));
  }

  /** Move up or Move down in its folder. */
  function shift(s: store.Saved, by: -1 | 1, e: Event) {
    closeMenu(e);
    change((storage) => store.update(storage, (list) => ({ ...list, boards: store.shift(list.boards, s.id, by) })));
  }

  function deleteSaved(s: store.Saved, e: Event) {
    closeMenu(e);
    ondelete(s);
  }

  function moveTo(s: store.Saved, folder: string, e?: Event) {
    closeMenu(e);
    change((storage) =>
      store.update(storage, (list) => ({ ...list, boards: store.toFolder(list.boards, s.id, folder) })),
    );
  }

  /**
   * Share folder: one message with the folder's name, then each board's
   * title and its link, in the folder's order. The board on the court goes
   * in with its latest change.
   */
  async function shareFolder(folder: string, e: Event) {
    closeMenu(e);
    await saveNow();
    const list = store.inFolder(readList()?.boards ?? boards, folder);
    const text = await store.folderMessage(folder, list, `${location.origin}${links.link}#t=`, strings["board.untitled"]);
    send({ text }, strings["board.linksCopied"]);
  }

  /** Duplicate folder: a copy of it with every board, on top of the list, its name ready to change. */
  async function duplicateFolder(folder: string, e: Event) {
    closeMenu(e);
    await saveNow();
    let name = "";
    const copied = change((storage) =>
      store.update(storage, (list) => {
        const copy = store.copyFolder(list.boards, folder, strings["board.copySuffix"], strings["board.copySuffixN"]);
        name = copy.name;
        return { ...list, boards: copy.boards };
      }),
    );
    if (copied) renaming = name;
  }

  /** Enter or leaving the field keeps a folder name; Escape drops it (and keeps the list open). */
  function finishFolder(e: Event, keepName: boolean) {
    const name = (e.currentTarget as HTMLInputElement).value;
    const s = boards.find((b) => b.id === naming);
    const from = renaming;
    naming = renaming = null;
    if (!keepName) return;
    if (s) moveTo(s, name, e);
    else if (from !== null) {
      change((storage) => store.update(storage, (list) => ({ ...list, boards: store.renameFolder(list.boards, from, name) })));
    }
  }

  function folderKey(e: KeyboardEvent) {
    if (e.key === "Enter") finishFolder(e, true);
    else if (e.key === "Escape") {
      e.preventDefault();
      finishFolder(e, false);
    }
  }

  /** Export all boards: one file of links, downloaded. The board on the court goes in with its latest change. */
  async function exportAll() {
    await saveNow();
    const editor = new URL("..", location.origin + links.link);
    const text = await store.exportFile(readList()?.boards ?? boards, `${editor}#t=`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    // Swedish writes the date as 2026-10-09, in local time.
    a.download = strings["board.exportFile"].replace("{date}", new Date().toLocaleDateString("sv"));
    a.click();
    // Safari on the iPhone asks first whether to download; revoke late, as FileSaver.js does.
    setTimeout(() => URL.revokeObjectURL(a.href), 40_000);
  }

  /** Adds the boards in an exported file to My boards, leaving out those already there; nothing is overwritten. */
  async function importBoards(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ""; // so the same file can be chosen again
    if (!file) return;
    const found = await store.importFile(await file.text());
    if (!found.length) return show(strings["board.importNone"]);
    let added: store.Saved[] = [];
    const done = change((storage) =>
      store.update(storage, (list) => {
        const next = store.addImported(list.boards, found);
        added = next.added;
        return { ...list, boards: next.boards };
      }),
    );
    if (!done) return show(strings["board.importFailed"]);
    show(
      added.length === 0
        ? strings["board.importKnown"]
        : added.length === 1
          ? strings["board.importedOne"]
          : strings["board.imported"].replace("{count}", String(added.length)),
    );
  }

  /**
   * Folders first, the most recently changed first, each in its own order;
   * then the boards without one, the most recently changed first.
   */
  const groups = $derived(
    [
      ...folders.map((folder) => [folder, store.inFolder(boards, folder)] as const),
      [undefined, store.byDate(store.inFolder(boards, undefined))] as const,
    ].filter(([, list]) => list.length > 0),
  );

  const titleOf = (s: store.Saved) => s.board.title ?? strings["board.untitled"];
  /**
   * A ⋯ menu in My boards opens downward; one that would end below the list's
   * visible part opens upward, if there is more room above (finding 17).
   */
  function placeMenu(e: Event) {
    const menu = e.currentTarget as HTMLDetailsElement;
    menu.classList.remove("up");
    if (!menu.open) return;
    const dialog = menu.closest("dialog")!;
    const panel = menu.querySelector(".actions-panel")!.getBoundingClientRect();
    const at = menu.getBoundingClientRect();
    const top = dialog.querySelector(".boards-bar")!.getBoundingClientRect().bottom;
    const bottom = Math.min(dialog.getBoundingClientRect().bottom, innerHeight);
    if (panel.bottom > bottom && at.top - top > bottom - at.bottom) menu.classList.add("up");
  }

  const moreFor = (title?: string) => (title ? strings["board.moreFor"].replace("{title}", title) : strings["board.moreForUntitled"]);
  const date = (at: number) =>
    new Date(at).toLocaleDateString(document.documentElement.lang, { day: "numeric", month: "short" });
</script>

{#if boards.length === 0}
  <p class="empty">{strings["board.noBoards"]}</p>
{/if}
{#each groups as [folder, list] (folder ?? "")}
  <!-- ⋯ beside the heading, not in it: a <details> can't sit in a heading. -->
  <div class="folder">
    <h3>
      {#if folder === undefined}
        {strings["board.noFolder"]}
      {:else if renaming === folder}
        <input
          value={folder}
          maxlength={store.MAX_FOLDER}
          aria-label={strings["board.folderName"]}
          use:focusField
          onkeydown={folderKey}
          onblur={(e) => renaming !== null && finishFolder(e, true)}
        />
      {:else}
        <button type="button" title={strings["board.renameFolder"]} onclick={() => (renaming = folder)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.folder} /></svg>
          <span>{folder}</span>
        </button>
      {/if}
    </h3>
    {#if folder !== undefined && renaming !== folder}
      <details class="actions" ontoggle={placeMenu}>
        <summary aria-label={moreFor(folder)} title={moreFor(folder)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.more} /></svg>
        </summary>
        <div class="actions-panel">
          <button type="button" onclick={(e) => shareFolder(folder, e)}>{strings["board.shareFolder"]}</button>
          <button type="button" onclick={(e) => duplicateFolder(folder, e)}>{strings["board.duplicateFolder"]}</button>
        </div>
      </details>
    {/if}
  </div>
  <ul>
    {#each list as s, i (s.id)}
      <li class:current={s.id === current}>
        <button type="button" class="open" onclick={() => onopen(s)}>
          <span class="thumb" aria-hidden="true"><Court board={s.board} label={titleOf(s)} /></span>
          <span class="name">{titleOf(s)}</span>
          <time datetime={new Date(s.at).toISOString()}>{date(s.at)}</time>
        </button>
        <details class="actions" ontoggle={placeMenu}>
          <summary aria-label={moreFor(s.board.title)} title={moreFor(s.board.title)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.more} /></svg>
          </summary>
          <div class="actions-panel">
            <button type="button" onclick={(e) => duplicate(s, e)}>{strings["board.duplicate"]}</button>
            {#if folder !== undefined && i > 0}
              <button type="button" onclick={(e) => shift(s, -1, e)}>{strings["board.moveUp"]}</button>
            {/if}
            {#if folder !== undefined && i < list.length - 1}
              <button type="button" onclick={(e) => shift(s, 1, e)}>{strings["board.moveDown"]}</button>
            {/if}
            <p>{strings["board.folder"]}</p>
            {#each ["", ...folders] as f (f)}
              <button type="button" aria-pressed={(s.folder ?? "") === f} onclick={(e) => moveTo(s, f, e)}>
                {#if (s.folder ?? "") === f}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.check} /></svg>{/if}
                {f || strings["board.noFolder"]}
              </button>
            {/each}
            {#if naming === s.id}
              <input
                maxlength={store.MAX_FOLDER}
                aria-label={strings["board.folderName"]}
                use:focusField
                onkeydown={folderKey}
                onblur={(e) => naming !== null && finishFolder(e, true)}
              />
            {:else}
              <button type="button" onclick={() => (naming = s.id)}>{strings["board.newFolder"]}</button>
            {/if}
            <button type="button" class="delete-board" onclick={(e) => deleteSaved(s, e)}>{strings["board.delete"]}</button>
          </div>
        </details>
      </li>
    {/each}
  </ul>
{/each}
<!-- After the list: you use it now and then, the list every training. -->
<div class="backup">
  {#if boards.length}
    <p>{strings["board.exportHint"]}</p>
    <button type="button" onclick={exportAll}>{strings["board.exportAll"]}</button>
  {/if}
  <label>
    {strings["board.import"]}
    <input type="file" accept=".json,application/json" onchange={importBoards} />
  </label>
  <!-- Under the buttons, so it moves nothing that was there. -->
  {#if boards.length && onIos && !inWebApp}
    <p class="tip">{strings["board.homeScreenTip"]}</p>
  {/if}
</div>
