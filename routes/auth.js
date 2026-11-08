// routes/auth.js
const express = require('express')
const router = express.Router()
const db = require('../models') // Importez db dans le fichier de route
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {auth: verifyToken} = require('../middleware/authMiddleware'); // Le middleware créé ci-dessus

// Route d'inscription pour un nouvel utilisateur
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Vérifiez si l'utilisateur existe déjà
    const existingUser = await db.User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' })
    }

    // Hachez le mot de passe
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Créez le nouvel utilisateur avec le rôle par défaut 'visitor'
    const newUser = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: 'visitor',
    })

    res
      .status(201)
      .json({ message: 'Utilisateur créé avec succès.', user: newUser })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur lors de l'inscription." })
  }
})

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Vérifiez l'existence de l'utilisateur
    const user = await db.User.findOne({ where: { email } })
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' })
    }

    // Vérifiez le mot de passe
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect.' })
    }
    // Créez et signez le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // Aligné sur la durée de vie du cookie si souhaité
    )

    // 1. Définir le token dans un cookie HttpOnly sécurisé
   res.cookie('token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production', // false en local (HTTP), true en prod (HTTPS)
     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'lax' en local, 'none' si cross-site en prod
     maxAge: 7 * 24 * 60 * 60 * 1000
   });

    // 2. Renvoyer uniquement les informations de l'utilisateur (SANS le token dans le JSON)
    return res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erreur lors de la connexion.' })
  }
})

router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });

  return res.status(200).json({ message: 'Déconnexion réussie' });
});

router.get('/info', async (req, res) => {
  try {
    res.status(200).json({ message: 'Bonjour Masy !' })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'article." })
  }
})

// --- MOT DE PASSE OUBLIÉ (ÉTAPE 1 : ENVOI DU MAIL) ---

const { Resend } = require('resend')

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const user = await db.User.findOne({ where: { email } })
    if (!user)
      return res.status(404).json({ message: 'Utilisateur non trouvé.' })

    const token = crypto.randomBytes(20).toString('hex')
    const expires = Date.now() + 3600000

    await user.update({
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    })

    // Utiliser Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

    await resend.emails.send({
      from: 'noreply@akweeyo.com',
      to: user.email,
      subject: 'Réinitialisation de mot de passe',
      html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Réinitialisation de mot de passe</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: collapse;">

                    <!-- En-tête -->
                    <tr>
                      <td style="background-color: #1f2937; padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Akweeyo</h1>
                      </td>
                    </tr>

                    <!-- Contenu principal -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">Réinitialisation de mot de passe</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                          Vous avez demandé à réinitialiser le mot de passe de votre compte. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
                        </p>

                        <!-- Bouton d'action -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                          <tr>
                            <td align="center" bgcolor="#2563eb" style="border-radius: 6px;">
                              <a href="${resetUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; border: 1px solid #2563eb; display: inline-block; font-weight: 500;">
                                Réinitialiser mon mot de passe
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 8px;">
                          Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité. Ce lien expirera dans un délai limité.
                        </p>

                        <p style="color: #9ca3af; font-size: 13px; line-height: 1.4; margin-top: 32px; word-break: break-all;">
                          Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :<br>
                          <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
                        </p>
                      </td>
                    </tr>

                    <!-- Pied de page -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} Akweeyo. Tous droits réservés.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
    })

    res.status(200).json({ message: 'Email envoyé avec succès.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email." })
  }
})

// Route pour vérifier le statut de l'authentification et récupérer le profil
router.get('/me', verifyToken, async (req, res) => {
  try {
    // Utilisation correcte de findOne avec l'objet where pour l'email
    const user = await db.User.findOne({
      where: { email: req.user.email },
      attributes: { exclude: ['password'] } // Ne jamais renvoyer le mot de passe haché
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Renvoie l'objet user attendu par checkAuthStatus() dans Angular
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la session :', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { email } = req.body
//     const user = await db.User.findOne({ where: { email } })
//     if (!user)
//       return res.status(404).json({ message: 'Utilisateur non trouvé.' })

//     // Générer un token de 20 caractères
//     const token = crypto.randomBytes(20).toString('hex')
//     const expires = Date.now() + 3600000 // Valable 1 heure

//     // Sauvegarder dans la DB
//     await user.update({
//       resetPasswordToken: token,
//       resetPasswordExpires: expires,
//     })

//     // Configurer l'envoi
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//       port: 587,
//       secure: false, // Obligatoire pour le port 465
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       // Options critiques pour éviter le timeout sur Railway
//       tls: {
//         rejectUnauthorized: false, // Ne bloque pas si le certificat est mal reconnu
//         minVersion: 'TLSv1.2',
//       },
//       connectionTimeout: 20000, // On donne 20 secondes
//       greetingTimeout: 20000,
//       socketTimeout: 20000,
//     })

//     // Test de connexion au démarrage
//     transporter.verify(function (error, success) {
//       if (error) {
//         console.log('Erreur configuration email :', error)
//       } else {
//         console.log('Serveur prêt à envoyer des emails ✅')
//       }
//     })

//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

//     await transporter.sendMail({
//       from: 'akweeyo@gmail.com',
//       to: user.email,
//       subject: 'Réinitialisation de mot de passe',
//       html: `<p>Vous avez demandé une réinitialisation. Cliquez ici : <a href="${resetUrl}">${resetUrl}</a></p>`,
//     })

//     res.status(200).json({ message: 'Email envoyé avec succès.' })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: "Erreur lors de l'envoi de l'email." })
//   }
// })

// --- RÉINITIALISATION (ÉTAPE 2 : MISE À JOUR DU MOT DE PASSE) ---
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await db.User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [db.Sequelize.Op.gt]: Date.now() }, // Vérifie si le token n'est pas expiré
      },
    })

    if (!user)
      return res.status(400).json({ message: 'Token invalide ou expiré.' })

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Mettre à jour l'utilisateur et effacer le token
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    })

    res.status(200).json({ message: 'Mot de passe modifié avec succès.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erreur lors de la réinitialisation.' })
  }
})

module.exports = router
