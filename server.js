// ----------------------------------------------------
// 1. Chargement Conditionnel des Variables d'Environnement
// ----------------------------------------------------
const path = require('path');
const dotenv = require('dotenv');

// Déterminer l'environnement ('development' par défaut si non défini)
const env = process.env.NODE_ENV || 'development';

// Charger le fichier .env correspondant en priorité (.env.development ou .env.production)
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`)
});

// Fallback sur un .env classique si nécessaire
dotenv.config();

console.log('=== VARIABLES ENV ===');
console.log(`🌍 Environnement chargé : .env.${env}`);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('=====================');

const express = require('express');
const cors = require('cors');
const db = require('./models');
// Importation des routes
const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Initialisation de l'application Express
const app = express();

// Récupérer le port depuis l'environnement chargé (ou 5000 par défaut)
const PORT = process.env.PORT || 5000;

// ----------------------------------------------------
// 2. CONFIGURATION CORS (pour Vercel + local)
// ----------------------------------------------------
const allowedOrigins = [
  'https://adlam-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:4200',
  'http://localhost:3000',
  'https://akweeyo.com',
  'https://www.akweeyo.com'
];

// Rendre le dossier public/uploads accessible publiquement en URL
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans header Origin (Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        console.log('Origine bloquée par CORS:', origin);
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  }),
);

// ----------------------------------------------------
// 3. Middlewares standards
// ----------------------------------------------------
app.use(express.json());

// ----------------------------------------------------
// 4. Connexion et synchronisation de la base de données
// ----------------------------------------------------
db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('✅ Connexion à la base de données réussie et synchronisée.');

    // Routes principales (après connexion à la DB)
    app.use('/api/auth', authRoutes);
    app.use('/api/articles', articlesRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api', commentRoutes);

    // Lancement du serveur (Utilisation de PORT en majuscules)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT} en mode ${env}`);
    });
  })
  .catch((err) => {
    console.error(
      '⚠️ Erreur de synchronisation de la base de données. Le serveur démarre quand même :',
      err.message,
    );

    // Démarre quand même le serveur pour éviter un 502 Railway
    app.use('/api/auth', authRoutes);
    app.use('/api/articles', articlesRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api', commentRoutes);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Serveur en ligne sur le port ${PORT} en mode ${env}`);
    });
  });