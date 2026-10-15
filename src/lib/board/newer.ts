// A link from a newer version of the board than this code (isNewerLink()).
// The editor and the viewer both reload for one: a tab opened before a deploy
// runs the old code, and the reload fetches the code that reads the link.

import { isNewerLink } from "./format";

/** The last link that reloaded this tab, so it reloads only once (sessionStorage). */
export const RELOADED_KEY = "coachboard.reloaded";

/**
 * Reloads the page for a link from a newer version, once per link per tab,
 * and says whether it did. If the reloaded code doesn't read the link either,
 * or there is no storage to stop at one reload, the caller shows the notice
 * for a broken link.
 */
export function reloadForNewer(link: string): boolean {
  if (!isNewerLink(link)) return false;
  try {
    if (sessionStorage.getItem(RELOADED_KEY) === link) return false;
    sessionStorage.setItem(RELOADED_KEY, link);
  } catch {
    // No storage, so no way to stop at one reload: show the notice.
    return false;
  }
  location.reload();
  return true;
}
