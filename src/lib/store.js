import { writable } from 'svelte/store';
import { default_db } from './jsonObjects/defaults/default_DB.js';

export const DATABASE_NAME = 'plots_db_v2';

export function startGame(difficulty, endGoal) {
	localStorage.setItem(DATABASE_NAME, JSON.stringify(default_db));
	let json = JSON.parse(localStorage.getItem(DATABASE_NAME));
	json.economy_and_laws.max_tax_rate = Math.random() * (0.5 - 0.2) + 0.2;
	let default_plots = [];
	const randomSize =
		difficulty == '0' // easiest
			? Math.floor(Math.random() * 10) + 8
			: difficulty == '1'
			? Math.floor(Math.random() * 15) + 12
			: difficulty == '2'
			? Math.floor(Math.random() * 20) + 12
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
	localStorage.setItem(DATABASE_NAME, JSON.stringify(json));
	location.reload();
}

export let DB = writable(JSON.parse(localStorage.getItem(DATABASE_NAME)));

export function clearDB() {
	console.log('RELOADING');
	localStorage.removeItem(DATABASE_NAME);
	DB = null;
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
