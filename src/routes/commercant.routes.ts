import { Router } from 'express'
import { authentifier, exigerEmailVerifie } from '../middleware/auth.middleware.js'
import { emailLimiter } from '../config/rateLimit.js'
import * as commercantController from '../controllers/commercant.controller.js'

const router = Router()

router.patch('/profil/mot-de-passe', authentifier, exigerEmailVerifie, commercantController.changerMotDePasse)
router.post('/profil/email/demande', authentifier, exigerEmailVerifie, emailLimiter, commercantController.demanderChangementEmail)
router.post('/profil/email/confirmation', authentifier, exigerEmailVerifie, commercantController.confirmerChangementEmail)
router.get('/profil', authentifier, exigerEmailVerifie, commercantController.consulter)
router.patch('/profil', authentifier, exigerEmailVerifie, commercantController.modifier)
router.delete('/profil', authentifier, exigerEmailVerifie, commercantController.supprimer)

export default router