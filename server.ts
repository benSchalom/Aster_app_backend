import 'dotenv/config'
import express from 'express'
import path from 'path'
import authRoutes from './src/routes/authentification.routes.js'
import { authentifier, exigerEmailVerifie } from './src/middleware/auth.middleware.js'
import programmeRoutes from './src/routes/programme.routes.js'
import commercantRoutes from './src/routes/commercant.routes.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Fichiers statiques (logos)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes
app.use('/api/authentification', authRoutes)
app.use('/api/programmes', programmeRoutes)
app.use('/api/commercants', commercantRoutes)

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

app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`)
})

export default app
