const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.email === 'vincente.martino@gmail.com') {
        next();
    } else {
        res.status(403).json({ error: "Accès non autorisé" });
    }
};

module.exports = isAdmin;