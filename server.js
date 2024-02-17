const express = require("express")
const http = require('http')
const path = require("path")
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')
const { emit } = require("process")

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const PORT = 3000 || process.env.PORT

// Static Folder
app.use(express.static(path.join(__dirname, "public")))

var botName = 'Admin'

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        var user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'))

        // Broadcast When a User Connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has Joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chat message 
    socket.on('chatMessage', msg => {
        var user = getCurrentUser(socket.id)

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    // Runs when disconnect
    socket.on('disconnect', () => {
        var user = userLeave(socket.id)

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat)`));
        }
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
});

server.listen(PORT, () => console.log(`Server listen on port: ${PORT}`)) 