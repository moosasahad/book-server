const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { uploadToCloudinary } = require("./cloudinary");

const upload = multer({ storage: multer.memoryStorage() });

const { Menu } = require("./models/Menu");
const { Order } = require("./models/Order");
const { Table } = require("./models/Table");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: process.env.CLIENT_URL || "*"
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_ordering";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.post("/api/upload", upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, file.originalname);
      return {
        originalName: file.originalname,
        fieldName: file.fieldname,
        mimeType: file.mimetype,
        size: file.size,
        url: result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        createdAt: result.created_at,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      files: uploadedFiles[0].url,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: "Failed to upload file(s) to Cloudinary", details: err.message });
  }
});

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

app.get("/api/orders/table/:tableNumber", async (req, res) => {
  try {
    const orders = await Order.find({ tableNumber: req.params.tableNumber }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders for table" });
  }
});

// Table API Routes
app.get("/api/tables/:tableNumber", async (req, res) => {
  try {
    let table = await Table.findOne({ tableNumber: req.params.tableNumber });
    if (!table) {
      // Auto-create table with Available status on first access
      table = await Table.create({ tableNumber: req.params.tableNumber, status: "Available" });
    }
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch table status" });
  }
});

app.patch("/api/tables/:tableNumber", async (req, res) => {
  try {
    const { status, reservedByName, reservedByPhone } = req.body;
    let table = await Table.findOne({ tableNumber: req.params.tableNumber });
    if (!table) {
      table = await Table.create({
        tableNumber: req.params.tableNumber,
        status: status || "Available",
        reservedByName: status === "Available" ? null : reservedByName,
        reservedByPhone: status === "Available" ? null : reservedByPhone
      });
    } else {
      table.status = status;
      if (status === "Available") {
        table.reservedByName = null;
        table.reservedByPhone = null;
      } else {
        if (reservedByName !== undefined) table.reservedByName = reservedByName;
        if (reservedByPhone !== undefined) table.reservedByPhone = reservedByPhone;
      }
      await table.save();
    }
    // Notify both kitchen and table room
    const updateData = {
      tableNumber: req.params.tableNumber,
      status: table.status,
      reservedByName: table.reservedByName,
      reservedByPhone: table.reservedByPhone
    };
    io.to("kitchen").emit("table-status-changed", updateData);
    io.to(`table-${req.params.tableNumber}`).emit("table-status-changed", updateData);
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: "Failed to update table status" });
  }
});

app.post("/api/tables", async (req, res) => {
  try {
    const { tableNumber, status } = req.body;
    let table = await Table.findOne({ tableNumber });
    if (table) {
      return res.status(400).json({ error: "Table already exists" });
    }
    table = await Table.create({ tableNumber, status: status || "Available" });
    res.status(201).json(table);
  } catch (err) {
    res.status(500).json({ error: "Failed to create table" });
  }
});

app.get("/api/tables", async (req, res) => {
  try {
    const tables = await Table.find({}).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tables" });
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
    const { status, items, totalPrice, paymentMethod, note, voiceUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If trying to modify items/price/note/voiceUrl, ensure order is Pending
    if ((items || totalPrice || paymentMethod || note || voiceUrl) && order.status !== "Pending") {
      return res.status(400).json({ error: "Cannot modify order items after cooking has started" });
    }

    if (status) {
      // Optional: Add logic to prevent cancelling if not pending
      if (status === "Cancelled" && order.status !== "Pending") {
        return res.status(400).json({ error: "Cannot cancel order that is already cooking" });
      }
      order.status = status;
    }

    if (items) order.items = items;
    if (totalPrice) order.totalPrice = totalPrice;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (note) order.note = note;
    if (voiceUrl) order.voiceUrl = voiceUrl;

    await order.save();

    // Notify kitchen about the update
    if (items || totalPrice || paymentMethod || note || voiceUrl) {
      io.to("kitchen").emit("order-update", order);
    }

    if (status) {
      // Emit status change to both Table and Kitchen
      io.to(`table-${order.tableNumber}`).emit("status-changed", order);
      io.to("kitchen").emit("status-changed", { orderId: order._id, status: order.status });
    }

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

  socket.on("call-waiter", (data) => {
    console.log("Waiter call from table:", data.tableNumber);
    io.to("kitchen").emit("waiter-call", {
      tableNumber: data.tableNumber,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("update-table-status", async (data) => {
    console.log("Table status update:", data);
    try {
      const { Table } = require("./models/Table");
      let table = await Table.findOne({ tableNumber: data.tableNumber });
      if (!table) {
        table = await Table.create({
          tableNumber: data.tableNumber,
          status: data.status,
          reservedByName: data.status === "Available" ? null : data.reservedByName,
          reservedByPhone: data.status === "Available" ? null : data.reservedByPhone
        });
      } else {
        table.status = data.status;
        if (data.status === "Available") {
          table.reservedByName = null;
          table.reservedByPhone = null;
        } else {
          if (data.reservedByName !== undefined) table.reservedByName = data.reservedByName;
          if (data.reservedByPhone !== undefined) table.reservedByPhone = data.reservedByPhone;
        }
        await table.save();
      }
      const updateData = {
        tableNumber: data.tableNumber,
        status: data.status,
        reservedByName: table.reservedByName,
        reservedByPhone: table.reservedByPhone
      };
      io.to("kitchen").emit("table-status-changed", updateData);
      io.to(`table-${data.tableNumber}`).emit("table-status-changed", updateData);
    } catch (err) {
      console.error("Failed to update table status via socket:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
