const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Liste des clients connectés
let clients = {};

io.on('connection', (socket) => {
    console.log('Nouvelle connexion :', socket.id);

    // Un client s'enregistre avec son pseudo
    socket.on('registerClient', (pseudo) => {
        clients[socket.id] = { id: socket.id, pseudo: pseudo || 'Client' };
        // Met à jour la liste pour tous les admins connectés
        io.emit('updateUserList', Object.values(clients));
    });

    // Un client envoie un message au support
    socket.on('clientMessage', (data) => {
        const client = clients[socket.id];
        if (client) {
            const messageData = {
                senderId: socket.id,
                author: client.pseudo,
                text: data.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            // Transmet le message aux administrateurs et au client lui-même
            io.emit('newClientMessage', messageData);
        }
    });

    // L'administrateur répond spécifiquement à un client via son ID
    socket.on('adminReply', (data) => {
        const replyData = {
            author: '👑 Support Admin',
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        // Envoie le message UNIQUEMENT au client concerné
        io.to(data.targetSocketId).emit('privateMessage', replyData);
        
        // Renvoie aussi l'info aux admins pour l'historique
        io.emit('adminReplySent', { targetSocketId: data.targetSocketId, ...replyData });
    });

    // Déconnexion d'un utilisateur
    socket.on('disconnect', () => {
        if (clients[socket.id]) {
            delete clients[socket.id];
            io.emit('updateUserList', Object.values(clients));
        }
        console.log('Utilisateur déconnecté :', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
