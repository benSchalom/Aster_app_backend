import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import authRoutes from './src/routes/authentification.routes.js'
import { authentifier, exigerEmailVerifie } from './src/middleware/auth.middleware.js'
import programmeRoutes from './src/routes/programme.routes.js'
import commercantRoutes from './src/routes/commercant.routes.js'
import carteRoutes from './src/routes/carte.routes.js'
import demandeRoutes from './src/routes/demande.routes.js'
import publicRoutes from './src/routes/public.routes.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Fichiers statiques (logos)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes API (authentifiees)
app.use('/api/authentification', authRoutes)
app.use('/api/programmes', programmeRoutes)
app.use('/api/commercants', commercantRoutes)
app.use('/api/cartes', carteRoutes)
app.use('/api/demandes', demandeRoutes)

// Routes publiques (pages web pour les clients)
app.use(publicRoutes)

// Test
app.get('/ping', (req, res) => {
    res.json({ message: 'ASTER API fonctionne' })
})
app.get('/api/test-auth', authentifier, (req, res) => {
    res.json({ message: 'Authentifie', commercant: (req as any).commercant })
})
app.get('/api/test-email-verifie', authentifier, exigerEmailVerifie, (req, res) => {
    res.json({ message: 'Email verifie et authentifie' })
})

// Intercepter les erreurs de parsing JSON (corps vide ou malformé)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ erreur: { message: 'Corps de requete invalide' } })
    }
    next(err)
})

app.listen(PORT, () => {
    console.log(`Serveur demarre sur le port ${PORT}`)
})

export default app
