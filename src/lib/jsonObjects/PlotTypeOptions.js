export const options = [
    {
        title: 'Residential',
        subtitle: 'level 1',
        description: 'A few basic homes that can hold 16 people',
        revenue_per_week: 0,
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
        description: 'A few high-density buildings that can hold 64 people',
        revenue_per_week: 0,
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
        description: 'Many high-density buildings that can hold 256 people',
        revenue_per_week: 0,
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
        title: 'Small café',
        subtitle: 'for recreation & food',
        description: 'Great for eating & relaxing, not great for longterm health',
        revenue_per_week: 12,
        requirements: {
            gold: 100,
            plots: [], 
            employees: 16,
            climate: null,
        },
        effect_modifiers: {
            happiness: 1.01,
            health: 0.99,
            visitors: 1.01,
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
        revenue_per_week: 30,
        requirements: {
            gold: 320,
            plots: [], 
            employees: 24,
            climate: null,
        },
        effect_modifiers: {
            happiness: 1.02,
            health: 1.01,
            visitors: 1,
        },
        immediate_variable_changes: {
            happiness: 10,
            health: 0,
            visitors: 0,
            population: 0,
        }
    },
];