const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Prefet = require('./models/prefets.model');

// Connexion à MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/france")
    .then(() => console.log("MongoDB connecté pour le peuplement"))
    .catch(err => console.error("Erreur de connexion MongoDB:", err));

// Fonction pour hasher le mot de passe
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

// Liste complète des nouveaux préfets à ajouter
const nouveauxPrefets = [
    { nom: "Séguy", prenom: "Yves", region: "Saône-et-Loire" },
    { nom: "Le Breton", prenom: "Yves", region: "Haute-Savoie" },
    { nom: "Cordier", prenom: "Yvan", region: "Haute-Loire" },
    { nom: "Pelletier", prenom: "Xavier", region: "Loir-et-Cher" },
    { nom: "Lefort", prenom: "Xavier", region: "Guadeloupe" },
    { nom: "Delarue", prenom: "Xavier", region: "Meuse" },
    { nom: "Brunetiere", prenom: "Xavier", region: "Manche" },
    { nom: "Roberti", prenom: "Vincent", region: "Tarn-et-Garonne" },
    { nom: "Berton", prenom: "Vincent", region: "Corrèze" },
    { nom: "Michel Moreaux", prenom: "Valérie", region: "Vosges" },
    { nom: "Campeaux", prenom: "Thomas", region: "Indre-et-Loire" },
    { nom: "Suquet", prenom: "Thierry", region: "Vaucluse" },
    { nom: "Queffelec", prenom: "Thierry", region: "Haut-Rhin" },
    { nom: "Devimeux", prenom: "Thierry", region: "Drôme" },
    { nom: "Bonnier", prenom: "Thierry", region: "Pyrénées-Orientales" },
    { nom: "Lanxade", prenom: "Thibault", region: "Indre" },
    { nom: "Bredin", prenom: "Stéphane", region: "Calvados" },
    { nom: "Elizéon", prenom: "Sophie", region: "Ardèche" },
    { nom: "Brocas", prenom: "Sophie", region: "Loiret" },
    { nom: "Bertoux", prenom: "Simon", region: "Ariège" },
    { nom: "Castel", prenom: "Serge", region: "Jura" },
    { nom: "Boulanger", prenom: "Serge", region: "Vienne" },
    { nom: "Jallet", prenom: "Sébastien", region: "Orne" },
    { nom: "Royet", prenom: "Romain", region: "Haute-Saône" },
    { nom: "Mouchel-Blaisot", prenom: "Rollon", region: "Somme" },
    { nom: "Bastille", prenom: "Remi", region: "Doubs" },
    { nom: "Pam", prenom: "Régine", region: "Haute-Marne" },
    { nom: "Colliex", prenom: "Pierre-Edouard", region: "Bouches-du-Rhône" },
    { nom: "Durand", prenom: "Pierre-André", region: "Haute-Garonne" },
    { nom: "Ory", prenom: "Pierre", region: "Seine-et-Marne" },
    { nom: "Mahé", prenom: "Philippe", region: "Var" },
    { nom: "Loos", prenom: "Philippe", region: "Cantal" },
    { nom: "Court", prenom: "Philippe", region: "Val-d'Oise" },
    { nom: "Chopin", prenom: "Philippe", region: "Maine-et-Loire" },
    { nom: "Mourier", prenom: "Paul", region: "Côte-d'Or" },
    { nom: "Latron", prenom: "Patrice", region: "La Réunion" },
    { nom: "Jan", prenom: "Pascal", region: "Yonne" },
    { nom: "Courtade", prenom: "Pascal", region: "Aube" },
    { nom: "Bolot", prenom: "Pascal", region: "Morbihan" },
    { nom: "Prosic", prenom: "Michel", region: "Haute-Corse" },
    { nom: "Barate", prenom: "Maurice", region: "Cher" },
    { nom: "Souliman", prenom: "Marie-Françoise", region: "Meurthe-et-Moselle" },
    { nom: "Gaspari", prenom: "Marie-Aimée", region: "Mayenne" },
    { nom: "Aubert", prenom: "Marie", region: "Dordogne" },
    { nom: "Guillaume", prenom: "Marc", region: "Paris" },
    { nom: "Chappuis", prenom: "Marc", region: "Alpes-de-Haute-Provence" },
    { nom: "Le Franc", prenom: "Louis", region: "Nouvelle-Calédonie" },
    { nom: "Touvet", prenom: "Laurent", region: "Moselle" },
    { nom: "Nuñez", prenom: "Laurent", region: "Paris" },
    { nom: "Buchaillat", prenom: "Laurent", region: "Tarn" },
    { nom: "Charles", prenom: "Julien", region: "Seine-Saint-Denis" },
    { nom: "Mathurin", prenom: "Joel", region: "Puy-de-Dôme" },
    { nom: "Harnois", prenom: "Jérôme", region: "Charente" },
    { nom: "Filippini", prenom: "Jérôme", region: "Corse-du-Sud" },
    { nom: "Bonet", prenom: "Jérôme", region: "Gard" },
    { nom: "Girier", prenom: "Jean-Marie", region: "Pyrénées-Atlantiques" },
    { nom: "Caillaud", prenom: "Jean-Marie", region: "Oise" },
    { nom: "Albertini", prenom: "Jean-Benoît", region: "Seine-Maritime" },
    { nom: "Salomon", prenom: "Jean", region: "Hautes-Pyrénées" },
    { nom: "Witkowski", prenom: "Jacques", region: "Bas-Rhin" },
    { nom: "Billant", prenom: "Jacques", region: "Pas-de-Calais" },
    { nom: "Moutouh", prenom: "Hugues", region: "Alpes-Maritimes" },
    { nom: "Jonathan", prenom: "Hervé", region: "Eure-et-Loir" },
    { nom: "Prevost", prenom: "Henri", region: "Marne" },
    { nom: "Quénéhervé", prenom: "Gilles", region: "Lozère" },
    { nom: "Gavory", prenom: "Gérard", region: "Vendée" },
    { nom: "Leclerc", prenom: "Georges-François", region: "Bouches-du-Rhône" },
    { nom: "Camilleri", prenom: "Frédérique", region: "Essonne" },
    { nom: "Rose", prenom: "Frédéric", region: "Yvelines" },
    { nom: "Tahéri", prenom: "Françoise", region: "Landes" },
    { nom: "Lauch", prenom: "François-Xavier", region: "Hérault" },
    { nom: "Bieuville", prenom: "François-Xavier", region: "Mayotte" },
    { nom: "Ravier", prenom: "François", region: "Savoie" },
    { nom: "Pesneau", prenom: "François", region: "Haute-Vienne" },
    { nom: "Guillotou de Kérever", prenom: "François", region: "Côtes-d'Armor" },
    { nom: "Jeanblanc Risler", prenom: "Florence", region: "Terres australes et antarctiques" },
    { nom: "Anor", prenom: "Fanny", region: "Aisne" },
    { nom: "Rigoulet-Roze", prenom: "Fabrice", region: "Loire-Atlantique" },
    { nom: "Decottignies", prenom: "Fabienne", region: "Nièvre" },
    { nom: "Buccio", prenom: "Fabienne", region: "Rhône" },
    { nom: "Stoskopf", prenom: "Etienne", region: "Val-de-Marne" },
    { nom: "Guyot", prenom: "Étienne", region: "Gironde" },
    { nom: "Desplanques", prenom: "Etienne", region: "Martinique" },
    { nom: "Spitz", prenom: "Eric", region: "Polynésie française" },
    { nom: "Dubée", prenom: "Emmanuelle", region: "Deux-Sèvres" },
    { nom: "Aubry", prenom: "Emmanuel", region: "Sarthe" },
    { nom: "Dufour", prenom: "Dominique", region: "Hautes-Alpes" },
    { nom: "Barnier", prenom: "Daniel", region: "Lot-et-Garonne" },
    { nom: "Le Vely", prenom: "Cyrille", region: "Saint-Barthélemy et Saint-Martin" },
    { nom: "Raulin", prenom: "Claire", region: "Lot" },
    { nom: "Chauffour-Rouillard", prenom: "Claire", region: "Aveyron" },
    { nom: "Noël du Payrat", prenom: "Christophe", region: "Allier" },
    { nom: "Pouget", prenom: "Christian", region: "Aude" },
    { nom: "Giusti", prenom: "Charles", region: "Eure" },
    { nom: "Mauchet", prenom: "Chantal", region: "Ain" },
    { nom: "Seguin", prenom: "Catherine", region: "Isère" },
    { nom: "André", prenom: "Bruno", region: "Saint-Pierre-et-Miquelon" },
    { nom: "Blondel", prenom: "Brice", region: "Charente-Maritime" },
    { nom: "Gourtay", prenom: "Blaise", region: "Wallis-et-Futuna" },
    { nom: "Gaume", prenom: "Bertrand", region: "Nord" },
    { nom: "Poussier", prenom: "Antoine", region: "Guyane" },
    { nom: "Frackowiak-Jacobs", prenom: "Anne", region: "Creuse" },
    { nom: "de Saint Quentin", prenom: "Amaury", region: "Ille-et-Vilaine" },
    { nom: "Rochatte", prenom: "Alexandre", region: "Loire" },
    { nom: "Brugère", prenom: "Alexandre", region: "Hauts-de-Seine" },
    { nom: "Espinasse", prenom: "Alain", region: "Finistère" },
    { nom: "Charrier", prenom: "Alain", region: "Territoire de Belfort" },
    { nom: "Castanier", prenom: "Alain", region: "Gers" },
    { nom: "Bucquet", prenom: "Alain", region: "Ardennes" }
];

