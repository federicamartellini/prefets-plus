const express = require('express'); // on va recuperer avec le require le module express que j'ai installé précedemment
const app = express(); // je peux lancer et assigner express dans un autre variable que j'appelle app
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const morgan = require('morgan'); // je vais recuperer le module morgan
const routeur = require('./routeur'); //je vais recuperer le routeur que j'ai cree dans le fichier routeur.js et IMPORTER le router 
const mongoose = require('mongoose'); // je vais recuperer le module mongoose avec le require
const twig = require('twig'); //je vais recuperer le module twig
const session = require('express-session'); //je vais recuperer le module express-session
const ChatMessage = require('./models/chat.model'); // Ajouter en haut du fichier avec les autres imports

// Configuration de Twig
app.set('views', './views');
app.set('view engine', 'twig');

// Ordre important des middlewares
app.use(express.json()); // Déplacé au début
app.use(express.urlencoded({ extended: true })); // je vais dire au app que je vais utiliser le middleware urlencoded pour recuperer les donnees des formulaires
app.use(express.static('public')); // je vais dire au app que le dossier public contient les fichiers statiques css
app.use(morgan('dev')); // je vais ajouter le middleware pour utiliser morgan avec le parametre dev pour avoir des logs dans la console

// Configuration des sessions
app.use(session({
    secret: 'mon_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mettre `true` en production avec HTTPS
}));

// Connexion MongoDB avec gestion d'erreur 
// Suppression des options dépréciées
mongoose.connect("mongodb://127.0.0.1:27017/france")
.then(() => console.log("MongoDB connecté"))
.catch(err => console.error("Erreur de connexion MongoDB:", err));

// Routes
app.use('/', routeur);

// Configuration de Socket.IO
// Garder une trace des utilisateurs connectés
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('join room', (roomId) => {
        // Quitter toutes les rooms précédentes
        socket.rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });
        socket.join(roomId);
        console.log(`Utilisateur a rejoint la room: ${roomId}`);
    });

    socket.on('chat message', async (data) => {
        try {
            const chatMessage = new ChatMessage({
                sender: data.sender._id,
                receiver: data.receiver,
                content: data.content,
                roomId: data.roomId,
                read: false
            });

            await chatMessage.save();
            
            const populatedMessage = await ChatMessage.findById(chatMessage._id)
                .populate('sender', 'nom prenom photo')
                .populate('receiver', 'nom prenom photo');

            // Émettre le message aux deux participants
            io.to(data.roomId).emit('chat message', populatedMessage);
            
            // Émettre une notification au destinataire s'il n'est pas dans la room
            const receiverSocket = onlineUsers.get(data.receiver);
            if (receiverSocket && receiverSocket !== socket.id) {
                io.to(receiverSocket).emit('new message notification', {
                    from: populatedMessage.sender,
                    content: populatedMessage.content
                });
            }

        } catch (error) {
            console.error('Erreur lors de la sauvegarde du message:', error);
            socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
        }
    });

    socket.on('mark messages as read', async (data) => {
        try {
            await ChatMessage.updateMany(
                { 
                    sender: data.contactId,
                    receiver: data.userId,
                    read: false
                },
                { read: true }
            );
            socket.emit('messages marked as read', { contactId: data.contactId });
        } catch (error) {
            console.error('Erreur lors du marquage des messages comme lus:', error);
        }
    });

    socket.on('user connected', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('user status', { userId, status: 'online' });
    });

    socket.on('typing', (data) => {
        socket.to(data.room).emit('typing', data);
    });

    socket.on('stop typing', (room) => {
        socket.to(room).emit('stop typing');
    });

    socket.on('join chat', async (data) => {
        const roomId = data.roomId;
        socket.join(roomId);
        
        // Marquer les messages comme lus
        await ChatMessage.updateMany(
            {
                roomId,
                receiver: data.userId,
                read: false
            },
            { read: true }
        );
        
        // Informer l'expéditeur que les messages ont été lus
        socket.to(roomId).emit('messages read', { roomId });
    });

    socket.on('typing start', (data) => {
        socket.to(data.roomId).emit('typing start', {
            userId: data.userId,
            name: data.name
        });
    });

    socket.on('typing stop', (data) => {
        socket.to(data.roomId).emit('typing stop', {
            userId: data.userId
        });
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
        // Trouver l'utilisateur déconnecté
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user status', { userId, status: 'offline' });
                break;
            }
        }
    });
});

// Démarrage du serveur avec gestion d'erreur
const PORT = process.env.PORT || 3000;
http.listen(PORT, (err) => {
    if (err) {
        console.error("Erreur au démarrage du serveur :", err);
        return;
    }
    console.log(`Serveur démarré sur le port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Le port ${PORT} est déjà utilisé. Arrêtez le processus qui l'utilise ou choisissez un autre port.`);
    }
});
