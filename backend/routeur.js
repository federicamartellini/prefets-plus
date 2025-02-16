const express = require('express');
const routeur = express.Router();
const twig = require('twig');
const bcrypt = require('bcrypt');
const Prefet = require('./models/prefets.model'); 
const Message = require('./models/messages.model');
const ChatMessage = require('./models/chat.model');
const mongoose = require('mongoose');
const MessagePrive = require('./models/messagePrivé.model');
const multer = require('multer');
const path = require('path');
const isAdmin = require('./middlewares/isAdmin');

// Configuration de multer pour les uploads de photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/photos')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Seuls les fichiers images sont autorisés"));
    }
});

// Route d'accueil
routeur.get('/', (req, res) => {
    res.render('accueil.html.twig', {
        user: req.session.user,
        current_path: req.path
    });
});

// Route test
routeur.get('/test', (req, res) => {
    console.log('Demande GET reçue sur /test');
    res.send('Demande GET reçue avec url test');
});

// Route pour afficher le formulaire de connexion
routeur.get('/login', (req, res) => {
    res.render('auth/login.html.twig', {
        current_path: req.path
    });
});

// Route de connexion
routeur.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Tentative de connexion avec:', email);
        
        const prefet = await Prefet.findOne({ email });
        if (!prefet) {
            return res.render('auth/login.html.twig', {
                error: 'Email ou mot de passe incorrect',
                current_path: req.path
            });
        }

        const validPassword = await bcrypt.compare(password, prefet.password);
        if (!validPassword) {
            return res.render('auth/login.html.twig', {
                error: 'Email ou mot de passe incorrect',
                current_path: req.path
            });
        }

        req.session.user = {
            _id: prefet._id,
            nom: prefet.nom,
            prenom: prefet.prenom,
            email: prefet.email,
            region: prefet.region
        };
        
        return res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return res.render('auth/login.html.twig', {
            error: 'Une erreur est survenue lors de la connexion',
            current_path: req.path
        });
    }
});

// Remplacer la route GET /register existante par :
routeur.get('/register', (req, res) => {
    const prefetId = req.query.prefet;
    res.render('auth/register.html.twig', {
        prefetId: prefetId,
        values: {},
        current_path: req.path
    });
});

