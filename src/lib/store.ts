import { writable } from "svelte/store";
// @ts-ignore
import { default_db, default_user_db } from "./objects/defaults/default_DB.js";
// @ts-ignore
import { Difficulty, EndGoal, Game, UserDatabase, Plot } from "./types";
// @ts-ignore
import { max_tax_rates_based_on_difficulty } from "./objects/difficulty.js";
// @ts-ignore
import { options } from "./objects/PlotTypeOptions";

// The active game DB is for the current game, challenge, or play-through.
//// This can get corrupted, so it is important to keep this separate from the user DB.
export const ACTIVE_GAME_DB_NAME = "plots_active_game_db";
// The user DB keeps track of progress, achievements,
//// challenge history, and such.
export const USER_DB_NAME = "plots_user_db";

function generateRandomTownName(): string {
  const baseNames = [
    "York",
    "London",
    "Paris",
    "Madrid",
    "Rome",
    "Berlin",
    "Vienna",
    "Prague",
    "Warsaw",
    "Oslo",
    "Lisbon",
    "Dublin",
    "Brussels",
    "Amsterdam",
    "Stockholm",
    "Copenhagen",
    "Edinburgh",
    "Moscow",
    "Beijing",
    "Tokyo",
    "Seoul",
    "Bangkok",
    "Delhi",
    "Mumbai",
    "Shanghai",
    "Sydney",
    "Melbourne",
    "Cairo",
    "Dubai",
    "Istanbul",
    "Athens",
    "Budapest",
    "Reykjavik",
    "Helsinki",
    "Tallinn",
    "Riga",
    "Vilnius",
    "Sofia",
    "Bucharest",
    "Belgrade",
    "Zagreb",
    "Sarajevo",
    "Ljubljana",
    "Skopje",
    "Tirana",
    "Podgorica",
    "Thessaloniki",
    "Barcelona",
    "Valencia",
    "Seville",
    "Granada",
    "Malaga",
    "Lyon",
    "Marseille",
    "Toulouse",
    "Nice",
    "Nantes",
    "Strasbourg",
    "Bordeaux",
    "Lille",
    "Venice",
    "Milan",
    "Florence",
    "Naples",
    "Turin",
    "Bologna",
    "Perugia",
    "Genoa",
    "Pisa",
    "Verona",
    "Palermo",
    "Catania",
    "Bari",
    "Padua",
    "Cagliari",
    "Krakow",
    "Gdansk",
    "Poznan",
    "Wroclaw",
    "Lodz",
    "Katowice",
    "Bialystok",
    "Gdynia",
    "Sopot",
    "Bydgoszcz",
    "Lublin",
    "Szczecin",
    "Gorzow",
    "Zakopane",
    "Olsztyn",
    "Torun",
    "Rzeszow",
    "Kielce",
    "Radom",
    "Siedlce",
    "Los",
    "Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "San",
    "Antonio",
    "San",
    "Diego",
    "Dallas",
    "San",
    "Jose",
    "Austin",
    "Jacksonville",
    "Fort",
    "Worth",
    "Columbus",
    "Charlotte",
    "Liverpool",
    "Manchester",
    "Glasgow",
    "Birmingham",
    "Leeds",
    "Sheffield",
    "Newcastle",
    "upon",
    "Tyne",
    "Bristol",
    "Nottingham",
    "Leicester",
    "Coventry",
    "Belfast",
    "Reading",
    "Cardiff",
    "Southampton",
    "Aberdeen",
    "Plymouth",
    "Stoke",
    "Trent",
    "Wolverhampton",
    "Swansea",
    "Sunderland",
    "Portsmouth",
    "Yorkshire",
    "Hull",
    "Blackpool",
    "Bradford",
    "Derby",
    "Middlesbrough",
    "Peterborough",
    "Stockton",
    "on",
    "Tees",
    "Brighton",
    "Poole",
    "Bournemouth",
    "Huddersfield",
    "Luton",
    "Oxford",
    "Norwich",
    "Oldham",
    "Cambridge",
    "Exeter",
    "Walsall",
    "Colchester",
    "Watford",
    "Rotherham",
    "Newport",
    "Gateshead",
    "Dundee",
    "Gloucester",
    "Solihull",
    "High",
    "Wycombe",
    "Maidstone",
    "Slough",
    "Basildon",
    "Chelmsford",
    "Salford",
    "Bedford",
    "Stevenage",
    "Woking",
    "Grimsby",
    "Birkenhead",
    "Halifax",
    "Warrington",
    "Gillingham",
    "Wigan",
    "Worcester",
    "Wakefield",
    "Lincoln",
    "Chester",
    "Rochdale",
    "Dagenham",
    "Widnes",
    "St",
    "Albans",
    "Mansfield",
    "Sutton",
    "Coldfield",
    "Crawley",
    "Wokingham",
    "Barnsley",
    "St",
    "Helens",
    "Harrogate",
    "Redditch",
    "Scunthorpe",
    "Nuneaton",
    "Chesterfield",
    "Hemel",
    "Hempstead",
    "Bury",
    "Guildford",
    "Ashford",
    "Telford",
    "Newcastle",
    "under",
    "Lyme",
    "Aylesbury",
    "Halesowen",
    "Shrewsbury",
    "Lowestoft",
    "Loughborough",
    "Cheltenham",
    "Kidderminster",
    "Basingstoke",
    "Rugby",
    "Stourbridge",
    "Southport",
    "Kettering",
    "Royal",
    "Leamington",
    "Spa",
    "Beeston",
    "Farnborough",
    "Wrexham",
    "Banbury",
    "Weymouth",
    "Wallsend",
    "Dartford",
    "Grays",
    "Tamworth",
    "Ashford",
    "Esher",
    "Folkestone",
    "Tonbridge",
    "Taunton",
    "Runcorn",
    "Macclesfield",
    "Keighley",
    "Bridgend",
    "Barnstaple",
    "Letchworth",
    "Garden",
    "City",
    "Worthing",
    "Gosport",
    "Eastleigh",
    "Staines",
    "upon",
    "Thames",
    "Lisburn",
    "Livingston",
    "Bognor",
    "Regis",
    "Scarborough",
    "Cannock",
    "Margate",
    "Chippenham",
    "Rhondda",
    "Maidenhead",
    "Wellingborough",
    "Washington",
    "Camberley",
    "Bootle",
    "Lancaster",
    "Llanelli",
    "Chatham",
    "Cheshunt",
    "Bishop",
    "Auckland",
    "Nelson",
    "Belper",
    "Pontefract",
    "Barry",
    "Braintree",
    "Crosby",
    "Bury",
    "St",
    "Edmunds",
    "Bexhill",
    "Margate",
    "Aldershot",
    "Rowley",
    "Regis",
    "Hoddesdon",
    "Sittingbourne",
    "Rugby",
    "Newquay",
    "Falmouth",
    "Stretford",
    "Camberley",
    "Beverley",
    "Windsor",
    "Rochester",
    "Wickford",
    "Diss",
    "Farnham",
    "Andover",
    "Camberwell",
    "Bermondsey",
    "Lewisham",
    "Wembley",
    "Hayes",
    "Harrow",
    "Ilford",
    "Enfield",
    "Twickenham",
    "Richmond",
    "Brentwood",
    "Edgware",
    "Ealing",
    "Greenwich",
    "Bromley",
    "Hounslow",
    "Romford",
    "Hillingdon",
    "Uxbridge",
    "Wandsworth",
    "Sutton",
    "Kingston",
    "upon",
    "Thames",
    "Bexley",
    "Havering",
    "Barking",
  ];

  const suffixes = [
    "ia",
    "ville",
    "ton",
    "land",
    "field",
    "burgh",
    "ford",
    "wood",
    "port",
    "bay",
    "beach",
    "peak",
    "valley",
    "ridge",
    "hill",
    "dale",
    "island",
    "cape",
    "spring",
    "grove",
    "polis",
    "side",
    "view",
    "shore",
    "haven",
    "place",
    "gardens",
    "plaza",
    "square",
  ];

  const prefixes = [
    "New",
    "Old",
    "North",
    "South",
    "East",
    "West",
    "Upper",
    "Lower",
    "Little",
    "Great",
    "Saint",
    "Fort",
    "Mount",
    "Lake",
    "River",
    "The Village of",
    "The City of",
    "The Town of",
    "The Borough of",
    "The County of",
    "The State of",
    "The Kingdom of",
    "The Empire of",
    "The Republic of",
    "The Commonwealth of",
    "The Union of",
    "The Federation of",
    "Rainy",
    "Sunny",
    "Windy",
    "Frosty",
    "Snowy",
  ];

  function getRandomElement(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  let prefix = getRandomElement(prefixes);
  let baseName = getRandomElement(baseNames);
  let suffix = getRandomElement(suffixes);

  let townName = "";
  if (Math.random() > 0.5) {
    townName = prefix + " " + baseName + suffix;
  } else {
    townName = baseName + suffix;
  }
  return townName;
}

// Define your DB store at the top
export let DB = writable(
  JSON.parse(localStorage.getItem(ACTIVE_GAME_DB_NAME) || "null"),
);

export let userDB = writable(
  JSON.parse(localStorage.getItem(USER_DB_NAME) || "null"),
);
setUserDBIfNull();

export function startGame(
  difficulty: Difficulty,
  endGoal: EndGoal,
  townName: string,
  cheats: boolean,
) {
  let json: Game = { ...default_db }; // Use a copy of default_db
  json.economyAndLaws.max_tax_rate =
    max_tax_rates_based_on_difficulty[difficulty];
  json.endGoal = endGoal; // defaults to 'land' as in fill the grid.
  let default_plots = [] as any[][];
  // remove leading and trailing spaces, remove symbols other than nunbers and letters
  townName = townName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  json.townInfo.name = townName != "" ? townName : generateRandomTownName();
  json.difficulty = parseInt(difficulty);

  if (cheats) {
    json.devMode = true;
    json.townInfo.gold = 100000000;
    json.townInfo.happiness = 10000000;
    json.townInfo.health = 1000000;
    json.townInfo.knowledge_points = 100000;
    json.modifiers.happiness = 10000;
    json.modifiers.health = 10000;
    json.resources.food = 1000000;
    json.resources.wood = 1000000;
    json.resources.stone = 1000000;
    json.resources.metal = 1000000;
  }
  const randomSize =
    difficulty == "0" ? 8 : difficulty == "1" ? 12 : difficulty == "2" ? 16 : 1; // never should happen.
  const mineX = Math.floor((Math.random() * randomSize) / 2) + 1;
  const mineY = Math.floor((Math.random() * randomSize) / 2) + 1;

  for (let i = 0; i < randomSize; i++) {
    default_plots.push([]);
    for (let j = 0; j < randomSize; j++) {
      const water =
        i == mineX && j == mineY ? false : isWater(i, j, randomSize);

      default_plots[i][j] = {
        id: Math.random().toString(36).substring(2, 9),
        active: false,
        x: i,
        y: j,
        type: water ? -9 : -1,
        typeId: "",
        mineralSource: water
          ? false
          : mineX === i && mineY === j
            ? true
            : false,
        water: mineX === i && mineY === j ? false : water,
      };
    }
  }

  json.plots = default_plots;
  localStorage.reset = false;
  localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(json));
  DB.set(json); // Update the store with the new value
  location.reload();
}

