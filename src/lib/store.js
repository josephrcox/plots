import { writable } from 'svelte/store';
import { default_db } from './objects/defaults/default_DB.js';

export const DATABASE_NAME = 'plots_db_v2';

// Define your DB store at the top
export let DB = writable(
	JSON.parse(localStorage.getItem(DATABASE_NAME)) || null,
);

export function startGame(difficulty, endGoal) {
	let json = { ...default_db }; // Use a copy of default_db
	json.economy_and_laws.max_tax_rate = Math.random() * (0.5 - 0.2) + 0.2;
	json.endGoal = endGoal; // defaults to 'land' as in fill the grid.
	let default_plots = [];
	const randomSize =
		difficulty == '0'
			? 6
			: difficulty == '1' // from 7-11
			? Math.floor(Math.random() * 4) + 7
			: difficulty == '2' // from 12 - 20
			? Math.floor(Math.random() * 9) + 12
			: 35; // undefined difficulty
	for (let i = 0; i < randomSize; i++) {
		default_plots.push([]);
		for (let j = 0; j < randomSize; j++) {
			default_plots[i][j] = {
				id: Math.random().toString(36).substring(2, 9),
				active: false,
				x: i,
				y: j,
				type: -1,
			};
		}
	}

	json.plots = default_plots;
	localStorage.reset = false;
	localStorage.setItem(DATABASE_NAME, JSON.stringify(json));
	DB.set(json); // Update the store with the new value
	location.reload();
}

export function clearDB(overridenFile) {
	console.log('RELOADING');
	localStorage.removeItem(DATABASE_NAME);
	DB.set(null); // Update the store to null
	if (overridenFile) {
		localStorage.setItem(DATABASE_NAME, JSON.stringify(overridenFile));
		DB.set(overridenFile);
	}
	location.reload();
}

export let modifyPlotMenuOptions = writable({
	visible: false,
	x: 0,
	y: 0,
});

export let unique = writable({});
export let paused = writable(false);
export let showBalanceSheet = writable(false);
export let speed = writable(2000);
export let showUnaffordablePlotOptions = writable(
	localStorage.getItem('showUnaffordablePlotOptions') === 'true' ? true : false,
);
