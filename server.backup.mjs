import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`User joined room: ${room}`);
    });

    socket.on("new-order", (order) => {
      console.log("New order received:", order);
      io.to("kitchen").emit("order-update", order);
      io.to("admin").emit("order-update", order);
    });

    socket.on("update-status", (data) => {
      console.log("Status update:", data);
      // data: { orderId, status, tableNumber }
      io.to(`table-${data.tableNumber}`).emit("status-changed", data);
      io.to("kitchen").emit("status-changed", data);
      io.to("admin").emit("status-changed", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