function isWater(x: number, y: number, maxSize: number) {
  let chance = 0.06; // default chance of being water.
  if (x > 0 && y > 0 && x < maxSize - 1 && y < maxSize - 1) {
    chance *= 2;
  }
  if (y == Math.round(maxSize / 2) || y == Math.round(maxSize / 2) - 1) {
    chance *= 5;
  }
  if (x == 0 && y == 0) {
    chance = 0;
  }
  return Math.random() < chance;
}

function setUserDBIfNull() {
  if (localStorage.getItem(USER_DB_NAME) === null) {
    let def = default_user_db;
    def.username = "my_username_click_to_change";
    localStorage.setItem(USER_DB_NAME, JSON.stringify(def));
    userDB.set(def);
  }
}

function roundTo(n: number, digits: number) {
  if (digits === undefined) {
    digits = 0;
  }

  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  var test = Math.round(n) / multiplicator;
  return +test.toFixed(digits);
}

export function reverseClear(x: number, y: number, z: any) {
  // TODO: Use Game as type for z instead of any.
  let oldPlotType = z.plots[x][y].type;
  z.plots[x][y].type = -1;
  z.plots[x][y].active = false;

  if (oldPlotType > -1) {
    // Immediate variable changes
    z.townInfo.population_count -=
      options[oldPlotType].immediate_variable_changes.population;
    z.townInfo.population_max -=
      options[oldPlotType].immediate_variable_changes.population;
    z.townInfo.happiness -=
      options[oldPlotType].immediate_variable_changes.happiness;
    z.townInfo.health -= options[oldPlotType].immediate_variable_changes.health;
    // Effect modifiers
    z.modifiers.happiness = roundTo(
      z.modifiers.happiness / options[oldPlotType].effect_modifiers.happiness,
      2,
    );
    z.modifiers.health = roundTo(
      z.modifiers.health / options[oldPlotType].effect_modifiers.health,
      2,
    );
    // Employeer modifications
    z.townInfo.employees -= options[oldPlotType].requirements.employees;

    if (
      z.plotCounts[oldPlotType] === undefined ||
      z.plotCounts[oldPlotType] === null
    ) {
      z.plotCounts[oldPlotType] = 0;
    }
    z.plotCounts[oldPlotType]--;
    let size = options[oldPlotType].requirements.size ?? 1;
    if (size > 1) {
      for (let a = 0; a < z.plots.length; a++) {
        for (let b = 0; b < z.plots[x].length; b++) {
          if (
            z.plots[a][b].referencePlot != undefined &&
            z.plots[a][b].referencePlot[0] === x &&
            z.plots[a][b].referencePlot[1] === y
          ) {
            reverseClear(a, b, z);
          }
        }
      }
    }
  }

  z.lastChangeDay = z.environment.day;
  DB.set(z);
  localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
}

