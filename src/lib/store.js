import { writable } from 'svelte/store';
import { default_db } from './jsonObjects/defaults/default_DB.js';

export const DATABASE_NAME = 'plots_db';

if (!localStorage.getItem(DATABASE_NAME)) {
	localStorage.setItem(DATABASE_NAME, JSON.stringify(default_db));
	let json = JSON.parse(localStorage.getItem(DATABASE_NAME));
	// set max tax rate, number between 0.2 and 0.5
	json.economy_and_laws.max_tax_rate = Math.random() * (0.5 - 0.2) + 0.2;
	// create 25 x 25 plots
	let default_plots = [];
	for (let i = 0; i < 25; i++) {
		default_plots.push([]);
		for (let j = 0; j < 25; j++) {
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
}

export let DB = writable(JSON.parse(localStorage.getItem(DATABASE_NAME)));

export let modifyPlotMenuOptions = writable({
	visible: false,
	x: 0,
	y: 0,
});

export let unique = writable({});
export let paused = writable(false);
export let showBalanceSheet = writable(false);
export let speed = writable(2000);



