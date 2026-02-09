const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true },
);

module.exports = {
  Menu: mongoose.models.Menu || mongoose.model("Menu", MenuSchema),
};