export function hasPlotOfType(type: string, z: Game) {
  let plotsOfType = [];
  for (let x = 0; x < z.plots.length; x++) {
    for (let y = 0; y < z.plots[x].length; y++) {
      if (
        z.plots[x][y].active == false ||
        z.plots[x][y] == null ||
        z.plots[x][y].type === null ||
        z.plots[x][y].type < 0
      ) {
        continue;
      }
      if (
        options[z.plots[x][y].type].id === type ||
        options[z.plots[x][y].type].type === type
      ) {
        plotsOfType.push(z.plots[x][y]);
      }
    }
  }

  return plotsOfType;
}

export function expandTown(z: Game, direction: string) {
  const numRows = z.plots.length;
  const numCols = numRows > 0 ? z.plots[0].length : 0;
  const newCols = direction == "east" ? 5 : 0;
  const newRows = direction == "south" ? 5 : 0;

  const requiredGuardians = Math.round(Math.pow(1.5, z.kingdom_expansions + 5));

  if (z.townInfo.guardians < requiredGuardians) {
    return `You need ${requiredGuardians - z.townInfo.guardians} more Guardians to expand the kingdom. See the City mgmt menu.`;
  }

  // East
  for (let i = 0; i < numRows; i++) {
    for (let j = numCols; j < numCols + newCols; j++) {
      z.plots[i].push({
        id: Math.random().toString(36).substring(2, 9),
        active: false,
        x: i,
        y: j,
        type: -1,
        typeId: "",
        mineralSource: false,
        water: false,
        disabled: false,
      });
    }
  }

  // South
  for (let i = numRows; i < numRows + newRows; i++) {
    const newRow: any[] = [];
    for (let j = 0; j < numCols + newCols; j++) {
      newRow.push({
        id: Math.random().toString(36).substring(2, 9),
        active: false,
        x: i,
        y: j,
        type: -1,
        typeId: "",
        mineralSource: false,
        water: false,
      });
    }
    z.plots.push(newRow);
  }

  z.kingdom_expansions++;

  DB.set(z);
}

