// The QR code renderer, loaded later by the editor. A dynamic import of "uqr"
// itself would keep all of uqr (its text renderers too); through this module
// the bundle keeps only renderSVG and what it needs (0.3 KB less).
export { renderSVG } from "uqr";
