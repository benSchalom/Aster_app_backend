import { Router } from 'express'
import * as publicController from '../controllers/public.controller.js'

const router = Router()

// Formulaire d'enrollment (client scanne le QR du programme)
router.get('/p/:programmeId', publicController.formulaireEnrollment)
router.post('/p/:programmeId', publicController.traiterEnrollment)

// Page de la carte (client accede apres enrollment)
router.get('/carte/:carteId', publicController.pageCarte)

// Polling statut demande (utilise par la page d'attente)
router.get('/api/public/demande/:demandeId/statut', publicController.statutDemande)

export default router
