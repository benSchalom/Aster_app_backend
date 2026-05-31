import { Router } from 'express'
import { authentifier } from '../middleware/auth.middleware.js'
import { exigerEmailVerifie } from '../middleware/auth.middleware.js'
import * as programmeController from '../controllers/programme.controller.js'

const router = Router()

router.post('/', authentifier, exigerEmailVerifie, programmeController.creer)
router.get('/', authentifier, exigerEmailVerifie, programmeController.lister)
router.get('/:id', authentifier, exigerEmailVerifie, programmeController.obtenir)
router.patch('/:id', authentifier, exigerEmailVerifie, programmeController.modifier)
router.delete('/:id', authentifier, exigerEmailVerifie, programmeController.supprimer)

export default router