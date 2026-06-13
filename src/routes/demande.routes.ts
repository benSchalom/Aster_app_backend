import { Router } from 'express'
import { authentifier, exigerEmailVerifie } from '../middleware/auth.middleware.js'
import * as demandeController from '../controllers/demande.controller.js'

const router = Router()

router.get('/', authentifier, exigerEmailVerifie, demandeController.lister)
router.post('/:id/confirmer', authentifier, exigerEmailVerifie, demandeController.confirmer)
router.post('/:id/refuser', authentifier, exigerEmailVerifie, demandeController.refuser)

export default router
