const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sert tous les fichiers du dossier public (index.html et admin.html)
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté :', socket.id);

    // 1. Message venant d'un utilisateur classique
    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', data);
    });

    // 2. Réponse manuelle venant du panneau admin
    socket.on('adminMessage', (data) => {
        const adminReply = {
            author: '👑 Administrateur',
            text: data.text
        };
        // Diffuse la réponse de l'admin à tout le monde sur le chat
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