// Route d'inscription modifiée
routeur.post("/register", upload.single('photo'), async (req, res) => {
    try {
        const {
            nom, prenom, email, password,
            region, pseudonyme, genre, age,
            presentation, notifications_email, notifications_site
        } = req.body;

        // Validation minimale
        if (!nom || !prenom || !email || !password) {
            return res.render('auth/register.html.twig', {
                error: "Veuillez remplir les champs obligatoires",
                values: req.body
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Création avec tous les champs
        const newPrefet = new Prefet({
            nom,
            prenom,
            email,
            password: hashedPassword,
            region,
            pseudonyme: pseudonyme || `${prenom} ${nom}`,
            genre,
            age: age || null,
            photo: req.file ? req.file.filename : 'default-avatar.png',
            presentation,
            preferences: {
                notifications: {
                    email: notifications_email === 'on',
                    site: notifications_site === 'on'
                }
            }
        });

        await newPrefet.save();

        // Connexion automatique
        req.session.user = {
            _id: newPrefet._id,
            nom: newPrefet.nom,
            prenom: newPrefet.prenom,
            email: newPrefet.email,
            role: newPrefet.role
        };

        res.redirect('/');

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.render('auth/register.html.twig', {
            error: "Une erreur est survenue lors de l'inscription",
            values: req.body
        });
    }
});

// Route pour afficher les préfets
routeur.get('/prefets', async (req, res) => {
    try {
        const prefets = await Prefet.find();
        
        // Si l'utilisateur est connecté, récupérer ses contacts
        let contactIds = [];
        if (req.session.user) {
            const user = await Prefet.findById(req.session.user._id);
            contactIds = user.contacts ? user.contacts.map(contact => contact.toString()) : [];
        }

        res.render('prefets/liste.html.twig', {  // Changé de index.html.twig à liste.html.twig
            prefets: prefets,
            user: req.session.user,
            contactIds: contactIds,
            current_path: req.path
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
});

// Route dynamique pour afficher un préfet en particulier
routeur.get('/prefets/:prenomnom', (req, res) => {
    console.log(req.params.prenomnom);
    res.render('prefets/messagesperso.html.twig', { 
        identite: req.params.prenomnom,
        user: req.session.user,
        current_path: req.path
    });
});

// Modifier la route pour voir le profil d'un préfet spécifique
routeur.get('/prefets/:id', async (req, res) => {
    try {
        const prefet = await Prefet.findById(req.params.id)
            .populate('contacts');
            
        if (!prefet) {
            console.log('Préfet non trouvé:', req.params.id);
            return res.status(404).render('error.html.twig', {
                message: 'Préfet non trouvé',
                error: { status: 404 },
                user: req.session.user
            });
        }

        // Récupérer les messages du préfet
        const messages = await Message.find({ 
            destinataire: prefet._id 
        })
        .populate('auteur')
        .sort({ dateCreation: -1 });

        console.log('Affichage du profil de:', prefet.prenom, prefet.nom);

        res.render('prefets/profil.html.twig', {
            prefet,
            messages,
            user: req.session.user,
            isAdmin: req.session.user && req.session.user.email === 'vincente.martino@gmail.com',
            current_path: req.path
        });

    } catch (error) {
        console.error('Erreur lors de l\'affichage du profil:', error);
        res.status(500).render('error.html.twig', {
            message: 'Erreur lors de l\'affichage du profil',
            error: { status: 500 },
            user: req.session.user
        });
    }
});

// Route pour l'agora des messages (renommée)
routeur.get('/messages', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const messages = await Message.find()
            .populate('auteur')
            .sort({ dateCreation: -1 })
            .exec();

        res.render('prefets/messages.html.twig', {
            messages,
            user: req.session.user,
            title: "Agora des messages",
            current_path: req.path
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).send("Une erreur est survenue.");
    }
});

// Route pour publier un message
routeur.post('/messages/publier', async (req, res) => {
    try {
        // Vérifie si l'utilisateur est connecté
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const { contenu } = req.body;
        
        // Vérifie si le message n'est pas vide
        if (!contenu || contenu.trim().length === 0) {
            return res.redirect('/messages');
        }

        // Crée et sauvegarde le nouveau message
        const newMessage = new Message({
            contenu: contenu.trim(),
            auteur: req.session.user._id
        });

        await newMessage.save();
        console.log('Nouveau message créé:', newMessage._id);
        
        res.redirect('/messages');

    } catch (error) {
        console.error('Erreur lors de la publication du message:', error);
        res.status(500).send("Une erreur est survenue.");
    }
});

// Route pour afficher le chat
routeur.get('/chat', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const user = await Prefet.findById(req.session.user._id)
            .populate('contacts', 'nom prenom region');

        res.render('prefets/chat.html.twig', {
            user: req.session.user,
            contacts: user.contacts || [],
            current_path: req.path
        });
    } catch (error) {
        console.error('Erreur lors du chargement du chat:', error);
        res.status(500).send("Une erreur est survenue");
    }
});

// Route pour récupérer l'historique des messages
routeur.get('/chat/history/:contactId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Non autorisé" });
        }

        const messages = await ChatMessage.find({
            $or: [
                { 
                    sender: req.session.user._id,
                    receiver: req.params.contactId
                },
                {
                    sender: req.params.contactId,
                    receiver: req.session.user._id
                }
            ]
        })
        .sort({ timestamp: 1 })
        .populate('sender', 'nom prenom')
        .exec();

        res.json(messages);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

// Route pour récupérer l'historique des messages
routeur.get('/chat/messages/:roomId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Non autorisé" });
        }

        const messages = await ChatMessage.find({
            roomId: req.params.roomId
        })
        .populate('sender', 'nom prenom photo')
        .populate('receiver', 'nom prenom photo')
        .sort({ timestamp: 1 })
        .exec();

        res.json(messages);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

// Ajouter cette nouvelle route pour l'envoi de messages
routeur.post('/chat/send', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Non autorisé" });
        }

        const { receiver, content } = req.body;

        const newMessage = new ChatMessage({
            sender: req.session.user._id,
            receiver: receiver,
            content: content,  // Maintenant on utilise 'content' au lieu de 'message'
            timestamp: new Date()
        });

        await newMessage.save();

        const populatedMessage = await ChatMessage.findById(newMessage._id)
            .populate('sender', 'nom prenom')
            .exec();

        res.json(populatedMessage);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

// Route pour marquer un message comme lu
routeur.post('/chat/mark-read/:messageId', async (req, res) => {
    try {
        await ChatMessage.findByIdAndUpdate(req.params.messageId, { read: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

// Route pour marquer tous les messages d'un contact comme lus
routeur.post('/chat/mark-all-read/:contactId', async (req, res) => {
    try {
        await ChatMessage.updateMany(
            {
                sender: req.params.contactId,
                receiver: req.session.user._id,
                read: false
            },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

routeur.get('/calendrier', (req, res) => {
    console.log('Accès à /calendrier');
    res.render('prefets/calendrier.html.twig', {
        user: req.session.user,
        current_path: req.path
    });
});

// Route pour afficher le profil
routeur.get('/profil', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('auth/profil.html.twig', {
        user: req.session.user,
        current_path: req.path
    });
});

// Route pour modifier le profil
routeur.post('/profil/edit', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const { nom, prenom, region, email } = req.body;
        const userId = req.session.user._id;

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        const existingUser = await User.findOne({ 
            email, 
            _id: { $ne: userId } 
        });

        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { nom, prenom, region, email },
            { new: true }
        );

        // Mettre à jour la session
        req.session.user = updatedUser;
        res.redirect('/profil');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
    }
});

// Route de mise à jour du profil
routeur.post("/profil/update", upload.single('photo'), async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Non autorisé" });
        }

        const updateData = {
            ...req.body,
            'preferences.notifications.email': req.body.notifications_email === 'on',
            'preferences.notifications.site': req.body.notifications_site === 'on'
        };

        if (req.file) {
            updateData.photo = req.file.filename;
        }

        const updatedUser = await Prefet.findByIdAndUpdate(
            req.session.user._id,
            updateData,
            { new: true }
        );

        res.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Route de recherche
routeur.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query) {
            return res.redirect('/');
        }

        // Création d'une expression régulière insensible à la casse
        const searchRegex = new RegExp(query, 'i');

        // Recherche dans la base de données
        const prefets = await Prefet.find({
            $or: [
                { nom: searchRegex },
                { prenom: searchRegex },
                { region: searchRegex }
            ]
        });

        res.render('search/results.html.twig', {
            prefets,
            query,
            user: req.session.user,
            current_path: req.path
        });

    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).render('search/results.html.twig', {
            error: 'Une erreur est survenue lors de la recherche',
            user: req.session.user,
            current_path: req.path
        });
    }
});

// Amélioration de la route de déconnexion
routeur.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la déconnexion :', err);
            res.status(500).send('Erreur lors de la déconnexion');
            return;
        }
        // Supprime le cookie de session
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Routes pour la gestion des contacts
routeur.post('/contacts/add/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Vous devez être connecté" });
        }

        const targetId = req.params.id;
        const currentUserId = req.session.user._id;

        // Vérifier que l'utilisateur n'essaie pas de s'ajouter lui-même
        if (targetId === currentUserId) {
            return res.status(400).json({ message: "Vous ne pouvez pas vous ajouter vous-même" });
        }

        // Ajouter la demande à l'utilisateur cible
        await Prefet.findByIdAndUpdate(targetId, {
            $addToSet: {
                contactRequests: {
                    from: currentUserId,
                    date: new Date()
                }
            }
        });

        res.json({ message: "Demande envoyée avec succès" });

    } catch (error) {
        console.error('Erreur lors de l\'envoi de la demande:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

routeur.post('/contacts/remove/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Vous devez être connecté" });
        }

        const targetId = req.params.id;
        const currentUserId = req.session.user._id;

        // Retirer le contact dans les deux sens
        await Prefet.findByIdAndUpdate(currentUserId, {
            $pull: { contacts: targetId }
        });

        await Prefet.findByIdAndUpdate(targetId, {
            $pull: { contacts: currentUserId }
        });

        res.json({ message: "Contact retiré avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors du retrait du contact" });
    }
});

