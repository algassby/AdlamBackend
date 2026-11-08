const path = require('path')
const fs = require('fs')
const cloudinary = require('./cloudinary') // Votre configuration Cloudinary existante

// Vérifie si on est en production
const isProduction = process.env.NODE_ENV === 'production'

// S'assurer que le dossier local d'upload existe en mode dev
const localUploadsDir = path.join(__dirname, '../public/uploads')
if (!isProduction && !fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true })
}

const storageService = {
  /**
   * Télécharge un fichier (buffer multer)
   * @param {Object} file - Le fichier provenant de req.file
   * @returns {Promise<string>} - L'URL sécurisée de l'image
   */
  async uploadFile(file) {
    if (!file) throw new Error('Aucun fichier fourni')

    if (isProduction) {
      // --- MODE PRODUCTION : Cloudinary ---
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: 'adlam_blog_articles',
        }
      )
      return result.secure_url
    } else {
      // --- MODE DÉVELOPPEMENT : Stockage Local ---
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const ext = path.extname(file.originalname) || '.jpg'
      const filename = `image-${uniqueSuffix}${ext}`
      const filepath = path.join(localUploadsDir, filename)

      // Écriture synchrone ou asynchrone du buffer sur le disque
      await fs.promises.writeFile(filepath, file.buffer)

      // Retourne l'URL locale relative (accessible via Express static)
      // Ex: http://localhost:5000/uploads/image-123456789.jpg
      const baseUrl = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5000'
      return `${baseUrl}/uploads/${filename}`
    }
  }
}

module.exports = storageService