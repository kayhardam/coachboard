/** An action for a field that opens on a tap (a title, a sentence, a folder's name): focused, its text selected. */
export function focusField(input: HTMLInputElement) {
  input.focus();
  input.select();
}
