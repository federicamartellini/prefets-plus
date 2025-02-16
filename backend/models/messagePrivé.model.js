const mongoose = require('mongoose');

const messagePriveSchema = new mongoose.Schema({
    expediteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prefet',
        required: true
    },
    destinataire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prefet',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    lu: {
        type: Boolean,
        default: false
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MessagePrive', messagePriveSchema);