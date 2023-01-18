import { writable } from 'svelte/store';
import { default_db } from './defaults/def_DB.js';

export const DATABASE_NAME = 'plots_db';


if (!localStorage.getItem(DATABASE_NAME)) {
    localStorage.setItem(
        DATABASE_NAME,
        JSON.stringify(default_db)
    );
    let default_plots = [];
    // create 25 x 25 plots
    for (let i = 0; i < 25; i++) {
        default_plots.push([]);
        for (let j = 0; j < 25; j++) {
            default_plots[i][j] = {
                "id": Math.random().toString(36).substring(2, 9),
                "active": false,
                "x": i,
                "y": j,
                "type": -1,
            };
        }
    }

    let json = JSON.parse(localStorage.getItem(DATABASE_NAME));
    json.plots = default_plots;
    localStorage.setItem(DATABASE_NAME, JSON.stringify(json));
}

export let DB = writable(
	JSON.parse(localStorage.getItem(DATABASE_NAME))
);

export let modifyPlotMenuOptions = writable({
    visible: false,
    x: 0,
    y: 0
});

export let unique = writable({});
