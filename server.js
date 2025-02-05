require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import models
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// Import and use authentication routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// WebSockets for Real-Time Chat
io.on("connection", (socket) => {
    console.log("🔵 User connected:", socket.id);

    // Join Room
    socket.on("joinRoom", ({ username, room }) => {
        socket.join(room);
        console.log(`📌 ${username} joined room: ${room}`);
        
        // Welcome message for the user
        socket.emit("message", { user: "Admin", text: `Welcome to the chat room: ${room}` });

        // Notify other users in the room
        socket.broadcast.to(room).emit("message", { user: "Admin", text: `${username} has joined the room.` });

        // Update room users list
        io.to(room).emit("roomUsers", {
            room,
            users: getUsersInRoom(room),
        });
    });

    // Save and broadcast chat messages
    socket.on("sendMessage", async ({ username, room, message }) => {
        console.log(`📩 Message from ${username} in ${room}: ${message}`);

        // Save message to MongoDB
        const newMessage = new Message({
            from_user: username,
            room,
            message,
        });

        await newMessage.save();

        // Broadcast the message to the room
        io.to(room).emit("message", { user: username, text: message });
    });

    // Typing indicator
    socket.on("typing", ({ username, room }) => {
        socket.to(room).emit("typing", { user: username });
    });

    socket.on("stopTyping", ({ room }) => {
        socket.to(room).emit("stopTyping");
    });

    // Leave Room
    socket.on("leaveRoom", ({ username, room }) => {
        socket.leave(room);
        console.log(`📌 ${username} left room: ${room}`);
        io.to(room).emit("message", { user: "Admin", text: `${username} has left the room.` });

        // Update room users list
        io.to(room).emit("roomUsers", {
            room,
            users: getUsersInRoom(room),
        });
    });

    // Disconnect Event
    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
    });
});

// Helper function to get users in a room
function getUsersInRoom(room) {
    const users = [];
    const clients = io.sockets.adapter.rooms.get(room);

    if (clients) {
        clients.forEach((socketId) => {
            const user = io.sockets.sockets.get(socketId);
            if (user) {
                users.push({ username: user.username, id: socketId });
            }
        });
    }
    return users;
}

// Start the server
server.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
