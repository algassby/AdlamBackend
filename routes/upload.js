const express = require('express')
const router = express.Router()
const multer = require('multer')
const storageService = require('../services/storageService') // <-- Import du service
const { auth, admin } = require('../middleware/authMiddleware')

// Configurez Multer pour stocker les fichiers en mémoire temporairement
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Route d'upload d'image (protégée pour les admins)
router.post('/', auth, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été fourni." })
    }

    // Utilisation du service de stockage (Local en Dev / Cloudinary en Prod)
    const imageUrl = await storageService.uploadFile(req.file)

    res.status(200).json({ imageUrl })
  } catch (error) {
    console.error('Erreur détaillée lors de l\'upload:', error)
    res.status(500).json({ message: "Erreur lors du téléchargement de l'image." })
  }
})

module.exports = router