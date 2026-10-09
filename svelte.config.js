import { vitePreprocess } from '@astrojs/svelte';

export default {
	preprocess: vitePreprocess(),
	// No window.__svelte version marker in the board's JS.
	compilerOptions: { discloseVersion: false },
}
