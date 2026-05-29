import { Router } from 'express'
import { inscription, connexion, rafraichirToken } from '../controllers/authentification.controller.js'
import { authentifier } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/inscription', inscription)
router.post('/connexion', connexion)
router.post('/rafraichir', authentifier, rafraichirToken)

export default router