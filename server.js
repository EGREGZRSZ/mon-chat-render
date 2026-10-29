const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté :', socket.id);

    // Message d'un utilisateur classique
    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', data);
    });

    // Message personnalisé venant de l'admin avec son propre pseudo
    socket.on('adminMessage', (data) => {
        const adminReply = {
            author: `👑 ${data.author}`, // Affiche le pseudo choisi avec une couronne
            text: data.text
        };
        io.emit('chatMessage', adminReply);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté :', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
