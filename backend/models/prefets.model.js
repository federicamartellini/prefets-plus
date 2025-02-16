const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const PrefetSchema = new mongoose.Schema({
    nom: { 
        type: String, 
        required: true 
    },
    prenom: { 
        type: String, 
        required: true 
    },
    region: { 
        type: String, 
        required: false  // Changé de true à false
    },
    email: { 
        type: String, 
        required: true,
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prefet'
    }],
    contactRequests: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prefet'
        },
        recommendedBy: {  
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prefet',
            required: false
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],

    role: {
        type: String,
        enum: ['membre', 'admin'],
        default: 'membre'
    },
    pseudonyme: {
        type: String,
        unique: true,
        sparse: true
    },
    genre: {
        type: String,
        enum: ['Homme', 'Femme', 'Autre'],
        default: 'Autre'
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    coordonnees: {
        adresse: String,
        ville: String,
        codePostal: String,
        pays: {
            type: String,
            default: 'France'
        }
    },
    photo: {
        type: String,
        default: 'default-avatar.png'
    },
    presentation: {
        type: String,
        maxLength: 1000
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            site: { type: Boolean, default: true }
        },
        visibilite: {
            profil: { 
                type: String, 
                enum: ['public', 'contacts', 'prive'], 
                default: 'public' 
            },
            email: { 
                type: String, 
                enum: ['public', 'contacts', 'prive'], 
                default: 'contacts' 
            }
        },
        theme: {
            type: String,
            enum: ['clair', 'sombre'],
            default: 'clair'
        }
    },
    dateCreation: {
        type: Date,
        default: Date.now
    },
    derniereMaj: {
        type: Date,
        default: Date.now
    }
});

PrefetSchema.pre('save', function(next) {
    this.derniereMaj = new Date();
    next();
});

PrefetSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

PrefetSchema.methods.isFieldVisible = function(field, viewerUser) {
    const visibility = this.preferences.visibilite[field];
    
    if (visibility === 'public') return true;
    if (!viewerUser) return false;
    if (viewerUser._id.equals(this._id)) return true;
    if (visibility === 'contacts') {
        return this.contacts.some(contact => contact.equals(viewerUser._id));
    }
    return false;
};

module.exports = mongoose.model('Prefet', PrefetSchema);