export function clearDB(overridenFile: File | null = null) {
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
  localStorage.setItem(
    "showOnlyAffordable",
    localStorage.getItem("showOnlyAffordable") === "true" ? "false" : "true",
  );
}

export let modifyPlotMenuOptions = writable({
  visible: false,
  x: 0,
  y: 0,
  isMineralSource: false,
});

export let startGameMenu = writable({
  visible: false,
});

export function setUserDB(z: UserDatabase) {
  userDB.set(z);
  localStorage.setItem(USER_DB_NAME, JSON.stringify(z));
}

export let unique = writable({});
export let showTutorialStepConfetti = writable(false);
export let paused = writable(false);
// only when DB.environment.day is 1
export let showWelcome = writable(true);
export let showScoreboard = writable(false);
export let showKnowledgeMenu = writable(false);
export let showAchievementPopup = writable(false);
export let showLabMenu = writable(false);
export let settingLiegeLocation = writable(false);
export let showCityHallMenu = writable(false);
export let showCustomAlert = writable("");
export let showCompletedAchievements =
  localStorage.getItem("showCompletedAchievements") === "true"
    ? writable(true)
    : writable(false);
export let showOnlyAffordable =
  localStorage.getItem("showOnlyAffordable") === "true"
    ? writable(true)
    : writable(false);
export let pauseMenuTab =
  localStorage.getItem("pauseMenuTab") === "game"
    ? writable("game")
    : writable("achievements");
export let headerHeight = writable(250);
export let speed = writable(750);
