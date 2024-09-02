import express from "express";  
import { Server } from "socket.io";
import { createServer } from "http";
import connectDB from "./config/db.js"; // Import the database connection
import Message from "./models/Message.js"; 
import User from "./models/User.js";

//initializing express app and http server
const app = express();
const port = 8000;
const server = createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",  //allowed origin for CORS
    method: ["GET", "POST"],          
    credentials: true,                
  },
});

app.get("/", (req, res) => {
  res.send("HEllo world"); //response for the root url
});


//handling new socket connection
io.on("connection", (socket) => {
  socket.on("check-user", async (m) => {
    try {
      // Checking if the username already exists
      const existingUser = await User.findOne({ userName: m.user });

      if (existingUser) {
        // If username is taken, emiting duplicate username event
        socket.emit("duplicate-user", m);
      } else {
        // If username is available

        socket.emit("approved-user");
      }
    } catch (err) {
      console.error("Error checking or saving user:", err);
      socket.emit("error", "Internal server error");        // emitting error message in case of failure
    }
  });

  // Handling username registration
  socket.on("username", async (m) => {
    try {
      // Checking if the username already exists
      const existingUser = await User.findOne({ userName: m.user });

      if (existingUser) {
        // If username is taken, emiting duplicate username event
        socket.emit("duplicate username", m);
      } else {
        // If username is available, save it to MongoDB
        const newUser = new User({ userName: m.user, socketId: socket.id });
        await newUser.save();

        socket.emit("approved username");
      }
    } catch (err) {
      console.error("Error checking or saving user:", err);
      socket.emit("error", "Internal server error");     //emmiting error message in case of failure 
    }
  });

  socket.on("join-room", async (room) => {
    socket.join(room);   //join the specified room
    const messages = await Message.find({ room }).sort({ timestamp: 1 }); //get the history of that room if available and send it to the new user
    io.to(room).emit("history", messages);
  });

  socket.on("message", async ({ message, room, user }) => { //triggers when a user sends a message
    const newMessage = new Message({ message, user, room });
    await newMessage.save();
    const messageId = newMessage._id;
    io.to(room).emit("receive-message", { message, user, _id: messageId }); //send info to other users in the room about message
  });

  socket.on("delete-message", async ({ messageId, room }) => {
    try {
      // Find the message to be deleted from database
      const message = await Message.findOne({ _id: messageId });
      if (message) {
        await Message.deleteOne({ _id: messageId });
        io.to(room).emit("message-deleted", { messageId });
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  });

  socket.on("edit-message", async ({ messageId, newContent, room }) => {
    
    try {
      //find the message to be edited
      const message = await Message.findOne({ _id: messageId });
      if (message) {
        message.message = newContent;
        await message.save();
        io.to(room).emit("message-edited", { messageId, newContent });
      }
    } catch (err) {
      console.error("Error editing message:", err);
    }
  });

  //handle user disconnection if the user leaves by clicking back button
  socket.on("back-button-leave", async (socketId) => {
    try {
      // Remove the user from the database on disconnect
      await User.findOneAndDelete({ socketId: socketId });
    } catch (err) {
      console.error("Error removing user:", err);
    }
  });

  //handle user disconnection if the user leaves by closing tab
  socket.on("disconnect", async () => {
    try {
      // Remove the user from the database on disconnect
      await User.findOneAndDelete({ socketId: socket.id });
    } catch (err) {
      console.error("Error removing user:", err);
    }
  });
});

server.listen(port, () => {
  console.log(`server is running on ${port}`);
});
