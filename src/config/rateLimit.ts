import rateLimit from 'express-rate-limit'

export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requêtes max par IP
  message: { erreur: { message: 'Trop de demandes. Réessayez dans 15 minutes.' } },
})