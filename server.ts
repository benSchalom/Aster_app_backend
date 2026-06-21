import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import authRoutes from './src/routes/authentification.routes.js'
import { authentifier, exigerEmailVerifie } from './src/middleware/auth.middleware.js'
import programmeRoutes from './src/routes/programme.routes.js'
import commercantRoutes from './src/routes/commercant.routes.js'
import carteRoutes from './src/routes/carte.routes.js'
import demandeRoutes from './src/routes/demande.routes.js'
import publicRoutes from './src/routes/public.routes.js'
import statistiquesRoutes from './src/routes/statistiques.routes.js'

const app = express()
const PORT = process.env.PORT || 3000
const IS_DEV = process.env.NODE_ENV !== 'production'

// Nécessaire quand le backend est derrière ngrok ou un reverse proxy (X-Forwarded-For)
app.set('trust proxy', 1)

// Sécurité : en-têtes HTTP
// En dev, on désactive contentSecurityPolicy pour ne pas bloquer les pages HTML publiques locales
app.use(helmet({ contentSecurityPolicy: IS_DEV ? false : undefined }))

// CORS : en dev on accepte tout, en prod on restreint à CORS_ORIGIN
app.use(cors({
    origin: IS_DEV ? '*' : (process.env.CORS_ORIGIN || false),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Bypass interstitiel ngrok (dev uniquement)
if (IS_DEV) {
    app.use((_req: Request, res: Response, next: NextFunction) => {
        res.setHeader('ngrok-skip-browser-warning', '1')
        next()
    })
}

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
app.use('/api/statistiques', statistiquesRoutes)

// Routes publiques (pages web pour les clients)
app.use(publicRoutes)

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
