const mongoose = require('mongoose'); // je vais recuperer le module mongoose avec le require
const bcrypt = require('bcrypt');


// Création du schéma utilisateur
const UserSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    region: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Gestion du modèle utilisateur avec hachage du mot de passe avant sauvegarde 
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