// Ajout de l'administrateur
async function createAdmin() {
    try {
        const adminPassword = await hashPassword("fede");
        
        const adminExistant = await Prefet.findOne({ email: 'vincente.martino@gmail.com' });

        if (!adminExistant) {
            const admin = await Prefet.create({
                nom: "Martino",
                prenom: "Vincente",
                email: "vincente.martino@gmail.com",
                password: adminPassword,
                role: "admin",
                region: "Île-de-France",
                preferences: {
                    notifications: {
                        email: true,
                        site: true
                    },
                    visibilite: {
                        profil: 'public',
                        email: 'public'
                    }
                }
            });

            console.log('Administrateur créé avec succès:', admin.prenom, admin.nom);
        } else {
            console.log('L\'administrateur existe déjà');
            // Mise à jour du rôle si nécessaire
            if (adminExistant.role !== 'admin') {
                await Prefet.updateOne(
                    { _id: adminExistant._id },
                    { $set: { role: 'admin' } }
                );
                console.log('Rôle administrateur mis à jour');
            }
        }

    } catch (error) {
        console.error('Erreur lors de la création de l\'administrateur:', error);
    }
}

// Fonction pour peupler la base de données
async function populateDatabase() {
    try {
        // Création de l'admin d'abord
        await createAdmin();

        // Reste du code pour les autres préfets
        const defaultPassword = await hashPassword("DefaultPassword2024!");
        
        for (const prefet of nouveauxPrefets) {
            const email = `${prefet.prenom.toLowerCase()}.${prefet.nom.toLowerCase().replace(/ /g, '')}@prefet.gouv.fr`;
            
            const prefetExistant = await Prefet.findOne({ email });

            if (!prefetExistant) {
                await Prefet.create({
                    ...prefet,
                    email,
                    password: defaultPassword
                });
                console.log(`Ajout de ${prefet.prenom} ${prefet.nom}`);
            } else {
                console.log(`${prefet.prenom} ${prefet.nom} existe déjà`);
            }
        }

        const totalPrefets = await Prefet.countDocuments();
        console.log(`Nombre total de préfets dans la base: ${totalPrefets}`);
        
    } catch (error) {
        console.error('Erreur lors du peuplement:', error);
    } finally {
        await mongoose.connection.close();
    }
}

populateDatabase();