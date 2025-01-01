import { writable } from "svelte/store";
// @ts-ignore
import { default_db, default_user_db } from "./objects/defaults/default_DB.js";
// @ts-ignore
import { Difficulty, EndGoal, Game, UserDatabase, Plot, Events } from "./types";
// @ts-ignore
import { max_tax_rates_based_on_difficulty } from "./objects/difficulty.js";
// @ts-ignore
import { options } from "./objects/PlotTypeOptions";
import { analyticsEvent } from "./utils.js";

// The active game DB is for the current game, challenge, or play-through.
//// This can get corrupted, so it is important to keep this separate from the user DB.
export const ACTIVE_GAME_DB_NAME = "plots_active_game_db";
// The user DB keeps track of progress, achievements,
//// challenge history, and such.
export const USER_DB_NAME = "plots_user_db";
export const TEMP_GAME_DB_NAME = "plots_temp_game_db";
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
  JSON.parse(
    localStorage.getItem(TEMP_GAME_DB_NAME) ||
      localStorage.getItem(ACTIVE_GAME_DB_NAME) ||
      "null",
  ),
);

export let userDB = writable(
  JSON.parse(localStorage.getItem(USER_DB_NAME) || "null"),
);
setUserDBIfNull();

export function startGame(
  difficulty: Difficulty,
  endGoal: EndGoal,
  townName: string,
  gameSettings: string[],
) {
  // clear DB
  localStorage.removeItem(ACTIVE_GAME_DB_NAME);
  DB.set(null);

  let json: Game = { ...default_db }; // Use a copy of default_db
  json.gameSettings = gameSettings;
  json.economyAndLaws.max_tax_rate =
    max_tax_rates_based_on_difficulty[difficulty];
  json.endGoal = endGoal; // defaults to 'land' as in fill the grid.
  let default_plots = [] as any[][];
  // remove leading and trailing spaces, remove symbols other than numbers and letters
  townName = townName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  json.townInfo.name = townName != "" ? townName : generateRandomTownName();
  json.difficulty = parseInt(difficulty);
  let udb = JSON.parse(localStorage.getItem(USER_DB_NAME) || "null");

  if (udb.username == "dev") gameSettings.push("devMode");
  if (gameSettings.includes("devMode")) {
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

  localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(json));
  DB.set(json); // Update the store with the new value
  localStorage.reset = false;
  if (udb.games == undefined) {
    udb.games = [];
    udb.selectedGame = 0;
    localStorage.setItem(USER_DB_NAME, JSON.stringify(udb));
  }
  udb.games.push(JSON.stringify(json));
  udb.selectedGame = udb.games.length - 1;
  localStorage.setItem(USER_DB_NAME, JSON.stringify(udb));

  analyticsEvent(json, Events.START_GAME, {
    difficulty: difficulty,
    end_goal: endGoal,
    settings: gameSettings.join(","),
  });

  location.reload();
}

export function isWater(x: number, y: number, maxSize: number) {
  let chance = 0.08; // default chance of being water.
  if (x > 0 && y > 0 && x < maxSize - 1 && y < maxSize - 1) {
    chance *= 2;
  }
  if (y == Math.round(maxSize / 2) || y == Math.round(maxSize / 2) - 1) {
    chance *= 3;
  }
  if (x == 0 && y == 0) {
    chance = 0;
  }

  const middleRow = Math.floor(maxSize / 2);

  if (y === middleRow) {
    return false;
  }
  return Math.random() < chance;
}

function setUserDBIfNull() {
  if (localStorage.getItem(USER_DB_NAME) === null) {
    let def = default_user_db;
    def.username = "click_to_set_username";
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

export function reverseClear(x: number, y: number, z: Game) {
  // TODO: Use Game as type for z instead of any.
  let oldPlotType = z.plots[x][y].type;
  z.plots[x][y].type = -1;
  z.plots[x][y].typeId = "";
  z.plots[x][y].active = false;

  if (oldPlotType > -1) {
    // Immediate variable changes
    z.townInfo.population_count -=
      options[oldPlotType].immediate_variable_changes.population;
    z.townInfo.population_max -=
      options[oldPlotType].immediate_variable_changes.population;
    // Employeer modifications
    z.townInfo.employees -= options[oldPlotType].requirements.employees;

    if (
      z.plotCounts[oldPlotType] === undefined ||
      z.plotCounts[oldPlotType] === null
    ) {
      z.plotCounts[oldPlotType] = 0;
    }
    z.plotCounts[oldPlotType]--;
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

export function isLiegeOnPlot(x: number, y: number, z: Game) {
  return (
    z.liege_location != null &&
    z.liege_location[0] === x &&
    z.liege_location[1] === y
  );
}

export function expandTown(z: Game, direction: string) {
  const numRows = z.plots.length;
  const numCols = numRows > 0 ? z.plots[0].length : 0;
  const newCols = direction == "east" ? 5 : 0;
  const newRows = direction == "south" ? 5 : 0;

  const requiredGuardians = Math.round(Math.pow(1.7, z.kingdom_expansions + 5));

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
        water: isWater(i, j, numRows + newRows),
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
        water: isWater(i, j, numRows + newRows),
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
  //location.reload();
}

export function toggleShowOnlyAffordable() {
  showOnlyAffordable.update((value) => !value);
  localStorage.setItem(
    "showOnlyAffordable",
    localStorage.getItem("showOnlyAffordable") === "true" ? "false" : "true",
  );
}

export function setLiegeLocation(x: number, y: number, z: Game) {
  z.liege_location = [x, y];
  settingLiegeLocation.set(false);
  const plots = document.querySelectorAll(".plot_container");
  plots.forEach((plot: any) => {
    plot.style.cursor = "";
  });

  DB.set(z);
}

export function setSelectedGame(index: number, newUserDB: UserDatabase) {
  syncActiveGameToUserDB();

  userDB.set(newUserDB);
  localStorage.setItem(USER_DB_NAME, JSON.stringify(newUserDB));

  userDB.update((udb) => {
    udb.selectedGame = index;

    if (udb.games[index] == undefined || udb.games[index] == null) {
      localStorage.setItem(ACTIVE_GAME_DB_NAME, "");
      DB.set(null);
      return udb;
    }

    const activeGameDB = JSON.parse(udb.games[index]);
    DB.set(activeGameDB);
    localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(activeGameDB));
    localStorage.setItem(USER_DB_NAME, JSON.stringify(udb));
    return udb;
  });
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
export let disabledPlotMenu = writable({
  visible: false,
  plotName: "",
  location: "",
  missingResources: [] as string[],
  plotCost: 0,
  x: 0,
  y: 0,
});

export function syncActiveGameToUserDB() {
  const currentGame = JSON.parse(
    localStorage.getItem(ACTIVE_GAME_DB_NAME) ?? "",
  );
  if (!currentGame) return;

  const userDBData = JSON.parse(localStorage.getItem(USER_DB_NAME) ?? "");
  if (!userDBData || userDBData.selectedGame === undefined) return;

  userDBData.games[userDBData.selectedGame] = JSON.stringify(currentGame);

  localStorage.setItem(USER_DB_NAME, JSON.stringify(userDBData));
  userDB.set(userDBData);
}
