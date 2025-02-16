const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    contenu: {
        type: String,
        required: true
    },
    auteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prefet',
        required: true
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'messages' // Spécifie explicitement le nom de la collection
});

module.exports = mongoose.model('Message', MessageSchema);