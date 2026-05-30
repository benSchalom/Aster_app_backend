import { Router } from 'express'
import { inscription, connexion, rafraichirToken } from '../controllers/authentification.controller.js'
import { authentifier } from '../middleware/auth.middleware.js'
import { demande, confirmation } from '../controllers/verification.controller.js'

const router = Router()

//Authentification
router.post('/inscription', inscription)
router.post('/connexion', connexion)
router.post('/rafraichir', authentifier, rafraichirToken)
//Verification de l'email
router.post('/verification-email/demande', authentifier, demande)
router.post('/verification-email/confirmation', authentifier, confirmation)

export default router