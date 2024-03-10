import { writable } from 'svelte/store';
// @ts-ignore
import { default_db, difficulties } from './objects/defaults/default_DB.js'
// @ts-ignore
import { Difficulty, EndGoal, Game } from './types';
// @ts-ignore
import { max_tax_rates_based_on_difficulty } from './objects/difficulty.js';

// The active game DB is for the current game, challenge, or play-through.
//// This can get corrupted, so it is important to keep this separate from the user DB.
export const ACTIVE_GAME_DB_NAME = 'plots_active_game_db';
// The user DB keeps track of progress, achievements,
//// challenge history, and such.
export const USER_DB_NAME = 'plots_user_db';

function generateRandomTownName(): string {
    const firstPart = ["Green", "River", "Mountain", "North", "South", "East", "West", "Lake", "Forest", "Spring", "Golden", "Silver", "Crystal", "Sun", "Moon", "Star", "Valley", "Pine", "Maple", "Oak", "Wild", "Misty", "Rainbow", "Snow", "Summer", "Autumn", "Winter", "Thunder", "Storm", "Crystal", "Diamond"];
    const secondPart = ["wood", "ville", "town", "field", "ford", "brook", "hill", "dale", "bury", "port", "view", "crest", "meadow", "side", "grove", "haven", "crossing", "junction", "landing", "ridge", "summit", "slope", "strand", "creek", "isle", "glen", "bay", "harbor", "glade", "peak", "plateau"];

    const randomFirstPart = firstPart[Math.floor(Math.random() * firstPart.length)];
    const randomSecondPart = secondPart[Math.floor(Math.random() * secondPart.length)];

    return `${randomFirstPart}${randomSecondPart}`;
}


// Define your DB store at the top
export let DB = writable(
	JSON.parse(localStorage.getItem(ACTIVE_GAME_DB_NAME) || 'null'),
);

export function startGame(difficulty : Difficulty, endGoal : EndGoal, townName: string, cheats: boolean) {
	let json : Game = { ...default_db }; // Use a copy of default_db 
	json.economyAndLaws.max_tax_rate = max_tax_rates_based_on_difficulty[difficulty];
	json.endGoal = endGoal; // defaults to 'land' as in fill the grid.
	let default_plots = [] as any[][]; 
	// remove leading and trailing spaces, remove symbols other than nunbers and letters
	townName = townName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
	json.townInfo.name = townName != '' ? townName : generateRandomTownName();
	json.difficulty = parseInt(difficulty);
	
	if (cheats) {
		json.townInfo.gold = 1000000;
		json.townInfo.employees = 10000;
		json.townInfo.happiness = 10000;
		json.townInfo.health = 10000;
		json.townInfo.knowledge_points = 1000;
		json.modifiers.happiness = 10000;
		json.modifiers.health = 10000;
	}
	const randomSize =
		difficulty == '0'
			? 8
			: difficulty == '1' 
			? 12
			: difficulty == '2' 
			? 16
			: 1; // never should happen. 
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
	localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(json));
	DB.set(json); // Update the store with the new value
	location.reload();
}

export function clearDB(overridenFile : File | null = null) {
	localStorage.removeItem(ACTIVE_GAME_DB_NAME);
	DB.set(null); // Update the store to null
	if (overridenFile) {
		localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(overridenFile));
		DB.set(overridenFile);
	}
	location.reload();
}

export function toggleShowOnlyAffordable() {
	showOnlyAffordable.update((value) => !value);
	localStorage.setItem('showOnlyAffordable', localStorage.getItem('showOnlyAffordable') === 'true' ? 'false' : 'true');
}

export let modifyPlotMenuOptions = writable({
	visible: false,
	x: 0,
	y: 0,
});

export let startGameMenu = writable({
	visible: false,
});

export let unique = writable({});
export let paused = writable(false);
export let showScoreboard = writable(false);
export let showBalanceSheet = writable(false);
export let showOnlyAffordable = localStorage.getItem('showOnlyAffordable') === 'true' ? writable(true) : writable(false);
export let headerHeight = writable(250);
export let speed = writable(500);
