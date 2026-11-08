const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Récupération du token depuis le cookie HttpOnly (via cookie-parser)
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Aucun token trouvé dans les cookies.' });
  }

  try {
    // 1. Vérification et décodage du token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Attachement des informations utilisateur (id, email, role) à la requête
    req.user = decoded;

    next();
  } catch (e) {
    return res.status(401).json({ message: "Le token n'est pas valide ou a expiré." });
  }
};

const admin = (req, res, next) => {
  // Vérifie si l'utilisateur est authentifié et possède le rôle admin
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé. Vous n'êtes pas un administrateur." });
  }
};

module.exports = { auth, admin };