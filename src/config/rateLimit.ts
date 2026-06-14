import rateLimit from 'express-rate-limit'

// Routes d'envoi d'email (OTP, réinitialisation) : 5 tentatives / 15 min
export const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { erreur: { message: 'Trop de demandes. Réessayez dans 15 minutes.' } },
})

// Routes de connexion / inscription : 10 tentatives / 15 min par IP
// Valeur plus permissive pour ne pas bloquer les tests en dev
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    message: { erreur: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' } },
    skipSuccessfulRequests: true, // ne compte que les echecs
})