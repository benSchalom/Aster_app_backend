import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRATION = '7d'

/**
 * Inscription d'un commercant
 * 1. Verifie l'unicite de l'adresse courriel
 * 2. hash le mot de passe
 * 3. creer le commercant
 * 4. creer le token expiration après 7 jours
 * @param data {nom du commerce, email, motdepasse, telephone?}
 * @returns le token, les infos sur le commercant (id, nom, email, emailVerifie)
 */
export const inscrire = async (data: {
    nomCommerce: string
    email: string
    motDePasse: string
    telephone?: string
    adresse?: string
}) => {
    const existe = await prisma.commercant.findUnique({ where: { email: data.email } })
    if (existe) {
        throw { status: 409, message: 'Cet email est indisponible' }
    }

    const hash = await bcrypt.hash(data.motDePasse, 10)

    const commercant = await prisma.commercant.create({
        data: {
            nomCommerce: data.nomCommerce,
            email: data.email,
            motDePasse: hash,
            telephone: data.telephone,
            adresse: data.adresse,
        },
    })

    const token = jwt.sign(
        { id: commercant.id, email: commercant.email, emailVerifie: commercant.emailVerifie },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    )

    return {
        token,
        commercant: {
            id: commercant.id,
            nomCommerce: commercant.nomCommerce,
            email: commercant.email,
            emailVerifie: commercant.emailVerifie,
        },
    }
}

/**
 * Connexion du commercant
 * 1. Cherche le commercant avec son email
 * 2. verifie le mot de passe
 * 3. Creer le token
 * @param data {email, mot de passe}
 * @returns le token, les infos sur le commercant (id, nom, email, emailVerifie)
 */
export const connecter = async (data: { email: string; motDePasse: string }) => {
    const commercant = await prisma.commercant.findUnique({ where: { email: data.email } })
    if (!commercant) {
        throw { status: 401, message: 'Identifiants incorrects' }
    }

    const valide = await bcrypt.compare(data.motDePasse, commercant.motDePasse)
    if (!valide) {
        throw { status: 401, message: 'Identifiants incorrects' }
    }

    const token = jwt.sign(
        { id: commercant.id, email: commercant.email, emailVerifie: commercant.emailVerifie },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    )

    return {
        token,
        commercant: {
            id: commercant.id,
            nomCommerce: commercant.nomCommerce,
            email: commercant.email,
            emailVerifie: commercant.emailVerifie,
        },
    }
}

/**
 * Rafraichir le token des commercants
 * 1. Cherche le commercant avec son email
 * 2. Genere un nouveau token
 * @param commercantId
 * @returns le token
 */
export const rafraichir = async (commercantId: string) => {
    const commercant = await prisma.commercant.findUnique({ where: { id: commercantId } })
    if (!commercant) {
        throw { status: 401, message: 'Compte commerçant introuvable' }
    }

    const token = jwt.sign(
        { id: commercant.id, email: commercant.email, emailVerifie: commercant.emailVerifie },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    )

    return { token }
}