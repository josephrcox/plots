export const options = [
    {
        title: 'Residential',
        subtitle: 'level 1',
        description: 'A few basic homes',
        requirements: {
            gold: 200,
            plots: [], 
            employees: 0,
            climate: null,
        },
        effect_modifiers: {
            happiness: 1,
            health: 1,
            visitors: 1,
        },
        immediate_variable_changes: {
            happiness: 0,
            health: 0,
            visitors: 0,
            population: 16,
        }
    },
    {
        title: 'Residential',
        subtitle: 'level 2',
        description: 'A few high-density buildings',
        requirements: {
            gold: 400,
            plots: [], 
            employees: 0,
            climate: null,
        },
        effect_modifiers: {
            happiness: 1,
            health: 1,
            visitors: 1,
        },
        immediate_variable_changes: {
            happiness: 0,
            health: 0,
            visitors: 0,
            population: 64,
        }
    },
    {
        title: 'Residential',
        subtitle: 'level 3',
        description: 'Many high-density buildings',
        requirements: {
            gold: 1400,
            plots: [], 
            employees: 0,
            climate: null,
        },
        effect_modifiers: {
            happiness: 1,
            health: 1,
            visitors: 1,
        },
        immediate_variable_changes: {
            happiness: 0,
            health: 0,
            visitors: 0,
            population: 256,
        }
    },
    {
        title: 'Coffee Shop',
        subtitle: 'for recreation',
        description: 'People love this stuff',
        requirements: {
            gold: 100,
            plots: [], 
            employees: 16,
            climate: null,
        },
        effect_modifiers: {
            happiness: 1.001,
            health: 0.999,
            visitors: 1.001,
        },
        immediate_variable_changes: {
            happiness: 5,
            health: 0,
            visitors: 0,
            population: 0,
        }
    },
    {
        title: 'Grocery store',
        subtitle: 'for living',
        description: 'People get hungry',
        requirements: {
            gold: 320,
            plots: [], 
            employees: 24,
            climate: null,
        },
        effect_modifiers: {
            happiness: 1.003,
            health: 1.001,
            visitors: 1,
        },
        immediate_variable_changes: {
            happiness: 5,
            health: 0,
            visitors: 0,
            population: 0,
        }
    },
];