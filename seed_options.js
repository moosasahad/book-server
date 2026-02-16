const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { Menu } = require("./models/Menu");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_ordering";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const seedItem = async () => {
    try {
        const item = {
            name: "Masala Chai",
            price: 5,
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=1000",
            category: "Beverages",
            description: "Traditional Indian spiced tea",
            options: [
                {
                    name: "Sugar Level",
                    type: "single",
                    choices: [
                        { name: "Normal Sugar", price: 0 },
                        { name: "Less Sugar", price: 0 },
                        { name: "No Sugar", price: 0 },
                        { name: "Extra Sugar", price: 0.5 }
                    ]
                },
                {
                    name: "Milk Type",
                    type: "single",
                    choices: [
                        { name: "Regular Milk", price: 0 },
                        { name: "Oat Milk", price: 1 },
                        { name: "Almond Milk", price: 1 }
                    ]
                },
                {
                    name: "Add-ons",
                    type: "multiple",
                    choices: [
                        { name: "Extra Ginger", price: 0.5 },
                        { name: "Extra Cardamom", price: 0.5 }
                    ]
                }
            ]
        };

        const newItem = await Menu.create(item);
        console.log("Created item with options:", newItem);
    } catch (error) {
        console.error("Error creating item:", error);
    } finally {
        mongoose.disconnect();
    }
};

seedItem();
