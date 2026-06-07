import prisma from '../config/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { envoyerOTP } from './email.service.js'

const JWT_SECRET = process.env.JWT_SECRET!

/**
 * Generer un code aleatoire
 * @returns 
 */
const genererCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Consulter les infos d'un commercant
 * @param id 
 * @returns 
 */
export const consulterProfil = async (id: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id } })
    if (!commercant) throw { status: 404, message: 'Compte commercant introuvable' }

    return {
        id: commercant.id,
        nomCommerce: commercant.nomCommerce,
        email: commercant.email,
        telephone: commercant.telephone,
        adresse: commercant.adresse,
        emailVerifie: commercant.emailVerifie,
        logo: commercant.logo,
    }
}

/**
 * Modifier un profil commercant
 * @param id 
 * @param data 
 * @returns 
 */
export const modifierProfil = async (id: string, data: {
    nomCommerce?: string
    telephone?: string
    adresse?: string
}) => {
    const commercant = await prisma.commercant.update({
        where: { id },
        data,
    })

    return {
        id: commercant.id,
        nomCommerce: commercant.nomCommerce,
        email: commercant.email,
        telephone: commercant.telephone,
        adresse: commercant.adresse,
        logo: commercant.logo,
    }
}

/**
 * Changer le mot de passe d'un compte commercant
 * @param id 
 * @param ancienMotDePasse 
 * @param nouveauMotDePasse 
 */
export const changerMotDePasse = async (id: string, ancienMotDePasse: string, nouveauMotDePasse: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id } })
    if (!commercant) throw { status: 404, message: 'Compte commercant introuvable' }

    const valide = await bcrypt.compare(ancienMotDePasse, commercant.motDePasse)
    if (!valide) throw { status: 401, message: 'Ancien mot de passe incorrect' }

    const hash = await bcrypt.hash(nouveauMotDePasse, 10)
    const updated = await prisma.commercant.update({ where: { id }, data: { motDePasse: hash, tokenVersion: { increment: 1 } } })

    // Générer un nouveau token avec le tokenVersion à jour
    const token = jwt.sign(
        { id: updated.id, tokenVersion: updated.tokenVersion },
        JWT_SECRET,
        { expiresIn: '7d' }
    )
    return { token }
}

/**
 * Demande de changement d'adresse email
 * @param id 
 * @param nouvelEmail 
 * @param motDePasse 
 */
export const demanderChangementEmail = async (id: string, nouvelEmail: string, motDePasse: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id } })
    if (!commercant) throw { status: 404, message: 'Commerçant introuvable' }

    const valide = await bcrypt.compare(motDePasse, commercant.motDePasse)
    if (!valide) throw { status: 401, message: 'Mot de passe incorrect' }

    const emailExiste = await prisma.commercant.findUnique({ where: { email: nouvelEmail } })
    if (emailExiste) throw { status: 409, message: 'Email déjà utilisé' }

    const code = genererCode()
    const expiration = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.commercant.update({
        where: { id },
        data: { otpCode: code, otpExpiration: expiration, nouvelEmail },
    })

    try {
        await envoyerOTP(nouvelEmail, code)
    } catch {
        throw { status: 500, message: "Impossible d'envoyer l'email" }
    }
}

/**
 * Confirmer le changement d'email
 * @param id 
 * @param code 
 * @returns 
 */
export const confirmerChangementEmail = async (id: string, code: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id } })
    if (!commercant) throw { status: 404, message: 'Commerçant introuvable' }
    if (!commercant.otpCode || !commercant.otpExpiration|| !commercant.nouvelEmail) throw { status: 422, message: 'Aucun code demandé' }
    if (commercant.otpExpiration < new Date()) throw { status: 422, message: 'Code expiré' }
    if (commercant.otpCode !== code) throw { status: 422, message: 'Code invalide' }

    const updated = await prisma.commercant.update({
        where: { id },
        data: {
            email: commercant.nouvelEmail,
            otpCode: null,
            otpExpiration: null,
            nouvelEmail: null,
        },
    })

    return { email: updated.email }
}

/**
 * Supprimer un compte commercant
 * @param id 
 * @param motDePasse 
 */
export const supprimerCompte = async (id: string, motDePasse: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id } })
    if (!commercant) throw { status: 404, message: 'Commerçant introuvable' }

    const valide = await bcrypt.compare(motDePasse, commercant.motDePasse)
    if (!valide) throw { status: 401, message: 'Mot de passe incorrect' }

    await prisma.archive.create({
        data: {
            commercantId: id,
            email: commercant.email,
            nomCommerce: commercant.nomCommerce,
            dateSuppression: new Date(),
            motif: 'Demande du commerçant',
        },
    })

    await prisma.commercant.update({
        where: { id },
        data: {
            nomCommerce: 'Compte supprimé',
            email: `supprime_${id}@aster.local`,
            motDePasse: '',
            telephone: null,
            adresse: null,
            logo: null,
            emailVerifie: false,
            otpCode: null,
            otpExpiration: null,
            nouvelEmail: null,
            tokenVersion: { increment: 1 },
        },
    })
}