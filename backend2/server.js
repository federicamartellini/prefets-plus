console.log('test du server node js pour après utiliser le module Express'); // Message de démarrage du serveur

//const express = require('express'); //import
//onst bodyParser = require('body-parser'); //import
//const cors = require('cors'); //import
//const mongoose = require('./database/connection'); //Connexion MongoDB
//const userRoutes = require('./routes/userRoutes'); // // Fichier de routes.
//const messageRoutes = require('./routes/messageRoutes'); // // Fichier de routes pour les messages

//const app = express(); //initialisation du server

// Middleware
//app.use(bodyParser.json()); // Lire les données JSON dans les requêtes.
//app.use(cors()); // Gérer les permissions entre serveurs.

// Routes
//app.use('/api/users', userRoutes); // Endpoint pour les utilisateurs.
//app.use('/api/messages', messageRoutes); // Endpoint pour les messages

// Port 
//const PORT = process.env.PORT || 3000; //demarrage du server
// Lancement du serveur
//app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Route de base
//app.get('/', (req, res) => {
   // res.send('Bienvenue sur votre serveur!');
//});