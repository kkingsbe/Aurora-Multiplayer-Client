import App from './App.svelte';
import { Button } from 'sveltestrap'

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;