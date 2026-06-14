import prisma from '../config/database.js'
import { genererNumeroSerie } from '../utils/numeroSerie.utils.js'

/**
 * Calcule l'etat initial d'une carte selon le type du programme
 */
const etatInitial = (programme: { type: string; valeur: number }): string => {
    switch (programme.type) {
        case 'points':      return '0'
        case 'gratuite':    return '0'
        case 'abonnement_seances': return programme.valeur.toString()
        case 'abonnement_temps':   return 'inactif'
        default:            return '0'
    }
}

/**
 * Creer une nouvelle carte de fidelite pour un client
 */
export const creer = async (
    commercantId: string,
    data: { programmeId: string; clientNom: string; clientTelephone: string }
) => {
    const programme = await prisma.programme.findFirst({
        where: { id: data.programmeId, commercantId, actif: true },
    })
    if (!programme) throw { status: 404, message: 'Programme introuvable ou inactif' }

    // Verifier si ce client a deja une carte active sur ce programme
    const carteExistante = await prisma.carte.findFirst({
        where: {
            programmeId: data.programmeId,
            clientTelephone: data.clientTelephone,
            actif: true,
        },
    })
    if (carteExistante) {
        throw { status: 409, message: 'Ce client possede deja une carte active sur ce programme' }
    }

    // Generer un numero de serie unique (retry en cas de collision)
    let numeroSerie: string
    let tentatives = 0
    do {
        numeroSerie = genererNumeroSerie(programme.id)
        tentatives++
        if (tentatives > 10) throw { status: 500, message: 'Impossible de generer un numero de serie unique' }
    } while (await prisma.carte.findUnique({ where: { numeroSerie } }))

    return prisma.carte.create({
        data: {
            numeroSerie,
            programmeId: data.programmeId,
            commercantId,
            clientNom: data.clientNom,
            clientTelephone: data.clientTelephone,
            etat: etatInitial(programme),
        },
        include: { programme: true },
    })
}

/**
 * Lister les cartes du commercant avec filtres optionnels
 */
export const lister = async (
    commercantId: string,
    filtres: { recherche?: string; programmeId?: string }
) => {
    return prisma.carte.findMany({
        where: {
            commercantId,
            actif: true,
            ...(filtres.recherche && {
                OR: [
                    { clientNom: { contains: filtres.recherche, mode: 'insensitive' } },
                    { clientTelephone: { contains: filtres.recherche } },
                    { numeroSerie: { contains: filtres.recherche, mode: 'insensitive' } },
                ],
            }),
            ...(filtres.programmeId && {
                programmeId: filtres.programmeId,
            }),
        },
        include: { programme: { select: { nom: true, type: true, valeur: true } } },
        orderBy: { creeLe: 'desc' },
    })
}

/**
 * Obtenir le detail d'une carte par son ID
 */
export const obtenir = async (commercantId: string, id: string) => {
    const carte = await prisma.carte.findFirst({
        where: { id, commercantId },
        include: {
            programme: true,
            transactions: { orderBy: { date: 'desc' }, take: 20 },
        },
    })
    if (!carte) throw { status: 404, message: 'Carte introuvable' }
    return carte
}

/**
 * Trouver une carte par son numero de serie (pour le scan QR)
 */
export const trouverParNumeroSerie = async (commercantId: string, numeroSerie: string) => {
    const carte = await prisma.carte.findFirst({
        where: { numeroSerie, commercantId, actif: true },
        include: {
            programme: true,
            transactions: { orderBy: { date: 'desc' }, take: 5 },
        },
    })
    if (!carte) throw { status: 404, message: 'Carte introuvable ou inactive' }
    return carte
}

/**
 * Desactiver une carte (soft delete)
 */
export const supprimer = async (commercantId: string, id: string) => {
    const carte = await prisma.carte.findFirst({
        where: { id, commercantId },
    })
    if (!carte) throw { status: 404, message: 'Carte introuvable' }

    return prisma.carte.update({
        where: { id },
        data: { actif: false },
    })
}
