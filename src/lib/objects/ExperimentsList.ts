import { Experiment } from "$lib/types";

/* 
ideas:
- every x plot burns to the ground
- every x plot now generates twice the revenue
- citizens are happier with a higher tax rate
- 



*/

export const experiments : Experiment[] = [
    {
        id: "sunshine",
        title: "Hint of Sunshine",
        description: `Scientist Jane P. found that more sunlight makes everyone a bit happier. 
        
        Now, every home is equipped with a pair of sunglasses and a sunhat. Enjoy happier citizens!,
        `,
        cost: 5000,
        duration: 180
    },
    {
        id: "antibiotics",
        title: "We will call them 'Antibiotics'",
        description: `Scientist Alfred C. has pitched us an idea that he calls Antibiotics.
        
         We don't really know what that means, but it seems to make people healthier. 
        `,
        cost: 8000,
        duration: 200
    },
    {
        id: "goodbye_carrots",
        title: "Goodbye Carrots",
        description: `Scientist Jarrod M. collaborated with local carrot farms to enhance the recipe, aiming to increase consumers' height by 10%.

        Unfortunately, the experiment failed, and all the local carrot farms have gone out of business. 
        `,
        cost: 8000,
        duration: 80
    },

]


    
