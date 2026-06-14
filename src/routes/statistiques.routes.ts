import { Router } from 'express'
import { authentifier, exigerEmailVerifie } from '../middleware/auth.middleware.js'
import { obtenirResume, obtenirActivite, obtenirClassement, obtenirNouveauxClients, obtenirJoursActifs } from '../controllers/statistiques.controller.js'

const router = Router()

router.use(authentifier, exigerEmailVerifie)

router.get('/resume', obtenirResume)
router.get('/activite', obtenirActivite)
router.get('/classement', obtenirClassement)
router.get('/nouveaux-clients', obtenirNouveauxClients)
router.get('/jours-actifs', obtenirJoursActifs)

export default router
