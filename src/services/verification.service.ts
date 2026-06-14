// src/services/verification.service.ts
import prisma from '../config/database.js'
import jwt from 'jsonwebtoken'
import { envoyerOTP } from './email.service.js'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d'

/**
 * Generer le code de vérification
 * @returns 
 */
const genererCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Demander un code de verification de l'adresse Email
 * @param commercantId 
 */
export const demanderVerification = async (commercantId: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id: commercantId } })
    if (!commercant) throw { status: 404, message: 'Compte commerçant introuvable' }
    if (commercant.emailVerifie) throw { status: 409, message: 'Email déjà vérifié' }

    const code = genererCode()
    const expiration = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes (temps d'expiration)

    await prisma.commercant.update({
        where: { id: commercantId },
        data: { otpCode: code, otpExpiration: expiration },
    })

    try {
        await envoyerOTP(commercant.email, code)
    } catch {
        throw { status: 500, message: 'Impossible d\'envoyer l\'email. Vérifiez votre adresse.' }
    }
}

/**
 * Confirmer la verificatin de l'adresse Email
 * @param commercantId 
 * @param code 
 * @returns 
 */
export const confirmerVerification = async (commercantId: string, code: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id: commercantId } })
    if (!commercant) throw { status: 404, message: 'Compte commerçant introuvable' }
    if (commercant.emailVerifie) throw { status: 409, message: 'Email déjà vérifié' }
    if (!commercant.otpCode || !commercant.otpExpiration) throw { status: 422, message: 'Aucun code de vérification n\'a été demandé' }
    if (commercant.otpExpiration < new Date()) throw { status: 422, message: 'Code de vérification expiré' }
    if (commercant.otpCode !== code) throw { status: 422, message: 'Code invalide' }

    await prisma.commercant.update({
        where: { id: commercantId },
        data: { emailVerifie: true, otpCode: null, otpExpiration: null },
    })

    const token = jwt.sign(
        { id: commercant.id, email: commercant.email, emailVerifie: commercant.emailVerifie, tokenVersion: commercant.tokenVersion },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    )

    return { 
        token,
        commercant: {
            id: commercant.id,
            nomCommerce: commercant.nomCommerce,
            email: commercant.email,
            emailVerifie: true,
            logo: commercant.logo,
        },
    }
}