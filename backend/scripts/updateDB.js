const mongoose = require('mongoose');
const Prefet = require('../models/prefets.model');

async function updateDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/prefetsdb');
        console.log('Connecté à MongoDB');

        const defaultValues = {
            role: 'membre',
            genre: 'Autre',
            photo: 'default-avatar.png',
            preferences: {
                notifications: {
                    email: true,
                    site: true
                },
                visibilite: {
                    profil: 'public',
                    email: 'contacts'
                },
                theme: 'clair'
            }
        };

        const result = await Prefet.updateMany(
            { role: { $exists: false } },
            { $set: defaultValues }
        );

        console.log(`${result.modifiedCount} utilisateurs mis à jour`);
        
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await mongoose.connection.close();
    }
}

updateDatabase();