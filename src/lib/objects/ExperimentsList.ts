import { hasPlotOfType, reverseClear } from "$lib/store";
import { Experiment, Game } from "$lib/types";

export const experiments: Experiment[] = [
  //   {
  //     id: "testing",
  //     title: "Testing",
  //     description: `Scientist Jane T. found that more sunlight makes everyone a bit happier.
  //           Now, every home is equipped with a pair of sunglasses and a sunhat. Enjoy happier citizens!,
  //           `,
  //     cost: 100,
  //     duration: 7,
  //     effect: (game: Game) => {
  //       game.townInfo.gold = 1000;
  //       return game;
  //     },
  //   },
  {
    id: "sunshine",
    title: "Hint of Sunshine",
    description: `Scientist Jane T. found that more sunlight makes everyone a bit happier.
          Now, every home is equipped with a pair of sunglasses and a sunhat. Enjoy happier citizens!,
          `,
    cost: 5000,
    duration: 180,
    effect: (game: Game) => {
      game.townInfo.happiness += 100;
      return game;
    },
  },
  {
    id: "antibiotics",
    title: "We will call them 'Antibiotics'",
    description: `Scientist Alfred C. has pitched us an idea that he calls 'Antibiotics'.
           We don't really know what that means, but it seems to make people healthier.
          `,
    cost: 8000,
    duration: 200,
    effect: (game: Game) => {
      game.townInfo.health += 180;
      game.townInfo.happiness += 25;
      return game;
    },
  },
  {
    id: "funny_cows",
    title: "Cowabunga!",
    description: `Scientist Barry T. thought that showing cows some stand-up comedy would make them produce better milk, but it didn't have the desired effect.
          The cows are now following Mike Birbiglia on Twitter, but the milk production has not increased.
          `,
    cost: 3000,
    duration: 60,
    effect: (game: Game) => {
      return game;
    },
  },
  {
    id: "missing_treasure",
    title: "Missing Treasure?",
    description: `Scientist Sarah H. was running an experiment on tree growth and found a stash of gold near the lab.
          She hopes nobody will miss it. Your town now has some more money.
          `,
    cost: 15000,
    duration: 180,
    effect: (game: Game) => {
      game.townInfo.gold += Math.floor(Math.random() * 35000);
      return game;
    },
  },
  {
    id: "tax_relief",
    title: "'Maybe the government is not so bad after all'",
    description: `Scientist Sam P. conducted a study and found that if you put a tiny bit of CHEMICAL X in the water supply, people are more likely to be ok with tax hikes.
          We don't question it, as these experiments cost a lot of moo-lah.`,
    cost: 7500,
    duration: 360,
    effect: (game: Game) => {
      game.economyAndLaws.max_tax_rate =
        (Math.random() * 0.8 + 1.2) * game.economyAndLaws.max_tax_rate;
      return game;
    },
  },
  {
    id: "spring_break",
    title: "Spring Break",
    description: `The Scientists took our money and spent the week at the beach.
          We are not sure what they did, but they came back with a tan and a smile.`,
    cost: 2000,
    duration: 7,
    effect: (game: Game) => {
      return game;
    },
  },
  {
    id: "tornado",
    title: "A Gust of Grain",
    description: `Scientist Clint C. is sulking after a botched weather experiment caused about half of the food supply to be sucked into a tornado.
  		The only positive seems to be that the town now knows what a tornado is, and that makes us a bit smarter as a whole.`,
    cost: 7000,
    duration: 150,
    effect: (game: Game) => {
      game.townInfo.knowledge_points += 3000;
      game.resources.food = Math.floor(game.resources.food / 2);
      return game;
    },
  },
  {
    id: "aquatic_overachievers",
    title: "Fishy Business",
    description: `An attempt to genetically enhance fish intelligence by Scientist Goldie F. in fisheries has gone awry, resulting in fish that are too smart to be caught. The fisheries are now underpopulated and shut down, but the town enjoys an unexpected tourism boom as people flock to see the genius fish who are now hanging out in local parks.
          Who knew fish could be such a draw?`,
    cost: 6000,
    duration: 90,
    effect: (game: Game) => {
      game.townInfo.gold += 10000;
      removeAllPlotsOfType("fishery", game);
      return game;
    },
  },
  {
    id: "educational_eclipse",
    title: "A Sudden Drop in IQ",
    description: `Scientist Albert E. wanted to see if the towns' children would become smarter if THEY ran the schools.
          This was obviously a terrible idea and the first thing the kids did was shut down the schools.`,
    cost: 1000,
    duration: 45,
    effect: (game: Game) => {
      removeAllPlotsOfType("schoolhouse", game);
      return game;
    },
  },
  {
    id: "education_grant",
    title: "Education Grant",
    description: `Scientist Marie C. took this experiments funding and applied the town for a grant to improve education.
          The town wins a grant for $150,000 to build schools and improve education. (but it's up to you if that's how you want to spend the money)`,
    cost: 25000,
    duration: 45,
    effect: (game: Game) => {
      game.townInfo.gold += 150000;
      return game;
    },
  },
  {
    id: "mindfulness_meditation_classes",
    title: "'Mindfulness Meditation Classes'",
    description: `Scientist Zen M. has introduced mindfulness meditation classes to the town after realizing that breathing in certain ways can lower stress.
  		Now, the town is a bit more relaxed, for now.`,
    cost: 13000,
    duration: 540,
    effect: (game: Game) => {
      game.townInfo.happiness += 75;
      return game;
    },
  },
];

function removeAllPlotsOfType(typeId: string, game: Game) {
  let plotsOfType: any[] = hasPlotOfType(typeId, game);
  for (let i = 0; i < plotsOfType.length; i++) {
    reverseClear(plotsOfType[i].x, plotsOfType[i].y, game);
  }
}
