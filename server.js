const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const onlineUsers = {};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static("public"));
app.use("/view", express.static("view"));

app.use("/api", authRoutes);
app.use("/api", messageRoutes);


app.get("/", (req, res) => {
  res.redirect("/view/login.html");
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err.message));


io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("registerUser", ({ username }) => {
    if (!username) return;
    onlineUsers[username] = socket.id;
    socket.data.username = username; 
    console.log(`Registered user: ${username} -> ${socket.id}`);
  });

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    console.log(`${username} joined room: ${room}`);
  });

  socket.on("leaveRoom", ({ username, room }) => {
    socket.leave(room);
    console.log(`${username} left room: ${room}`);
  });

  socket.on("groupMessage", async ({ from_user, room, message }) => {
    try {
      if (!from_user || !room || !message) return;

      const msgDoc = new GroupMessage({ from_user, room, message });
      await msgDoc.save();

      io.to(room).emit("roomMessage", {
        from_user,
        room,
        message,
        date_sent: msgDoc.date_sent,
      });
    } catch (err) {
      console.log("groupMessage error:", err.message);
    }
  });

  socket.on("privateMessage", async ({ from_user, to_user, message }) => {
    try {
      if (!from_user || !to_user || !message) return;

      const msgDoc = new PrivateMessage({ from_user, to_user, message });
      await msgDoc.save();

      const toSocketId = onlineUsers[to_user];
      const payload = {
        from_user,
        to_user,
        message,
        date_sent: msgDoc.date_sent,
      };

      if (toSocketId) {
        io.to(toSocketId).emit("privateMessage", payload);
      }

      socket.emit("privateMessage", payload);
    } catch (err) {
      console.log("privateMessage error:", err.message);
    }
  });

  socket.on("typing", ({ from_user, to_user, isTyping }) => {
    try {
      const toSocketId = onlineUsers[to_user];
      if (!toSocketId) return;

      io.to(toSocketId).emit("typing", {
        from_user,
        isTyping: !!isTyping,
      });
    } catch (err) {
      console.log("typing error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    const username = socket.data.username;
    if (username && onlineUsers[username] === socket.id) {
      delete onlineUsers[username];
      console.log(`Removed user: ${username}`);
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
