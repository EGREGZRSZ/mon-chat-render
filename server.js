const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let clients = {};

io.on('connection', (socket) => {
    // ID unique automatique attribué par Socket.IO
    const uniqueId = socket.id;
    console.log('Nouvelle connexion avec ID unique :', uniqueId);

    // Un client s'enregistre
    socket.on('registerClient', (pseudo) => {
        clients[uniqueId] = { 
            id: uniqueId, 
            pseudo: pseudo || 'Client',
            joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        // Diffuse la liste actualisée avec les IDs uniques aux admins
        io.emit('updateUserList', Object.values(clients));
    });

    // Message d'un client
    socket.on('clientMessage', (data) => {
        const client = clients[uniqueId];
        if (client) {
            const messageData = {
                senderId: uniqueId,
                author: client.pseudo,
                text: data.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            io.emit('newClientMessage', messageData);
        }
    });

    // Réponse de l'admin vers un ID unique précis
    socket.on('adminReply', (data) => {
        const replyData = {
            author: '👑 Support Admin',
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        // Envoi ciblé au client grâce à son ID unique automatique
        io.to(data.targetSocketId).emit('privateMessage', replyData);
        
        io.emit('adminReplySent', { targetSocketId: data.targetSocketId, ...replyData });
    });

    // Déconnexion
    socket.on('disconnect', () => {
        if (clients[uniqueId]) {
            delete clients[uniqueId];
            io.emit('updateUserList', Object.values(clients));
        }
        console.log('Utilisateur déconnecté :', uniqueId);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
