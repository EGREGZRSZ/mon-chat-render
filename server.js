const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 10 * 1024 * 1024 // Permet d'envoyer des fichiers jusqu'à 10 Mo
});

app.use(express.static(path.join(__dirname, 'public')));

let clients = {};

io.on('connection', (socket) => {
    const uniqueId = socket.id;
    const randomPseudo = `Utilisateur_${uniqueId.substring(0, 5)}`;
    
    clients[uniqueId] = { 
        id: uniqueId, 
        pseudo: randomPseudo,
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    io.emit('updateUserList', Object.values(clients));

    // Réception d'un message (texte ou multimédia) du client
    socket.on('clientMessage', (data) => {
        const client = clients[uniqueId];
        if (client) {
            const messageData = {
                senderId: uniqueId,
                author: client.pseudo,
                text: data.text || '',
                file: data.file || null, // Données du fichier multimédia
                fileType: data.fileType || null,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            io.emit('newClientMessage', messageData);
        }
    });

    // Réponse de l'admin (texte ou multimédia) vers un client précis
    socket.on('adminReply', (data) => {
        const replyData = {
            author: '👑 Support Admin',
            text: data.text || '',
            file: data.file || null,
            fileType: data.fileType || null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        io.to(data.targetSocketId).emit('privateMessage', replyData);
        io.emit('adminReplySent', { targetSocketId: data.targetSocketId, ...replyData });
    });

    socket.on('disconnect', () => {
        if (clients[uniqueId]) {
            delete clients[uniqueId];
            io.emit('updateUserList', Object.values(clients));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
