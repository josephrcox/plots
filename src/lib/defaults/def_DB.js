export const default_db = {
    plots: [],
    towninfo: {
        name: "Your town",
        gold: 1000,
        population: 0,
        happiness: 0,
        health: 0,
        total_visitors: 0,
    },
    environment: {
        day: 1,
        year: 1,
        avg_temp: -1, // -1 = none (needs to be set), 0 = cold, 1 = warm, 2 = hot
    }
}