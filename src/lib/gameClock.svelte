<script lang="ts">
  import { onMount } from "svelte";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    paused,
    speed,
    clearDB,
    hasPlotOfType,
    userDB,
    USER_DB_NAME,
    showAchievementPopup,
    showTutorialStepConfetti,
    showCustomAlert,
  } from "./store";
  import { messages } from "./objects/TownLogMessages.js";
  import { options } from "./objects/PlotTypeOptions";
  import { winScenarios } from "./objects/WinScenarios.js";
  import { achievements } from "./objects/AchievementList";
  import { tutorialMessages } from "./objects/tutorial_messages";
  import { isAdjacentToWater, randomizeNumber } from "./utils";
  import { laws } from "./objects/Laws";
  import { Achievement, Game, TownLog, Vibe } from "./types.js";

  let z = $DB;
  const GAME_TICK_SPEED = 30;

  type resourceObject = {
    food: number;
    wood: number;
    stone: number;
    metal: number;
    bureaucracy: number;
    power: number;
  };

  function performWeeklyTasks(db: Game) {
    db = _taxRateEffects(db);
    db = _healthEffects(db); //////////
    db = _checkSpecialPlots(db);
    db = _adjustKnowledgeGoldMarketRates(db);
    db = _bringModifiersBackToNormal(db);

    db = _warnUser(db);
    const startResources = {
      food: db.resources.food,
      wood: db.resources.wood,
      stone: db.resources.stone,
      metal: db.resources.metal,
      bureaucracy: db.resources.bureaucracy,
      power: db.resources.power,
    };
    db = _generateResources(db);
    db = _lawEffects(db);
    db = _handleActiveCosts(db);
    db = _calculatePower(db);
    db = _calculateKnowledge(db);
    db = _feedCitizens(db);
    const endResources = {
      food: db.resources.food,
      wood: db.resources.wood,
      stone: db.resources.stone,
      metal: db.resources.metal,
      bureaucracy: db.resources.bureaucracy,
      power: db.resources.power,
    };
    if (db.environment.day % 14 === 0) {
      db = _applyModifiers(db);
    }
    db = _calculateResourceRates(db, startResources, endResources);

    return db;
  }

  function performMonthlyTasks(db: Game) {
    db = _banksEffect(db);
    db = _reactToProductivity(db);
    db = _mineEffects(db);
    db = _bringStatsBackToNormal(db);
    db = _unemployment(db);
    return db;
  }

  function performQuarterlyTasks(db: Game) {
    db = _boredom(db);
    db = _movePeopleInMovePeopleOut(db);
    db = _checkPlotCountForEffect(db);

    return db;
  }

  function performDailyTasks(db: Game) {
    db = _calculateProfits(db);
    db = _fixVariables(db);
    db = _checkExperiment(db);

    if (db.overtime == false) {
      db = _checkGameLost(db);
      db = _checkGameWin(db);
    }
    db = _setTutorialStep(db);
    db = _checkForAchievements(db);

    return db;
  }

  export function mainGameThreadLoop() {
    DB.update((currentDB) => {
      if (currentDB == null) {
        return currentDB;
      }
      currentDB.tick++;
      if (currentDB.tick % GAME_TICK_SPEED !== 0) {
        return currentDB;
      }
      if (
        $paused ||
        !currentDB ||
        (currentDB.endGameDetails.msg !== "" && currentDB.overtime == false) ||
        currentDB.townInfo.population_count <= 0
      ) {
        return currentDB;
      }

      try {
        currentDB.environment.day += 1;

        // Weekly, Monthly, Quarterly tasks
        if (currentDB.environment.day % 7 === 0) {
          currentDB = performWeeklyTasks(currentDB);
        }
        if (currentDB.environment.day % 30 === 0) {
          currentDB = performMonthlyTasks(currentDB);
        }
        if (currentDB.environment.day % 90 === 0) {
          currentDB = performQuarterlyTasks(currentDB);
        }
        if (window.location.search.includes("debug=true")) {
          console.log(currentDB);
        }

        currentDB = performDailyTasks(currentDB);
        return currentDB;
      } catch (error) {
        console.error("Error in game loop:", error);
        return currentDB; // Returning the current state in case of an error
      }
    });
  }

  DB.subscribe((currentDB) => {
    if (currentDB) {
      localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(currentDB));
    }
  });
  userDB.subscribe((currentDB) => {
    if (currentDB) {
      localStorage.setItem(USER_DB_NAME, JSON.stringify(currentDB));
    }
  });

  function _checkSpecialPlots(z: Game) {
    // this function checks and updates if the city has a bank, hospital, and city hall
    let hasBank = false;
    let hasHospital = false;
    let hasCityHall = false;
    let hasLab = false;

    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
          let plotOptionForPlot = options[z.plots[i][j].type].id;
          if (plotOptionForPlot == "bank") {
            hasBank = true;
          }
          if (plotOptionForPlot == "city_hall") {
            hasCityHall = true;
          }
          if (
            plotOptionForPlot == "small_hospital" ||
            plotOptionForPlot == "large_hospital"
          ) {
            hasHospital = true;
          }
          if (plotOptionForPlot == "lab") {
            hasLab = true;
          }
        }
      }
    }
    z.hasBank = hasBank;
    z.hasHospital = hasHospital;
    z.hasCityHall = hasCityHall;
    z.hasLab = hasLab;
    return z;
  }

  function _isAllPlotsFilled(z: Game) {
    let result = true;
    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == false) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  function _reactToProductivity(z: Game) {
    const productivityPercentage = z.townInfo.productivity;
    let multiplier = 1; // will be multiplied to get new happiness. higher == better.
    if (productivityPercentage > 50 && productivityPercentage < 100) {
      // Happy citizens
      multiplier = 1.05;
    } else if (productivityPercentage == 100) {
      // Typical, no change needed.
      return z;
    } else if (productivityPercentage < 50) {
      multiplier = 1.2;
    } else if (productivityPercentage > 100 && productivityPercentage < 125) {
      multiplier = 0.98;
    } else if (productivityPercentage > 125 && productivityPercentage < 150) {
      multiplier = 0.96;
    } else if (productivityPercentage > 150 && productivityPercentage < 175) {
      multiplier = 0.9;
    } else if (productivityPercentage > 175 && productivityPercentage < 200) {
      // Extremely upset
      multiplier = 0.8;
    }
    const before = z.townInfo.happiness;
    z.townInfo.happiness *= multiplier;

    if (multiplier > 1.0) {
      z = addToTownLog(
        `Happiness has gone up by ${Math.round((z.townInfo.happiness / before) * 100)}% due to productivity.`,
        z,
        Vibe.GOOD,
      );
    } else {
      z = addToTownLog(
        `Happiness has gone down by ${100 - Math.round((z.townInfo.happiness / before) * 100)}% due to productivity.`,
        z,
        Vibe.BAD,
      );
    }

    return z;
  }

  function _warnUser(z: Game) {
    if (z.endGameDetails != null) {
      return z;
    }
    // if happiness or health is lower than 25, then warn the user via an alert. change z.last_warning_happiness and for health to the day triggered and only show if it hasn't been shown in 90 days
    if (z.townInfo.happiness < 70) {
      if (z.last_warning_happiness + 365 < z.environment.day) {
        showCustomAlert.set(
          "Your citizens are very unhappy. You should do something about it.",
        );
        z.last_warning_happiness = z.environment.day;
      }
    }
    if (z.townInfo.health < 70) {
      if (z.last_warning_health + 365 < z.environment.day) {
        showCustomAlert.set(
          "Your citizens are very unhealthy. You should do something about it.",
        );
        z.last_warning_health = z.environment.day;
      }
    }
    return z;
  }

  function _feedCitizens(z: Game) {
    // Each citizen needs 1 food per day. This removes it, with a tiny bit of randomness.
    // If there is not enough food, then affect happiness by setting the happiness multiplier to z.modifiers.happiness * 0.95, and the same for z.modifiers.health
    const foodNeeded = z.townInfo.population_count;
    const foodAvailable = z.resources.food;
    if (foodAvailable < foodNeeded) {
      z.modifiers.happiness *= 0.95;
      z.modifiers.health *= 0.95;
      z = addToTownLog("There isn't enough food for everyone!", z, Vibe.BAD);
      z.resources.food = 0;
    } else {
      z.townLog = z.townLog.filter(
        (log) => !log.message.includes("There isn't enough food for everyone!"),
      );
      z.resources.food -= foodNeeded;
    }
    z.resources.food = Math.round(z.resources.food);
    return z;
  }

  function _generateResources(z: Game) {
    const productivityPercentage = z.townInfo.productivity;
    let multiplier = 1; // will be multiplied to get new happiness. higher == better.
    if (productivityPercentage < 50) {
      multiplier = 0.5;
    } else if (productivityPercentage > 50 && productivityPercentage < 100) {
      // Happy citizens
      multiplier = 0.75;
    } else if (productivityPercentage == 100) {
      // Typical, no change needed.
      multiplier = 1;
    } else if (productivityPercentage > 100 && productivityPercentage < 125) {
      multiplier = 1.25;
    } else if (productivityPercentage > 125 && productivityPercentage < 150) {
      multiplier = 1.75;
    } else if (productivityPercentage > 150 && productivityPercentage < 175) {
      multiplier = 3;
    } else if (productivityPercentage > 175 && productivityPercentage < 200) {
      // Extremely upset
      multiplier = 5;
    }
    multiplier = randomizeNumber(multiplier, 2);
    let hasLumberMillMultiplier = hasPlotOfType("lumber_mill", z).length * 1.25;
    if (hasLumberMillMultiplier === 0) hasLumberMillMultiplier = 1;

    // This iterates over each plot that is placed, and generates resources based on the plot type.
    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
          // check if the plot is adjacent to a water plot
          let nearWater = isAdjacentToWater(i, j, z);

          let plotOptionForPlot = options[z.plots[i][j].type];
          if (plotOptionForPlot.generated_resources != null) {
            z.resources.food +=
              Math.round(
                plotOptionForPlot.generated_resources.food * multiplier,
              ) * (nearWater ? 2 : 1);

            z.resources.wood += Math.round(
              plotOptionForPlot.generated_resources.wood *
                multiplier *
                hasLumberMillMultiplier,
            );
            z.resources.stone += Math.round(
              plotOptionForPlot.generated_resources.stone * multiplier,
            );
            z.resources.metal += Math.round(
              plotOptionForPlot.generated_resources.metal * multiplier,
            );
            z.resources.bureaucracy += Math.round(
              plotOptionForPlot.generated_resources.bureaucracy * multiplier,
            );
          }
        }
      }
    }
    z.resources.food = Math.round(z.resources.food);
    z.resources.wood = Math.round(z.resources.wood);
    z.resources.stone = Math.round(z.resources.stone);
    z.resources.metal = Math.round(z.resources.metal);
    z.resources.bureaucracy = Math.round(z.resources.bureaucracy);

    return z;
  }

  enum ResourceKey {
    food = "food",
    wood = "wood",
    stone = "stone",
    metal = "metal",
    bureaucracy = "bureaucracy",
  }

  function _handleActiveCosts(z: Game) {
    // Some plots have active costs which can be found at let plotOptionForPlot = options[z.plots[i][j].type].active_costs with keys.
    // This function reads the active costs, and checks if we have enough resources for each to cover.
    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
          let plotOptionForPlot = options[z.plots[i][j].type];
          // Iterate over the keys of active_costs
          let toBeDisabled = false;
          Object.keys(plotOptionForPlot.active_costs).forEach(
            (resource, index) => {
              const requiredQuantity = Object.values(
                plotOptionForPlot.active_costs,
              )[index];
              // Power is handled by _calculatePower function
              if (resource != "power") {
                let currentInventoryForResource = z.townInfo.gold;
                if (resource == "gold") {
                  if (z.townInfo.gold < requiredQuantity) {
                    toBeDisabled = true;
                  } else {
                    z.townInfo.gold -= requiredQuantity;
                  }
                } else {
                  if (z.resources[resource as ResourceKey] < requiredQuantity) {
                    toBeDisabled = true;
                  } else {
                    z.resources[resource as ResourceKey] -= requiredQuantity;
                  }
                }
              }
            },
          );
          // A plot is disabled if it can not afford the active costs.
          z.plots[i][j].disabled = toBeDisabled;
          if (z.plots[i][j].disabled) {
            z.townInfo.happiness -= 1;
          }

          if (
            toBeDisabled &&
            options[z.plots[i][j].type].type == "residential"
          ) {
            z.townInfo.population_count -= 1;
            z.townInfo.employees -= 1;
          }
        }
      }
    }
    return z;
  }

  function _calculatePower(z: Game) {
    let runningTotal = 0;
    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
          let plotOptionForPlot = options[z.plots[i][j].type];
          if (plotOptionForPlot.active_costs.power != 0) {
            runningTotal -= plotOptionForPlot.active_costs.power;
          }
          if (plotOptionForPlot.generated_resources.power != 0) {
            runningTotal += plotOptionForPlot.generated_resources.power;
          }
        }
      }
    }
    z.resources.power = runningTotal;

    if (z.resources.power < 0) {
      z.modifiers.happiness * 0.98;
      z.townInfo.happiness -= 5;
      z = addToTownLog(
        "🔋 POWER SHORTAGE. HAPPINESS DROPPING THROUGH BLACKOUTS.",
        z,
        Vibe.BAD,
      );
    }

    return z;
  }

  function _calculateResourceRates(
    z: Game,
    startResources: resourceObject,
    endResources: resourceObject,
  ) {
    // This function calculates the rate of resource generation per week
    z.resource_rate.food = roundTo(endResources.food - startResources.food, 2);
    z.resource_rate.wood = roundTo(endResources.wood - startResources.wood, 2);
    z.resource_rate.stone = roundTo(
      endResources.stone - startResources.stone,
      2,
    );
    z.resource_rate.metal = roundTo(
      endResources.metal - startResources.metal,
      2,
    );
    z.resource_rate.bureaucracy = roundTo(
      endResources.bureaucracy - startResources.bureaucracy,
      2,
    );
    return z;
  }

  function _checkGameWin(z: Game) {
    // TODO, deleting until ready with TS.

    return z;
  }

  function _checkForAchievements(z: Game) {
    if (z.devMode) {
      return z;
    }
    let user_db = $userDB;
    for (let i = 0; i < achievements.length; i++) {
      if (
        user_db.achievements.find(
          (a: String[]) => a[0] == achievements[i].id,
        ) == null
      ) {
        if (achievements[i].check(z)) {
          user_db.achievements.push([
            achievements[i].id,
            z.environment.day,
            z.townInfo.name,
          ]);
          $paused = true;
          $showAchievementPopup = true;
        }
      }
    }

    userDB.update(() => {
      return user_db;
    });
    return z;
  }

  let doNotCheckTutorialStep = false;

  function _setTutorialStep(z: Game) {
    if (doNotCheckTutorialStep) {
      return z;
    }
    // Goes through the tutorialMessages array, and finds the first one that is not yet completed.
    // If a tutorial step goes up by 1, then the gold reward is added to the town's gold.
    for (let i = z.currentTutorialStep; i < z.currentTutorialStep + 1; i++) {
      if (tutorialMessages[i].isComplete(z)) {
        $showTutorialStepConfetti = true;
        doNotCheckTutorialStep = true;
        // wait 3 seconds to trigger again
        setTimeout(() => {
          $showTutorialStepConfetti = false;
          z.currentTutorialStep++; //
          z.townInfo.gold += tutorialMessages[i].goldReward;
          doNotCheckTutorialStep = false;
        }, 1000);
        break;
      }
    }

    return z;
  }

  function _checkGameLost(z: Game) {
    // GAME LOSS SCENARIOS
    if (z.townInfo.happiness <= 3) {
      z.townInfo.happiness = 0;
      z.endGameDetails = {
        msg: messages.happiness_zero,
        win: false,
        still_playing: false,
      };
    }
    if (z.townInfo.health <= 3) {
      z.townInfo.health = 3;
      z.endGameDetails = {
        msg: messages.health_zero,
        win: false,
        still_playing: false,
      };
    }
    if (z.townInfo.population_count <= 0 && z.townInfo.population_max > 0) {
      z.townInfo.population_count = 0;
      z.endGameDetails = {
        msg: messages.population_zero,
        win: false,
        still_playing: false,
      };
    }
    return z;
  }

  function _unemployment(z: Game) {
    let unemployed = z.townInfo.population_count - z.townInfo.employees;
    if (unemployed > 0) {
      let toRemove = unemployed * 0.2;
      if (toRemove < 15) {
        toRemove = 15;
      }
      z.townInfo.happiness -= toRemove;
      z = addToTownLog(unemployed + messages.unemployment_num, z, Vibe.BAD);
    } else {
      z.townLog = z.townLog.filter(
        (log) => !log.message.includes(messages.unemployment_num),
      );
    }
    return z;
  }

  function _banksEffect(z: Game) {
    // Check if there are any banks and store the count of banks
    if (z.hasBank === true) {
      // TODO
    }
    return z;
  }

  function _checkPlotCountForEffect(z: Game) {
    let totalPlotsPlaced = z.plotCounts.reduce((a, b) => a + b, 0);
    let negativeEffect = false;
    let plotCausingNegativeEffect = "";

    for (let i = 0; i < z.plotCounts.length; i++) {
      if (z.plotCounts[i] == null || options[i].check_for_variety != true) {
        continue;
      }

      const dif: number = z.difficulty;

      if (z.plotCounts[i] / totalPlotsPlaced >= 0.25) {
        plotCausingNegativeEffect = options[i].title;

        negativeEffect = true;
      }
    }
    if (negativeEffect) {
      z = addToTownLog(messages.notEnoughVariety, z, Vibe.BAD);
      z.modifiers.happiness * 0.95;
    }

    return z;
  }

  function _lawEffects(z: Game) {
    // Looks at laws enacted in the economyAndLaws object, and applies effects to the town.
    for (let i = 0; i < z.economyAndLaws.enacted.length; i++) {
      let l = laws.find((l) => l.id == z.economyAndLaws.enacted[i]);
      if (l != null) {
        if (l.weekly_effect != null) {
          z = l.weekly_effect(z);
        }
      }
    }
    return z;
  }

  function _healthEffects(z: Game) {
    let health = z.townInfo.health;
    let peopleLeaving = 0;

    if (health > 50) return z;

    if (health < Math.random() * 50) {
      if (health < 25) {
        z = addToTownLog(messages.sickAndDying, z, Vibe.BAD);
        z.townInfo.happiness -= 10;
        // 10% of population
        peopleLeaving = Math.round(z.townInfo.population_count * 0.1);
      } else {
        z = addToTownLog(messages.sickAndLeaving, z, Vibe.BAD);
        z.townInfo.happiness -= 5;
        // 5%
        peopleLeaving = Math.round(z.townInfo.population_count * 0.05);
      }
      z.townInfo.population_count -= peopleLeaving;
      z.townInfo.employees -= peopleLeaving;
    }
    return z;
  }

  function _boredom(z: Game) {
    // check if to proceed based on z.townInfo.community. Pick a random number and if it's under 100, then proceed.
    if (z.townInfo.community < 100) {
      if (Math.random() * 100 < z.townInfo.community) {
        return z;
      }
    }
    if (
      z.lastChangeDay + (Math.random() * 500 + 365) < z.environment.day &&
      z.townInfo.population_count > 0
    ) {
      if (z.townInfo.population_count > 0) {
        z.townInfo.population_count -= 1;
        z.townInfo.employees -= 1;
        z.modifiers.happiness -= 0.01;
        z = addToTownLog(messages.bored, z, Vibe.BAD);
      }
    } else {
      z.townLog = z.townLog.filter(
        (log) => !log.message.includes(messages.bored),
      );
    }
    return z;
  }

  function _adjustKnowledgeGoldMarketRates(z: Game) {
    let currentRate =
      z.economyAndLaws.knowledge_gold_market_rates[
        z.economyAndLaws.knowledge_gold_market_rates.length - 1
      ] || 1;
    const lowerLimit = -100;
    const maxJump = 8;
    const maxChange = 3;

    let randomness = Math.random();
    let changeAmount = Math.random() * maxChange; /////////

    if (randomness < 0.4) {
      let jump = Math.random() * maxJump;
      if (Math.random() < 0.5) {
        currentRate += jump;
      } else {
        currentRate -= jump;
      }
    } else {
      if (Math.random() > 0.5) {
        currentRate += changeAmount;
      } else {
        currentRate -= changeAmount;
      }
    }

    if (currentRate < lowerLimit) {
      currentRate += (Math.random() * changeAmount) / 5;
    }
    // round to whole closest whole, either up or down/////
    currentRate = Math.round(currentRate);

    z.economyAndLaws.knowledge_gold_market_rates = [
      ...z.economyAndLaws.knowledge_gold_market_rates,
      currentRate,
    ];

    return z;
  }

  function _movePeopleInMovePeopleOut(z: Game) {
    if (z.townInfo.population_count < z.townInfo.population_max) {
      if (z.townInfo.happiness > 50) {
        let availableSpots =
          z.townInfo.population_max - z.townInfo.population_count;
        // add a number of people relative to the happiness where 100 is max happiness
        let newPeople = Math.round(
          (z.townInfo.happiness / 100) * availableSpots,
        );
        z.townInfo.population_count += newPeople;
        if (z.townInfo.population_count > z.townInfo.population_max) {
          z.townInfo.population_count = z.townInfo.population_max;
        }
        // When people arrive, so does employment
        z.townInfo.employees += newPeople;
        if (z.townInfo.employees > z.townInfo.population_count) {
          z.townInfo.employees = z.townInfo.population_count;
        }
        z = addToTownLog(newPeople + messages.new_people_num, z, Vibe.NORMAL);
      }
    }
    if (z.townInfo.happiness < 50 && z.townInfo.population_count > 0) {
      // When the happiness is low, some people should leave
      let unhappyPeople = Math.round((100 - z.townInfo.happiness) / 5);
      // If community is around 150 (default), then some people leave.
      // If community drops, then more people leave.
      // If community rises, then less people leave.
      unhappyPeople = unhappyPeople * (z.townInfo.community / 200);
      z.townInfo.population_count -= unhappyPeople;
      // When people leave, so does employment
      if (z.townInfo.employees > 0) {
        z.townInfo.employees -= unhappyPeople;
      }

      z = addToTownLog(unhappyPeople + messages.leave_town_num, z, Vibe.BAD);
    } else {
      if (z.townInfo.population_count == z.townInfo.population_max) {
        // z = addToTownLog(messages.people_want_to_move_in, z);
      }
    }
    return z;
  }

  function _taxRateEffects(z: Game) {
    const randomness = Math.random();
    if (
      z.economyAndLaws.tax_rate > z.economyAndLaws.max_tax_rate &&
      z.townInfo.population_count > 0
    ) {
      let bankModifier = 1;

      if (z.hasBank) {
        // If they have a bank, then the actual max tax rate should be 2x higher.
        bankModifier = 2;
      }

      const lenientChance = // higher == more lenient
        z.difficulty == 0 ? 0.7 : z.difficulty == 1 ? 0.4 : 0.2;
      if (randomness < lenientChance) {
        if (
          z.economyAndLaws.tax_rate >
          z.economyAndLaws.max_tax_rate * 2 * bankModifier
        ) {
          z.modifiers.happiness -= 0.02;
          z = addToTownLog(
            messages.very_high_tax_rate +
              "  (" +
              z.economyAndLaws.tax_rate +
              "%)",
            z,
            Vibe.BAD,
          );
        } else {
          z.modifiers.happiness -= 0.01;
          z = addToTownLog(
            messages.high_tax_rate +
              "  (" +
              z.economyAndLaws.tax_rate * 100 +
              "%)",
            z,
            Vibe.BAD,
          );
        }
      } else {
        // No leniency applied
        z.modifiers.happiness -= 0.01;
        z = addToTownLog(
          messages.high_tax_rate +
            "  (" +
            z.economyAndLaws.tax_rate * 100 +
            "%)",
          z,
          Vibe.BAD,
        );
      }
    }
    return z;
  }

  export function _checkExperiment(z: Game) {
    if (z.lab.active_experiment == null) return z;
    let active = z.lab.active_experiment;
    if (active.duration > 0) {
      z.lab.active_experiment.duration -= 1;
    } else {
    }
    return z;
  }

  export function _fixVariables(z: Game) {
    if (z.townInfo.happiness < 0) {
      z.townInfo.happiness = 0;
    }
    if (z.townInfo.health < 0) {
      z.townInfo.health = 0;
    }
    if (z.townInfo.community < 0) {
      z.townInfo.community = 0;
    }
    if (z.townInfo.gold < 0) {
      z.townInfo.gold = 0;
    }
    if (z.townInfo.employees < 0) {
      z.townInfo.employees = 0;
    }
    if (z.townInfo.knowledge_points < 0) {
      z.townInfo.knowledge_points = 0;
    }
    if (z.townInfo.population_count < 0) {
      z.townInfo.population_count = 0;
    }

    z.economyAndLaws.weeklyProfit = roundTo(z.economyAndLaws.weeklyProfit, 0);
    if (z.townInfo.employees > z.townInfo.population_count) {
      z.townInfo.employees = z.townInfo.population_count;
    }

    z.townInfo.gold = roundTo(z.townInfo.gold, 0);
    z.townInfo.population_count = roundTo(z.townInfo.population_count, 0);
    z.townInfo.employees = roundTo(z.townInfo.employees, 0);
    z.townInfo.population_max = roundTo(z.townInfo.population_max, 0);
    z.townInfo.happiness = roundTo(z.townInfo.happiness, 2);
    z.townInfo.health = roundTo(z.townInfo.health, 2);
    z.townInfo.knowledge_points = roundTo(z.townInfo.knowledge_points, 0);

    if (z.townInfo.happiness > z.maximums.happiness) {
      // Maxed out happiness
      z.townInfo.happiness = z.maximums.happiness;
    }
    if (z.townInfo.health > z.maximums.health) {
      // Maxed out health
      z.townInfo.health = z.maximums.health;
    }
    if (z.townInfo.community > 300) {
      // Maxed out health
      z.townInfo.community = 300;
    }
    // If modifiers are below 0.50, set to 0.50
    if (z.modifiers.happiness < 0.5) {
      z.modifiers.happiness = 0.5;
    }
    if (z.modifiers.health < 0.5) {
      z.modifiers.health = 0.5;
    }
    if (z.modifiers.community < 0.5) {
      z.modifiers.community = 0.5;
    }
    return z;
  }

  export function _bringModifiersBackToNormal(z: Game) {
    const modifierVariable = 0.1;
    if (z.modifiers.happiness > 1.0) {
      // check % above 1.0 that z.modifiers.happiness is, and get it X% closer to 1.0
      let percentAboveOne = z.modifiers.happiness - 1.0;
      z.modifiers.happiness -= percentAboveOne * modifierVariable;
      if (z.modifiers.happiness < 1.02) {
        z.modifiers.happiness = 1.0;
      }
    }
    if (z.modifiers.community > 1.0) {
      let percentAboveOne = z.modifiers.community - 1.0;
      z.modifiers.community -= percentAboveOne * modifierVariable;
      if (z.modifiers.community < 1.02) {
        z.modifiers.community = 1.0;
      }
    }
    if (z.modifiers.health > 1.0) {
      if (hasPlotOfType("healing_house", z).length > 0) {
        z = addToTownLog(messages.hospital_advantage, z, Vibe.GOOD);
        let percentAboveOne = z.modifiers.health - 1.0;
        z.modifiers.health -=
          percentAboveOne * hasPlotOfType("healing_house", z).length
            ? 0.03
            : 0.06;
        if (z.modifiers.health < 1.02) {
          z.modifiers.health = 1.0;
        }
      } else {
        let percentAboveOne = z.modifiers.health - 1.0;
        z.modifiers.health -= percentAboveOne * modifierVariable;
        if (z.modifiers.health < 1.02) {
          z.modifiers.health = 1.0;
        }
      }
    } else {
      if (hasPlotOfType("healing_house", z).length > 0) {
        z.modifiers.health += 0.1;
      }
    }
    return z;
  }

  export function _bringStatsBackToNormal(z: Game) {
    const midpoint = 150;
    if (z.townInfo.happiness > midpoint) {
      // check % above 1.0 that z.modifiers.happiness is, and get it 8% closer to 1.0
      let percentAboveOne = z.townInfo.happiness - midpoint;
      z.townInfo.happiness -= percentAboveOne * 0.08;
      if (z.townInfo.happiness < midpoint) {
        z.townInfo.happiness = midpoint;
      }
    }
    if (z.townInfo.health > midpoint) {
      // check % above 1.0 that z.modifiers.happiness is, and get it 8% closer to 1.0
      let percentAboveOne = z.townInfo.health - midpoint;
      z.townInfo.health -= percentAboveOne * 0.08;
      if (z.townInfo.health < midpoint) {
        z.townInfo.health = midpoint;
      }
    }
    if (z.townInfo.community > midpoint) {
      // check % above 1.0 that z.modifiers.happiness is, and get it 8% closer to 1.0
      let percentAboveOne = z.townInfo.community - midpoint;
      z.townInfo.community -= percentAboveOne * 0.08;
      if (z.townInfo.community < midpoint) {
        z.townInfo.community = midpoint;
      }
    }
    return z;
  }

  function _calculateProfits(z: Game) {
    z.economyAndLaws.weeklyProfit = 0;
    // Calculate profits by checking plots and doing (plot.revenue_per_week * tax_rate)
    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
          if (z.plots[i][j].disabled === true) {
            // Don't collect profits from this. Instead, cost the amount that it's meant to generate.
            const plotOptionForPlot = options[z.plots[i][j].type];
            const profit =
              (getProfit(
                plotOptionForPlot.revenue_per_week,
                z,
                plotOptionForPlot.type,
              ) *
                (z.townInfo.productivity / 100)) /
              7;

            z.townInfo.gold -= profit;
            z = addToTownLog(
              `🚨 ${plotOptionForPlot.title} at ${j}, ${i} is disabled and costing you $${profit} a week!`,
              z,
              Vibe.BAD,
            );
          } else {
            // Iterate through all plots and do actions based on their conditions
            const plotOptionForPlot = options[z.plots[i][j].type];
            let profit =
              (getProfit(
                plotOptionForPlot.revenue_per_week,
                z,
                plotOptionForPlot.type,
              ) *
                (z.townInfo.productivity / 100)) /
              7;
            console.log(`profit 2: ${profit}`);
            let nearWater = isAdjacentToWater(i, j, z);
            profit *= nearWater ? 2 : 1;
            z.townInfo.gold += profit;
            z.economyAndLaws.weeklyProfit += profit * 7;
          }
        }
      }
    }
    return z;
  }

  function _applyModifiers(z: Game) {
    z.townInfo.happiness *= z.modifiers.happiness;
    z.townInfo.health *= z.modifiers.health;
    z.townInfo.community *= z.modifiers.community;
    return z;
  }

  function _mineEffects(z: Game) {
    if (hasPlotOfType("mine", z).length > 0) {
      // When a mine is in the town, the health should be hurt.
      // This is called monthly, and every month, the health modifier should drop by 0.01
      z.modifiers.health -= 0.01;
      if (hasPlotOfType("healing_house", z).length == 0) {
        z = addToTownLog(
          "The mine is actively hurting the health of the town. Time to look into a healing house.",
          z,
          Vibe.BAD,
        );
      }
    }

    return z;
  }

  function _calculateKnowledge(z: Game) {
    let starting = 0;
    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
          let plotOptionForPlot = options[z.plots[i][j].type];
          if (plotOptionForPlot.knowledge_points_per_month != null) {
            z.townInfo.knowledge_points += Math.round(
              plotOptionForPlot.knowledge_points_per_month / 4,
            );
            starting += plotOptionForPlot.knowledge_points_per_month;
          }
        }
      }
    }
    z.resource_rate.knowledge = roundTo(starting / 4, 0);
    return z;
  }

  function addToTownLog(message: string, z: Game, vibe: Vibe) {
    let log = z.townLog || [];
    // push to start of array
    log.unshift({
      message: message,
      day: z.environment.day,
      vibe: vibe,
    });
    return z;
  }

  function getProfit(revenue: number, z: Game, type: string) {
    // This takes in revenue, and returns the gold profit.
    // Profit is revenue * tax rate * percentage of population out of the max population
    let profitModifiers = z.townInfo.happiness / 100;
    if (profitModifiers > 2.0) {
      profitModifiers = 2.0;
    } else if (profitModifiers < 0.75) {
      profitModifiers = 0.75;
    }

    if (
      profitModifiers < 1 &&
      z.environment.day % 30 == 0 &&
      z.townLog.filter((log) =>
        log.message.includes(
          "When townspeople are unhappy, they spend less money (and you get less).",
        ),
      ).length == 0
    ) {
      z = addToTownLog(
        `When townspeople are unhappy, they spend less money (and you get less).`,
        z,
        Vibe.BAD,
      );
    } else {
      // remove it
      z.townLog = z.townLog.filter(
        (log) =>
          !log.message.includes(
            "When townspeople are unhappy, they spend less money (and you get less).",
          ),
      );
    }

    if (hasPlotOfType("village_inn", z).length > 0) {
      // Has village inn.
      if (type == "shop") {
        profitModifiers *= 1.3;
      }
    }

    let profit = Math.round(
      revenue *
        z.economyAndLaws.tax_rate *
        (z.townInfo.population_count / z.townInfo.population_max) *
        profitModifiers *
        (z.economyAndLaws.enacted.includes("tax_free") ? -1 : 1),
    );
    return roundTo(profit, 2);
  }

  function roundTo(n: number, digits: number) {
    if (digits === undefined) {
      digits = 0;
    }

    let m = Math.pow(10, digits);
    n = parseFloat((n * m).toFixed(11));
    let test = Math.round(n) / m;
    return +test.toFixed(digits);
  }

  onMount(async () => {
    while (true) {
      if (localStorage.reset == "true") {
        clearDB();
        localStorage.setItem("reset", "false");
      }

      mainGameThreadLoop();
      await new Promise((r) => setTimeout(r, $speed / GAME_TICK_SPEED));
    }
  });
</script>
