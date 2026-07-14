// ----------------------------------------------------
// 1. Chargement Conditionnel des Variables d'Environnement
// ----------------------------------------------------

require('dotenv').config()

console.log('=== VARIABLES ENV ===')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('EMAIL_HOST:', process.env.EMAIL_HOST)
console.log('DB_NAME:', process.env.DB_NAME)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('EMAIL_HOST:', process.env.EMAIL_HOST)
console.log('=====================')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cors = require('cors')
const db = require('./models')

// Importation des routes
const authRoutes = require('./routes/auth')
const articlesRoutes = require('./routes/articles')
const uploadRoutes = require('./routes/upload')
const userRoutes = require('./routes/userRoutes')
const commentRoutes = require('./routes/commentRoutes')

// Initialisation de l'application Express
const app = express()
const port = process.env.PORT || 5000

// ----------------------------------------------------
// 2. CONFIGURATION CORS (pour Vercel + local)
// ----------------------------------------------------
const allowedOrigins = [
  'https://adlam-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://akweeyo.com',
  'https://www.akweeyo.com', // AJOUTE CELLE-CI ABSOLUMENT
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans header Origin (Postman, etc.)
      if (!origin) return callback(null, true)

      // On vérifie si l'origine est dans notre liste
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true)
      } else {
        console.log('Origine bloquée par CORS:', origin) // Utile pour voir l'erreur dans les logs Railway
        return callback(new Error('Not allowed by CORS'))
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
)

// ----------------------------------------------------
// 3. Middlewares standards
// ----------------------------------------------------
app.use(express.json())

// ----------------------------------------------------
// 4. Connexion et synchronisation de la base de données
// ----------------------------------------------------
db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('✅ Connexion à la base de données réussie et synchronisée.')

    // Routes principales (après connexion à la DB)
    app.use('/api/auth', authRoutes)
    app.use('/api/articles', articlesRoutes)
    app.use('/api/upload', uploadRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api', commentRoutes)

    // Lancement du serveur
    app.listen(port, () => {
      console.log(`🚀 Serveur en cours d'exécution sur le port ${port}`)
    })
  })
  .catch((err) => {
    console.error(
      '⚠️ Erreur de synchronisation de la base de données. Le serveur démarre quand même :',
      err.message,
    )

    // Démarre quand même le serveur pour éviter un 502 Railway
    app.use('/api/auth', authRoutes)
    app.use('/api/articles', articlesRoutes)
    app.use('/api/upload', uploadRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api', commentRoutes)

    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Serveur en ligne sur le port ${port}`)
    })
  })
