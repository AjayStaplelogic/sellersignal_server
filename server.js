const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
}));

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const users = {};
const adminId = 'admin';

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('register', (userId) => {
    users[userId] = socket.id;

    if (userId !== adminId) {
      const connectedUsers = Object.keys(users).filter((id) => id !== adminId);
      io.to(users[adminId]).emit('userList', connectedUsers);
    }

    console.log('Registered users:', users);
  });

  socket.on('sendMessage', ({ senderId, receiverId, message }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', { senderId, message,receiverId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const disconnectedUser = Object.keys(users).find(
      (userId) => users[userId] === socket.id
    );
    delete users[disconnectedUser];
    const connectedUsers = Object.keys(users).filter((id) => id !== adminId);
    io.to(users[adminId]).emit('userList', connectedUsers);
  });
});

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});
