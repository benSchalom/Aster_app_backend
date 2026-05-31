import prisma from '../config/database.js'
import bcrypt from 'bcrypt'
import { envoyerEmail } from './email.service.js'

const genererCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export const demanderReinitialisation = async (email: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { email } })
    if (!commercant) return

    const code = genererCode()
    const expiration = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.commercant.update({
        where: { id: commercant.id },
        data: { otpCode: code, otpExpiration: expiration },
    })

    try {
        await envoyerEmail(
        commercant.email,
        'ASTER - Réinitialisation du mot de passe',
        `
            <div style="font-family: Arial; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B9EE8;">ASTER</h2>
            <p>Votre code de réinitialisation :</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #1E3A5C;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">Ce code expire dans 10 minutes.</p>
            <p style="color: #888; font-size: 13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            </div>
        `
        )
    } catch {
        throw { status: 500, message: 'Impossible d\'envoyer l\'email de réinitialisation du mot de passe' }
    }
}

export const confirmerReinitialisation = async (code: string, nouveauMotDePasse: string) => {
    const commercant = await prisma.commercant.findFirst({
        where: { otpCode: code, otpExpiration: { gte: new Date() } },
    })

    if (!commercant) throw { status: 422, message: 'Code de réinitialisation invalide ou expiré' }

    const hash = await bcrypt.hash(nouveauMotDePasse, 10)

    await prisma.commercant.update({
        where: { id: commercant.id },
        data: { motDePasse: hash, otpCode: null, otpExpiration: null },
    })
}