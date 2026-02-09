const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { Menu } = require("./models/Menu");
const { Order } = require("./models/Order");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_ordering";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.get("/api/menu", async (req, res) => {
  try {
    const items = await Menu.find({}).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const item = await Menu.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

app.put("/api/menu/:id", async (req, res) => {
  try {
    const item = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to place order" });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Socket.io Logic
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on("new-order", (order) => {
    console.log("New order received:", order);
    io.to("kitchen").emit("order-update", order);
  });

  socket.on("update-status", (data) => {
    console.log("Status update:", data);
    io.to(`table-${data.tableNumber}`).emit("status-changed", data);
    io.to("kitchen").emit("status-changed", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
