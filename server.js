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
    const uniqueId = socket.id;
    
    // Génération automatique d'un pseudo unique basé sur l'ID
    const randomPseudo = `Utilisateur_${uniqueId.substring(0, 5)}`;
    
    clients[uniqueId] = { 
        id: uniqueId, 
        pseudo: randomPseudo,
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    console.log(`Nouveau client connecté automatiquement : ${randomPseudo} (${uniqueId})`);
    
    // Diffuse la liste actualisée aux admins
    io.emit('updateUserList', Object.values(clients));

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
