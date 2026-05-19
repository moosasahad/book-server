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
        selectedOptions: [
          {
            name: { type: String }, // Option Group Name (e.g. "Sugar Level")
            choice: { type: String }, // Selected Choice (e.g. "No Sugar")
            price: { type: Number, default: 0 }, // Extra cost
          },
        ],
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Cooking",
        "Plating",
        "Serving",
        "Completed",
        "Cancelled",
      ],
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Online"],
      default: "Cash",
    },
    note: { type: String }, // Order-level note
    voiceUrl: { type: String }, // Voice message attachment url
  },
  { timestamps: true },
);

module.exports = {
  Order: mongoose.models.Order || mongoose.model("Order", OrderSchema),
};
