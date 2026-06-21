import { Router } from 'express'
import { authentifier, exigerEmailVerifie } from '../middleware/auth.middleware.js'
import * as carteController from '../controllers/carte.controller.js'
import * as transactionController from '../controllers/transaction.controller.js'

const router = Router()

// Routes cartes
router.post('/', authentifier, exigerEmailVerifie, carteController.creer)
router.get('/', authentifier, exigerEmailVerifie, carteController.lister)
router.get('/scan/:numeroSerie', authentifier, exigerEmailVerifie, carteController.trouverParNumeroSerie)
router.get('/:id', authentifier, exigerEmailVerifie, carteController.obtenir)
router.get('/:id/wallet/google', authentifier, exigerEmailVerifie, carteController.obtenirLienWallet)
router.delete('/:id', authentifier, exigerEmailVerifie, carteController.supprimer)

// Routes transactions
router.post('/:carteId/transactions', authentifier, exigerEmailVerifie, transactionController.enregistrer)
router.get('/:carteId/transactions', authentifier, exigerEmailVerifie, transactionController.lister)

export default router
