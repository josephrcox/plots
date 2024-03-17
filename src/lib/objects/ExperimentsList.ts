import { Experiment } from "$lib/types";

/* 
ideas:
- every x plot now generates twice the revenue



*/

export const experiments : Experiment[] = [
    {
        id: "sunshine",
        title: "Hint of Sunshine",
        description: `Scientist Jane T. found that more sunlight makes everyone a bit happier. 
        
        Now, every home is equipped with a pair of sunglasses and a sunhat. Enjoy happier citizens!,
        `,
        cost: 5000,
        duration: 180,
                effect: true,
    },
    {
        id: "antibiotics",
        title: "We will call them 'Antibiotics'",
        description: `Scientist Alfred C. has pitched us an idea that he calls 'Antibiotics'.
        
         We don't really know what that means, but it seems to make people healthier. 
        `,
        cost: 8000,
        duration: 200,
                effect: true,
    },
    {
        id: "goodbye_carrots",
        title: "Goodbye Carrots",
        description: `Scientist Jarrod M. collaborated with local carrot farms to enhance the recipe, aiming to increase consumers' height by 10%.

        Unfortunately, the experiment failed, and all the local carrot farms have gone out of business. 
        `,
        cost: 8000,
        duration: 80,
        effect: true,
    },
    {
        id: "funny_cows",
        title: "Cowabunga!",
        description: `Scientist Barry T. thought that showing cows some stand-up comedy would make them produce better milk, but it didn't have the desired effect.

        The cows are now following Mike Birbiglia on Twitter, but the milk production has not increased.
        `,
        cost: 3000,
        duration: 60,
        effect: false,
    },
    {
        id: "missing_treasure", 
        title: "Missing Treasure?",
        description: `Scientist Sarah H. was running an experiment on tree growth and found a stash of gold near the lab. 

        She hopes nobody will miss it. Your town now has some more money. 
        `,
        cost: 15000,
        duration: 180,
        effect: true,
    },
    {
        id: "tax_relief", 
        title: "'Maybe the government is not so bad after all'",
        description: `Scientist Sam P. conducted a study and found that if you put a tiny bit of CHEMICAL X in the water supply, people are more likely to be ok with tax hikes. 

        We don't question it, as these experiments cost a lot of moo-lah.`,
        cost: 7500,
        duration: 360,
        effect: true,
    }, 
    {
        id: "spring_break", 
        title: "Spring Break",
        description: `The Scientists took our money and spent the week at the beach. 

        We are not sure what they did, but they came back with a tan and a smile.`,
        cost: 2000,
        duration: 7,
        effect: false,
    }, 

    

    

]


    
