const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sert les fichiers statiques de l'interface client
app.use(express.static(path.join(__dirname, 'public')));

// Gestion des connexions et des messages en temps réel
io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté :', socket.id);

    socket.on('chatMessage', (data) => {
        // Rediffuse le message à tous les clients connectés
        io.emit('chatMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté :', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});