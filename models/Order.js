const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true },
    items: [
      {
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = {
  Order: mongoose.models.Order || mongoose.model("Order", OrderSchema),
};