routeur.post('/contacts/recommend', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Vous devez être connecté" });
        }

        const { targetId, recommendedId } = req.body;
        const currentUserId = req.session.user._id;

        // Vérifier que l'utilisateur recommandé existe
        const recommendedPrefet = await Prefet.findById(recommendedId);
        if (!recommendedPrefet) {
            return res.status(404).json({ message: "Utilisateur recommandé non trouvé" });
        }

        // Ajouter la recommandation
        await Prefet.findByIdAndUpdate(targetId, {
            $addToSet: {
                contactRequests: {
                    from: recommendedId,
                    recommendedBy: currentUserId
                }
            }
        });

        res.json({ message: "Recommandation envoyée avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la recommandation" });
    }
});

// Route pour afficher les contacts et les demandes
routeur.get('/contacts', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        // Récupérer l'utilisateur avec ses contacts et demandes
        const currentUser = await Prefet.findById(req.session.user._id)
            .populate('contacts')
            .populate({
                path: 'contactRequests.from',
                select: 'nom prenom photo region'
            })
            .populate({
                path: 'contactRequests.recommendedBy',
                select: 'nom prenom'
            });

        const contacts = currentUser.contacts || [];
        const contactRequests = currentUser.contactRequests || [];

        res.render('contacts/liste.html.twig', {
            contacts,
            contactRequests,
            user: req.session.user,
            current_path: req.path
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).render('error.html.twig', {
            message: 'Erreur lors de la récupération des contacts',
            error: { status: 500 },
            user: req.session.user
        });
    }
});

