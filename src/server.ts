import 'dotenv/config'
import express from 'express'
import authRoutes from './routes/authentification.routes.js'
import { authentifier, exigerEmailVerifie } from './middleware/auth.middleware.js'

const app = express()
const PORT = process.env.PORT || 3000

//Middleware
app.use(express.json())

//Routes
app.use('/api/authentification', authRoutes)

//Test=========
app.get('/ping', (req, res) => {
  res.json({ message: 'ASTER API fonctionne' })
})
app.get('/api/test-auth', authentifier, (req, res) => {
  res.json({ message: 'Authentifié', commercant: (req as any).commercant })
})
app.get('/api/test-email-verifie', authentifier, exigerEmailVerifie, (req, res) => {
  res.json({ message: 'Email vérifié et authentifié' })
})
// ========

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`)
})

export default app