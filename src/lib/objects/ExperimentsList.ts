import { Experiment } from '$lib/types';

export const experiments: Experiment[] = [
	{
		id: 'sunshine',
		title: 'Hint of Sunshine',
		description: `Scientist Jane T. found that more sunlight makes everyone a bit happier. 
        
        Now, every home is equipped with a pair of sunglasses and a sunhat. Enjoy happier citizens!,
        `,
		cost: 5000,
		duration: 180,
		effect: true,
	},
	{
		id: 'antibiotics',
		title: "We will call them 'Antibiotics'",
		description: `Scientist Alfred C. has pitched us an idea that he calls 'Antibiotics'.
        
         We don't really know what that means, but it seems to make people healthier. 
        `,
		cost: 8000,
		duration: 200,
		effect: true,
	},
	{
		id: 'goodbye_carrots',
		title: 'Goodbye Carrots',
		description: `Scientist Jarrod M. collaborated with local carrot farms to enhance the recipe, aiming to increase consumers' height by 10%.

        Unfortunately, the experiment failed, and all the local carrot farms have gone out of business. 
        `,
		cost: 8000,
		duration: 80,
		effect: true,
	},
	{
		id: 'funny_cows',
		title: 'Cowabunga!',
		description: `Scientist Barry T. thought that showing cows some stand-up comedy would make them produce better milk, but it didn't have the desired effect.

        The cows are now following Mike Birbiglia on Twitter, but the milk production has not increased.
        `,
		cost: 3000,
		duration: 60,
		effect: false,
	},
	{
		id: 'missing_treasure',
		title: 'Missing Treasure?',
		description: `Scientist Sarah H. was running an experiment on tree growth and found a stash of gold near the lab. 

        She hopes nobody will miss it. Your town now has some more money. 
        `,
		cost: 15000,
		duration: 180,
		effect: true,
	},
	{
		id: 'tax_relief',
		title: "'Maybe the government is not so bad after all'",
		description: `Scientist Sam P. conducted a study and found that if you put a tiny bit of CHEMICAL X in the water supply, people are more likely to be ok with tax hikes. 

        We don't question it, as these experiments cost a lot of moo-lah.`,
		cost: 7500,
		duration: 360,
		effect: true,
	},
	{
		id: 'spring_break',
		title: 'Spring Break',
		description: `The Scientists took our money and spent the week at the beach. 

        We are not sure what they did, but they came back with a tan and a smile.`,
		cost: 2000,
		duration: 7,
		effect: false,
	},
	{
		id: 'coffee_boost_tourism',
		title: 'Speedy Brews',
		description: `Scientist Claudia A. has found that a specific blend of coffee can significantly increase productivity among town employees. 

        The catch? It only works on Mondays. But hey, starting the week with a turbo-charged workforce might just be the boost we needed. The town gets a bit of extra cash from the productivity, and a bit of tourism revenue from coffee tourism.
        `,
		cost: 8000,
		duration: 100,
		effect: true,
	},
	{
		id: 'bee_bonanza',
		title: 'Buzzing with Possibilities',
		description: `Scientist Will B. thought that introducing genetically modified super bees to the local ecosystem could help with pollination.
        
        Unfortunately, these bees prefer coffee plants over all others, leading to all coffee bean farms forced to close.`,
		cost: 5000,
		duration: 120,
		effect: true,
	},
	{
		id: 'wheat_whirlwind',
		title: 'A Gust of Grain',
		description: `Scientist Clint C. is sulking after a botched weather control experiment aimed at improving crop yields accidentally resulted in a series of mini-tornadoes sweeping through the town's wheat farms. The wheat is gone, but the townsfolk have never been more entertained.

        Local bakers mourn the loss of wheat while selling tickets to the wheat whirlwind tours. All wheat farms are now torn down, but happiness is up.`,
		cost: 7000,
		duration: 150,
		effect: true,
	},
	{
		id: 'aquatic_overachievers',
		title: 'Fishy Business',
		description: `An attempt to genetically enhance fish intelligence by Scientist Goldie F. in fisheries has gone awry, resulting in fish that are too smart to be caught. The fisheries are now underpopulated and shut down, but the town enjoys an unexpected tourism boom as people flock to see the genius fish who are now hanging out in local parks.

        Who knew fish could be such a draw?`,
		cost: 6000,
		duration: 90,
		effect: true,
	},
	{
		id: 'educational_eclipse',
		title: 'A Sudden Drop in IQ',
		description: `Scientist Albert E. wanted to see if the towns' children would become smarter if THEY ran the schools. 

        This was obviously a terrible idea and the first thing the kids did was shut down the schools.`,
		cost: 1000,
		duration: 45,
		effect: true,
	},
	{
		id: 'education_grant',
		title: 'Education Grant',
		description: `Scientist Marie C. took the funding and applied the town for a grant to improve education.

        The town wins a grant for $150,000 to build schools and improve education. (but it's up to you if that's how you want to spend the money)`,
		cost: 40000,
		duration: 45,
		effect: true,
	},
	{
		id: 'mindfulness_meditation_classes',
		title: "'Mindfulness Meditation Classes'",
		description: `Scientist Zen M. has introduced mindfulness meditation classes to the town after realizing that breathing in certain ways can lower stress. 
		
		Now, the town is a bit more relaxed, for now.`,
		cost: 13000,
		duration: 540,
		effect: true,
	},
];
