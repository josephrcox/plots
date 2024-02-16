export type Difficulty = '0' | '1' | '2' | '3';
export type EndGoal = 'land';
export type Plot = {
    id: string;
    active: boolean;
    x: number;
    y: number;
    type: number;
}

export type Game = {
    plots: Plot[][];
    lastChangeDay: number;
    townLog: string,
    townInfo: {
        name: string;
        gold: number;
        gold_from_tourism: number;
        population_count: number;
        population_max: number;
        employees: number;
        happiness: number;
        health: number;
        knowledge_points: number;
    },
    hasCityHall: boolean;
    hasBank: boolean;
    modifiers: {
        happiness: number;
        health: number;
    },
    economyAndLaws: {
        tax_rate: number;
        max_tax_rate: number;
        balance_sheet_history: any[];
        last_month_profit: number;
    },
    plotCounts: [][];
    environment: {
        day: number;
        year: number;
        climate: number;
    }
    difficulty: number;
    endGoal: EndGoal;
    endGameDetails: {
        msg: string;
        win: boolean;
    }
    tick: number;

}

export type PlotOption = {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    description: string;
    revenue_per_week: number;
    tourism_revenue_per_week : number;
    requirements: {
        gold: number;
        plots: any[];
        employees: number;
        climate: number | null;
        knowledge: number;
    },
    effect_modifiers: {
        happiness: number;
        health: number;
    },
    immediate_variable_changes: {
        happiness: number;
        health: number;
        population: number;
    },
    styling: string;
    affordable: boolean | null;
    selected: boolean | null;
}