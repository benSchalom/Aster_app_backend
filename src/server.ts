import 'dotenv/config'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

//Middleware
app.use(express.json())

app.get('/ping', (req, res) => {
  res.json({ message: 'ASTER API fonctionne' })
})

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`)
})

export default app