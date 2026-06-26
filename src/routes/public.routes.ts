import { Router } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import * as publicController from '../controllers/public.controller.js'

const router = Router()

// Page légale publique
router.get('/legal', (_req, res) => {
    const html = readFileSync(path.resolve(process.cwd(), 'src/views/legal.html'), 'utf-8')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
})

// Formulaire d'enrollment (client scanne le QR du programme)
router.get('/p/:programmeId', publicController.formulaireEnrollment)
router.post('/p/:programmeId', publicController.traiterEnrollment)

// Page de la carte (client accede apres enrollment)
router.get('/carte/:carteId', publicController.pageCarte)

// Polling statut demande (utilise par la page d'attente)
router.get('/api/public/demande/:demandeId/statut', publicController.statutDemande)

// Lien Google Wallet (public, appele depuis la page carte du client)
router.get('/api/public/cartes/:carteId/wallet/google', publicController.lienWalletGoogle)

// Pass Apple Wallet (public, telechargement du .pkpass)
router.get('/api/public/cartes/:carteId/wallet/apple', publicController.passWalletApple)

export default router
