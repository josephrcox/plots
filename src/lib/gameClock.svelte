<script>
	import { onMount } from 'svelte';
	import { DB, DATABASE_NAME } from './store.js';


	export function mainGameThreadLoop() {
		// check town money
		// check for new visitors
		// check population happiness
		// check population health
		let z = $DB;
		z.environment.day += 1;

		// check if day is divisible by 30
		if (z.environment.day % 7 == 0) {
			console.log('month passed');
			z.towninfo.happiness = z.towninfo.happiness * (z.modifiers.happiness);
		}

		DB.set(z);
		localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
	}

	onMount(() => {
		setInterval(mainGameThreadLoop, 2000);
	});
</script>

<style>
</style>
