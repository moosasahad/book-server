const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
    description: { type: String },
    options: [
      {
        name: { type: String, required: true }, // e.g., "Sugar Level", "Spiciness"
        type: { type: String, enum: ["single", "multiple"], default: "single" },
        choices: [
          {
            name: { type: String, required: true }, // e.g., "No Sugar", "Medium"
            price: { type: Number, default: 0 }, // Additional price
            available: { type: Boolean, default: true },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

module.exports = {
  Menu: mongoose.models.Menu || mongoose.model("Menu", MenuSchema),
};