// Route pour accepter une demande
routeur.post('/contacts/accept', async (req, res) => {
    try {
        const { fromId } = req.body;
        const currentUser = await Prefet.findById(req.session.user._id);

        // Ajouter aux contacts mutuellement
        await Prefet.findByIdAndUpdate(req.session.user._id, {
            $addToSet: { contacts: fromId },
            $pull: { contactRequests: { from: fromId } }
        });

        await Prefet.findByIdAndUpdate(fromId, {
            $addToSet: { contacts: req.session.user._id }
        });

        res.json({ message: 'Contact ajouté avec succès' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du contact' });
    }
});

// Route pour refuser une demande
routeur.post('/contacts/reject', async (req, res) => {
    try {
        const { fromId } = req.body;
        
        await Prefet.findByIdAndUpdate(req.session.user._id, {
            $pull: { contactRequests: { from: fromId } }
        });

        res.json({ message: 'Demande refusée avec succès' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur lors du refus de la demande' });
    }
});

// Route pour accepter une demande de contact
routeur.post('/contacts/accept/:requestId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Vous devez être connecté" });
        }

        const currentUserId = req.session.user._id;
        const requestId = req.params.requestId;

        // Trouver l'utilisateur actuel et ses demandes
        const currentUser = await Prefet.findById(currentUserId);
        const request = currentUser.contactRequests.id(requestId);

        if (!request) {
            return res.status(404).json({ message: "Demande non trouvée" });
        }

        // Ajouter les contacts mutuellement
        await Prefet.findByIdAndUpdate(currentUserId, {
            $addToSet: { contacts: request.from },
            $pull: { contactRequests: { _id: requestId } }
        });

        await Prefet.findByIdAndUpdate(request.from, {
            $addToSet: { contacts: currentUserId }
        });

        res.json({ message: "Contact accepté avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de l'acceptation du contact" });
    }
});

// Route pour accepter une demande
routeur.post('/contacts/accept/:requestId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Vous devez être connecté" });
        }

        const currentUserId = req.session.user._id;
        const requestId = req.params.requestId;

        // Trouver l'utilisateur actuel
        const currentUser = await Prefet.findById(currentUserId);
        
        // Trouver la demande spécifique
        const request = currentUser.contactRequests.id(requestId);
        
        if (!request) {
            return res.status(404).json({ message: "Demande non trouvée" });
        }

        // Ajouter les contacts mutuellement
        await Prefet.findByIdAndUpdate(currentUserId, {
            $addToSet: { contacts: request.from },
            $pull: { contactRequests: { _id: requestId } }
        });

        await Prefet.findByIdAndUpdate(request.from, {
            $addToSet: { contacts: currentUserId }
        });

        res.json({ message: "Contact accepté avec succès" });

    } catch (error) {
        console.error('Erreur lors de l\'acceptation de la demande:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

// Route pour refuser une demande
routeur.post('/contacts/reject/:requestId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Vous devez être connecté" });
        }

        const currentUserId = req.session.user._id;
        const requestId = req.params.requestId;

        // Supprimer la demande
        await Prefet.findByIdAndUpdate(currentUserId, {
            $pull: { contactRequests: { _id: requestId } }
        });

        res.json({ message: "Demande refusée avec succès" });

    } catch (error) {
        console.error('Erreur lors du refus de la demande:', error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

// Route pour les messages privés
routeur.get('/messages-prives', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        // Récupérer l'utilisateur avec ses contacts
        const user = await Prefet.findById(req.session.user._id)
            .populate('contacts', 'nom prenom region');

        // Récupérer toutes les conversations de l'utilisateur
        const conversations = await MessagePrive.aggregate([
            {
                $match: {
                    $or: [
                        { expediteur: new mongoose.Types.ObjectId(req.session.user._id) },
                        { destinataire: new mongoose.Types.ObjectId(req.session.user._id) }
                    ]
                }
            },
            {
                $sort: { dateCreation: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$expediteur", new mongoose.Types.ObjectId(req.session.user._id)] },
                            "$destinataire",
                            "$expediteur"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $eq: ["$destinataire", new mongoose.Types.ObjectId(req.session.user._id)] },
                                        { $eq: ["$lu", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Peupler les informations des utilisateurs
        const populatedConversations = await Prefet.populate(conversations, {
            path: "_id",
            select: "nom prenom region"
        });

        res.render('prefets/messages-prives.html.twig', {
            user: user,
            conversations: populatedConversations,
            current_path: req.path
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).send("Une erreur est survenue");
    }
});

// Route pour récupérer les messages d'une conversation
routeur.get('/messages-prives/:contactId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Non autorisé" });
        }

        const messages = await MessagePrive.find({
            $or: [
                { 
                    expediteur: req.session.user._id,
                    destinataire: req.params.contactId
                },
                {
                    expediteur: req.params.contactId,
                    destinataire: req.session.user._id
                }
            ]
        })
        .sort({ dateCreation: 1 })
        .populate('expediteur', 'nom prenom')
        .populate('destinataire', 'nom prenom');

        res.json(messages);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Route pour envoyer un message privé
routeur.post('/messages-prives/envoyer', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Non autorisé" });
        }

        const nouveauMessage = new MessagePrive({
            expediteur: req.session.user._id,
            destinataire: req.body.destinataire,
            message: req.body.message
        });

        await nouveauMessage.save();

        const messagePopule = await MessagePrive.findById(nouveauMessage._id)
            .populate('expediteur', 'nom prenom')
            .populate('destinataire', 'nom prenom');

        res.json(messagePopule);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Ajouter cette route
routeur.post('/messages-prives/read/:contactId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Non autorisé" });
        }

        await MessagePrive.updateMany(
            {
                expediteur: req.params.contactId,
                destinataire: req.session.user._id,
                lu: false
            },
            { lu: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du marquage des messages comme lus:', error);
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Routes pour les actions administrateur
routeur.delete('/admin/message/:messageId', isAdmin, async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.messageId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression du message" });
    }
});

routeur.delete('/admin/friend/:userId/:friendId', isAdmin, async (req, res) => {
    try {
        // Suppression dans les deux sens
        await Prefet.updateOne(
            { _id: req.params.userId },
            { $pull: { contacts: req.params.friendId } }
        );
        await Prefet.updateOne(
            { _id: req.params.friendId },
            { $pull: { contacts: req.params.userId } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression de l'ami" });
    }
});

// Route pour poster un message en tant qu'admin
routeur.post('/admin/message/:userId', isAdmin, async (req, res) => {
    try {
        const message = await Message.create({
            auteur: req.session.user._id,
            destinataire: req.params.userId,
            contenu: req.body.contenu,
            isAdminMessage: true
        });
        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création du message" });
    }
});

routeur.post('/admin/message', async (req, res) => {
    try {
        if (req.session.user.email !== 'vincente.martino@gmail.com') {
            return res.status(403).json({ error: "Non autorisé" });
        }

        const message = new Message({
            auteur: req.session.user._id,
            destinataire: req.body.destinataire,
            contenu: req.body.contenu,
            isAdminMessage: true
        });

        await message.save();
        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
});

// Middleware pour gérer les erreurs 404
routeur.use((req, res, next) => {
    const error = new Error('Page non trouvée');
    error.status = 404;
    next(error);
});

// Middleware global de gestion des erreurs
routeur.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.send(error.message);
});

module.exports = routeur;
