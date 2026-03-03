const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema(
    {
        tableNumber: { type: String, required: true, unique: true },
        status: {
            type: String,
            default: "Available",
            enum: ["Available", "Reserved", "Occupied"],
        },
        reservedByName: { type: String, default: null },
        reservedByPhone: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = {
    Table: mongoose.models.Table || mongoose.model("Table", TableSchema),
};
