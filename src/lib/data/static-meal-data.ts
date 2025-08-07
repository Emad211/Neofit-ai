export const staticMealData = [
    {
      day: 'Monday',
      meals: [
        { 
            type: 'Breakfast', 
            name: 'Oatmeal with Berries', 
            calories: 350, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'oatmeal berries',
            ingredients: [
                { name: 'Rolled Oats', quantity: '1/2 cup', category: 'Pantry' },
                { name: 'Mixed Berries', quantity: '1 cup', category: 'Fruits' },
                { name: 'Almond Milk', quantity: '1 cup', category: 'Dairy & Alternatives' },
            ]
        },
        { 
            type: 'Lunch', 
            name: 'Quinoa Salad', 
            calories: 500, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'quinoa salad',
            ingredients: [
                { name: 'Quinoa', quantity: '1 cup cooked', category: 'Pantry' },
                { name: 'Cucumber', quantity: '1/2', category: 'Produce' },
                { name: 'Cherry Tomatoes', quantity: '1/2 cup', category: 'Produce' },
                { name: 'Feta Cheese', quantity: '1/4 cup', category: 'Dairy & Alternatives' },
                { name: 'Lemon', quantity: '1', category: 'Produce' },
            ]
        },
        { 
            type: 'Dinner', 
            name: 'Baked Salmon', 
            calories: 600, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'baked salmon',
            ingredients: [
                { name: 'Salmon Fillet', quantity: '150g', category: 'Protein' },
                { name: 'Asparagus', quantity: '1 bunch', category: 'Produce' },
                { name: 'Olive Oil', quantity: '1 tbsp', category: 'Pantry' },
            ]
        },
      ],
      totalCalories: 1450,
    },
    {
      day: 'Tuesday',
      meals: [
        { 
            type: 'Breakfast', 
            name: 'Greek Yogurt with Nuts', 
            calories: 400, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'yogurt nuts',
            ingredients: [
                { name: 'Greek Yogurt', quantity: '1 cup', category: 'Dairy & Alternatives' },
                { name: 'Mixed Nuts', quantity: '1/4 cup', category: 'Pantry' },
                { name: 'Honey', quantity: '1 tbsp', category: 'Pantry' },
            ]
        },
        { 
            type: 'Lunch', 
            name: 'Chicken Wrap', 
            calories: 550, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'chicken wrap',
            ingredients: [
                { name: 'Chicken Breast', quantity: '100g cooked', category: 'Protein' },
                { name: 'Whole Wheat Tortilla', quantity: '1', category: 'Pantry' },
                { name: 'Lettuce', quantity: '1/2 cup', category: 'Produce' },
                { name: 'Tomato', quantity: '1/2', category: 'Produce' },
            ]
        },
        { 
            type: 'Dinner', 
            name: 'Lentil Soup', 
            calories: 450, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'lentil soup',
            ingredients: [
                { name: 'Brown Lentils', quantity: '1 cup', category: 'Pantry' },
                { name: 'Carrot', quantity: '1', category: 'Produce' },
                { name: 'Celery', quantity: '1 stalk', category: 'Produce' },
                { name: 'Onion', quantity: '1/2', category: 'Produce' },
            ]
        },
      ],
      totalCalories: 1400,
    },
    // Adding ingredients for other days as well
    {
      day: 'Wednesday',
      meals: [
        { 
            type: 'Breakfast', 
            name: 'Scrambled Eggs', 
            calories: 300, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'scrambled eggs',
            ingredients: [
                { name: 'Eggs', quantity: '3', category: 'Protein' },
                { name: 'Spinach', quantity: '1 cup', category: 'Produce' },
            ]
        },
        { 
            type: 'Lunch', 
            name: 'Tuna Sandwich', 
            calories: 480, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'tuna sandwich',
            ingredients: [
                { name: 'Canned Tuna', quantity: '1 can', category: 'Protein' },
                { name: 'Whole Wheat Bread', quantity: '2 slices', category: 'Pantry' },
                { name: 'Mayonnaise', quantity: '1 tbsp', category: 'Pantry' },
            ]
        },
        { 
            type: 'Dinner', 
            name: 'Spaghetti Bolognese', 
            calories: 650, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'spaghetti bolognese',
            ingredients: [
                { name: 'Ground Beef', quantity: '150g', category: 'Protein' },
                { name: 'Spaghetti', quantity: '100g', category: 'Pantry' },
                { name: 'Tomato Sauce', quantity: '1 cup', category: 'Pantry' },
            ]
        },
      ],
      totalCalories: 1430,
    },
     {
      day: 'Thursday',
      meals: [
        { 
            type: 'Breakfast', 
            name: 'Protein Pancakes', 
            calories: 450, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'protein pancakes',
            ingredients: [
                { name: 'Protein Powder', quantity: '1 scoop', category: 'Pantry' },
                { name: 'Banana', quantity: '1', category: 'Fruits' },
                { name: 'Egg', quantity: '1', category: 'Protein' },
            ]
        },
        { 
            type: 'Lunch', 
            name: 'Leftover Spaghetti', 
            calories: 650, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'spaghetti bolognese',
            ingredients: [] // Assuming leftovers don't add to shopping list
        },
        { 
            type: 'Dinner', 
            name: 'Chicken Stir-fry', 
            calories: 550, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'chicken stir-fry',
            ingredients: [
                { name: 'Chicken Breast', quantity: '150g', category: 'Protein' },
                { name: 'Broccoli', quantity: '1 cup', category: 'Produce' },
                { name: 'Bell Pepper', quantity: '1/2', category: 'Produce' },
                { name: 'Soy Sauce', quantity: '2 tbsp', category: 'Pantry' },
            ]
        },
      ],
      totalCalories: 1650,
    },
    {
      day: 'Friday',
      meals: [
        { 
            type: 'Breakfast', 
            name: 'Avocado Toast', 
            calories: 380, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'avocado toast',
            ingredients: [
                { name: 'Avocado', quantity: '1/2', category: 'Produce' },
                { name: 'Whole Wheat Bread', quantity: '2 slices', category: 'Pantry' },
            ]
        },
        { 
            type: 'Lunch', 
            name: 'Caesar Salad with Chicken', 
            calories: 520, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'caesar salad',
            ingredients: [
                { name: 'Chicken Breast', quantity: '100g', category: 'Protein' },
                { name: 'Romaine Lettuce', quantity: '2 cups', category: 'Produce' },
                { name: 'Caesar Dressing', quantity: '2 tbsp', category: 'Pantry' },
                { name: 'Croutons', quantity: '1/4 cup', category: 'Pantry' },
            ]
        },
        { 
            type: 'Dinner', 
            name: 'Pizza Night', 
            calories: 800, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'pizza',
            ingredients: [
                { name: 'Pizza Dough', quantity: '1', category: 'Pantry' },
                { name: 'Mozzarella Cheese', quantity: '1/2 cup', category: 'Dairy & Alternatives' },
                { name: 'Pepperoni', quantity: '10 slices', category: 'Protein' },
            ]
        },
      ],
      totalCalories: 1700,
    },
    {
      day: 'Saturday',
       meals: [
        { 
            type: 'Breakfast', 
            name: 'Fruit Smoothie', 
            calories: 300, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'fruit smoothie',
            ingredients: [
                { name: 'Mixed Berries', quantity: '1/2 cup', category: 'Fruits' },
                { name: 'Banana', quantity: '1/2', category: 'Fruits' },
                { name: 'Greek Yogurt', quantity: '1/2 cup', category: 'Dairy & Alternatives' },
            ]
        },
        { 
            type: 'Lunch', 
            name: 'Sushi', 
            calories: 600, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'sushi',
            ingredients: [] // Assuming sushi is bought pre-made
        },
        { 
            type: 'Dinner', 
            name: 'Steak and Veggies', 
            calories: 700, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'steak vegetables',
            ingredients: [
                { name: 'Sirloin Steak', quantity: '200g', category: 'Protein' },
                { name: 'Zucchini', quantity: '1', category: 'Produce' },
                { name: 'Bell Pepper', quantity: '1/2', category: 'Produce' },
            ]
        },
      ],
      totalCalories: 1600,
    },
    {
      day: 'Sunday',
      meals: [
        { 
            type: 'Brunch', 
            name: 'Waffles and Bacon', 
            calories: 700, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'waffles bacon',
            ingredients: [
                { name: 'Waffle Mix', quantity: '1 cup', category: 'Pantry' },
                { name: 'Bacon', quantity: '4 slices', category: 'Protein' },
                { name: 'Maple Syrup', quantity: '2 tbsp', category: 'Pantry' },
            ]
        },
        { 
            type: 'Dinner', 
            name: 'Roast Chicken', 
            calories: 650, 
            image: 'https://placehold.co/600x400.png', 
            dataAiHint: 'roast chicken',
            ingredients: [
                { name: 'Whole Chicken', quantity: '1/4', category: 'Protein' },
                { name: 'Potatoes', quantity: '2', category: 'Produce' },
                { name: 'Carrot', quantity: '1', category: 'Produce' },
            ]
        },
      ],
      totalCalories: 1350,
    }
  ];
