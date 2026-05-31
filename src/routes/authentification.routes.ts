import { Router } from 'express'
import { inscription, connexion, rafraichirToken } from '../controllers/authentification.controller.js'
import { authentifier } from '../middleware/auth.middleware.js'
import { demande, confirmation } from '../controllers/verification.controller.js'
import { demande as mdpDemande, confirmation as mdpConfirmation } from '../controllers/motdepasse.controller.js'
import { emailLimiter } from '../config/rateLimit.js'

const router = Router()

//Authentification
router.post('/inscription', inscription)
router.post('/connexion', connexion)
router.post('/rafraichir', authentifier, rafraichirToken)
//Verification de l'email
router.post('/verification-email/demande', authentifier, emailLimiter, demande)
router.post('/verification-email/confirmation', authentifier, confirmation)
//Reinitisalisation du mot de passe
router.post('/mot-de-passe/demande', emailLimiter, mdpDemande)
router.post('/mot-de-passe/confirmation', mdpConfirmation)

export default router