'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const dotenv = require('dotenv')
dotenv.config()

const db = {}

// --- DEBUG TEMPORAIRE : à retirer une fois le problème résolu ---
console.log('=== DEBUG DB ENV ===')
console.log('DB_HOST:', JSON.stringify(process.env.DB_HOST))
console.log('DB_PORT:', JSON.stringify(process.env.DB_PORT))
console.log('DB_USER:', JSON.stringify(process.env.DB_USER))
console.log('DB_NAME:', JSON.stringify(process.env.DB_NAME))
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined')
console.log('DB_PASSWORD:', JSON.stringify(process.env.DB_PASSWORD))
console.log('=====================')
// --- FIN DEBUG ---

let sequelize
try {
  // On crée l'instance de Sequelize
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
      logging: false,
    }
  )

  // On teste la connexion
  sequelize
    .authenticate()
    .then(() => {
      console.log('Connexion à la base de données réussie !')
    })
    .catch((err) => {
      console.error('Erreur de connexion à la base de données :', err)
    })
} catch (error) {
  console.error("Erreur lors de la création de l'instance Sequelize :", error)
}

// On charge tous les modèles du dossier 'models'
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    )
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    )
    db[model.name] = model
  })

// On configure les associations entre les modèles
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db