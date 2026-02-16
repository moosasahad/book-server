const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { Menu } = require("./models/Menu");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_ordering";

// Default options by category
const categoryOptions = {
  "Main Course": [
    {
      name: "Spice Level",
      type: "single",
      choices: [
        { name: "Mild", price: 0 },
        { name: "Medium", price: 0 },
        { name: "Spicy", price: 0 },
        { name: "Extra Spicy", price: 10 },
      ],
    },
    {
      name: "Portion Size",
      type: "single",
      choices: [
        { name: "Regular", price: 0 },
        { name: "Large", price: 50 },
      ],
    },
    {
      name: "Sauce Level",
      type: "single",
      choices: [
        { name: "Normal Sauce", price: 0 },
        { name: "Less Sauce", price: 0 },
        { name: "Extra Sauce", price: 10 },
        { name: "No Sauce", price: 0 },
      ],
    },
  ],
  Starters: [
    {
      name: "Spice Level",
      type: "single",
      choices: [
        { name: "Mild", price: 0 },
        { name: "Medium", price: 0 },
        { name: "Spicy", price: 0 },
        { name: "Extra Spicy", price: 10 },
      ],
    },
    {
      name: "Portion Size",
      type: "single",
      choices: [
        { name: "Regular", price: 0 },
        { name: "Large", price: 40 },
      ],
    },
  ],
  Desserts: [
    {
      name: "Sugar Level",
      type: "single",
      choices: [
        { name: "Normal Sugar", price: 0 },
        { name: "Low Sugar", price: 0 },
        { name: "No Sugar", price: 0 },
        { name: "Extra Sweet", price: 10 },
      ],
    },
    {
      name: "Serving",
      type: "single",
      choices: [
        { name: "Regular", price: 0 },
        { name: "Double", price: 50 },
      ],
    },
    {
      name: "Toppings",
      type: "multiple",
      choices: [
        { name: "Dry Fruits", price: 20 },
        { name: "Ice Cream Scoop", price: 30 },
        { name: "Whipped Cream", price: 15 },
      ],
    },
  ],
  Drinks: [
    {
      name: "Sugar Level",
      type: "single",
      choices: [
        { name: "Normal Sugar", price: 0 },
        { name: "Less Sugar", price: 0 },
        { name: "No Sugar", price: 0 },
        { name: "Extra Sugar", price: 5 },
      ],
    },
    {
      name: "Ice",
      type: "single",
      choices: [
        { name: "Normal Ice", price: 0 },
        { name: "Less Ice", price: 0 },
        { name: "No Ice", price: 0 },
      ],
    },
    {
      name: "Size",
      type: "single",
      choices: [
        { name: "Regular", price: 0 },
        { name: "Large", price: 30 },
      ],
    },
  ],
  Beverages: [
    {
      name: "Sugar Level",
      type: "single",
      choices: [
        { name: "Normal Sugar", price: 0 },
        { name: "Less Sugar", price: 0 },
        { name: "No Sugar", price: 0 },
        { name: "Extra Sugar", price: 5 },
      ],
    },
    {
      name: "Temperature",
      type: "single",
      choices: [
        { name: "Hot", price: 0 },
        { name: "Warm", price: 0 },
        { name: "Cold", price: 0 },
      ],
    },
    {
      name: "Size",
      type: "single",
      choices: [
        { name: "Regular", price: 0 },
        { name: "Large", price: 30 },
      ],
    },
  ],
};

// Fallback/default for any category not listed
const defaultOptions = [
  {
    name: "Spice Level",
    type: "single",
    choices: [
      { name: "Mild", price: 0 },
      { name: "Medium", price: 0 },
      { name: "Spicy", price: 0 },
    ],
  },
  {
    name: "Portion Size",
    type: "single",
    choices: [
      { name: "Regular", price: 0 },
      { name: "Large", price: 50 },
    ],
  },
];

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    
    const items = await Menu.find({});
    console.log(`Found ${items.length} menu items\n`);

    for (const item of items) {
      // Skip if already has options
      if (item.options && item.options.length > 0) {
        console.log(`SKIP: ${item.name} (already has ${item.options.length} option groups)`);
        continue;
      }

      const options = categoryOptions[item.category] || defaultOptions;
      
      item.options = options;
      await item.save();
      console.log(`UPDATED: ${item.name} [${item.category}] → added ${options.length} option groups`);
    }

    console.log("\nDone! All items updated.");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("Error:", err);
    mongoose.disconnect();
  });
