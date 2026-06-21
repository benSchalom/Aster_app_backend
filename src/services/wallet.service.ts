import { GoogleAuth } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import path from 'path'
import { readFileSync } from 'fs'

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// En prod : credentials dans GOOGLE_CREDENTIALS_JSON (env var Railway)
// En dev  : credentials dans google-credentials.json (gitignore)
const credentials = process.env.GOOGLE_CREDENTIALS_JSON
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    : JSON.parse(readFileSync(path.resolve(process.cwd(), 'google-credentials.json'), 'utf-8'))

const TYPE_LABELS: Record<string, string> = {
    points: 'Carte a points',
    gratuite: 'Carte a tampons',
    abonnement_seances: 'Abonnement seances',
    abonnement_temps: 'Abonnement duree',
}

/**
 * Construit le label d'etat visible sur la carte wallet
 */
const labelEtat = (type: string, valeur: number, etat: string): string => {
    switch (type) {
        case 'points':
            return `${etat} pt${parseInt(etat) !== 1 ? 's' : ''}`
        case 'gratuite':
            return `${etat} / ${valeur}`
        case 'abonnement_seances':
            return etat === '0' ? 'En attente' : `${etat} seance${parseInt(etat) !== 1 ? 's' : ''}`
        case 'abonnement_temps':
            if (etat === 'inactif') return 'En attente'
            const exp = new Date(etat)
            if (exp < new Date()) return 'Expire'
            return `Jusqu\'au ${exp.toLocaleDateString('fr-FR')}`
        default:
            return etat
    }
}

/**
 * Genere le lien d'ajout a Google Wallet pour une carte
 */
export const genererLienWallet = async (carte: {
    id: string
    numeroSerie: string
    clientNom: string
    etat: string
    programme: {
        id: string
        nom: string
        type: string
        valeur: number
    }
    commercant: {
        nomCommerce: string
        logo: string | null
    }
}): Promise<string> => {
    const classId = `${ISSUER_ID}.prog_${carte.programme.id.replace(/-/g, '_')}`
    const objectId = `${ISSUER_ID}.carte_${carte.id.replace(/-/g, '_')}`

    // Logo : seulement si le commerçant en a un (Google rejette les URLs inaccessibles)
    const logoUri = carte.commercant.logo
        ? `${BASE_URL}/uploads/${carte.commercant.logo.replace(/^\/?(uploads\/)?/, '')}`
        : null

    const programLogo = logoUri ? {
        sourceUri: { uri: logoUri },
        contentDescription: {
            defaultValue: { language: 'fr', value: `Logo ${carte.commercant.nomCommerce}` },
        },
    } : undefined

    // Classe de fidelite — represente le programme
    const loyaltyClass: Record<string, any> = {
        id: classId,
        issuerName: carte.commercant.nomCommerce,
        programName: carte.programme.nom,
        reviewStatus: 'UNDER_REVIEW',
        hexBackgroundColor: '#000000',
        countryCode: 'CA',
    }
    if (programLogo) loyaltyClass.programLogo = programLogo

    // Objet de fidelite — represente la carte du client
    const loyaltyObject = {
        id: objectId,
        classId,
        state: 'ACTIVE',
        accountName: carte.clientNom,
        accountId: carte.numeroSerie,
        loyaltyPoints: {
            balance: {
                string: labelEtat(carte.programme.type, carte.programme.valeur, carte.etat),
            },
            label: TYPE_LABELS[carte.programme.type] || 'Fidelite',
        },
        barcode: {
            type: 'QR_CODE',
            value: carte.numeroSerie,
            alternateText: carte.numeroSerie,
        },
    }

    // Signer le JWT avec la cle de service Google
    const payload = {
        iss: credentials.client_email,
        aud: 'google',
        origins: [BASE_URL],
        typ: 'savetowallet',
        payload: {
            loyaltyClasses: [loyaltyClass],
            loyaltyObjects: [loyaltyObject],
        },
    }

    const token = jwt.sign(payload, credentials.private_key, { algorithm: 'RS256' })
    return `https://pay.google.com/gp/v/save/${token}`
}

/**
 * Met à jour la carte Google Wallet après un scan (points, tampons, séances).
 * Utilise l'API REST Google Wallet avec le compte de service.
 * Ne doit jamais bloquer la transaction principale — appeler en fire-and-forget.
 */
export const mettreAJourWallet = async (carte: {
    id: string
    etat: string
    programme: { type: string; valeur: number }
}): Promise<void> => {
    const objectId = `${ISSUER_ID}.carte_${carte.id.replace(/-/g, '_')}`

    // Authentification via le compte de service Google (credentials déjà chargés)
    const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    })
    const client = await auth.getClient()

    // Seul le solde est mis à jour — on ne touche pas aux autres champs
    const patch = {
        loyaltyPoints: {
            balance: {
                string: labelEtat(carte.programme.type, carte.programme.valeur, carte.etat),
            },
        },
    }

    await (client as any).request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(objectId)}`,
        method: 'PATCH',
        data: patch,
    })
}
