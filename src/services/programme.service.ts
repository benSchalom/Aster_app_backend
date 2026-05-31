import prisma from '../config/database.js'

/**
 * Creation d'un programme de fidélité
 * @param commercantId 
 * @param data 
 * @returns 
 */
export const creer = async (commercantId: string, data: {
    nom: string
    type: string
    valeur: number
    recompense: string
}) => {
    return prisma.programme.create({
        data: {
            commercantId,
            nom: data.nom,
            type: data.type as any,
            valeur: data.valeur,
            recompense: data.recompense,
        },
    })
}

/**
 * Liste des programmes de fidélité créer
 * @param commercantId 
 * @param inclureInactifs 
 * @returns 
 */
export const lister = async (commercantId: string, inclureInactifs: boolean = false) => {
    return prisma.programme.findMany({
        where: {
        commercantId,
        ...(inclureInactifs ? {} : { actif: true }),
        },
        orderBy: { creeLe: 'desc' },
    })
}

/**
 * Obtenir des informations sur un programme en particulier
 * @param commercantId 
 * @param id 
 * @returns 
 */
export const obtenir = async (commercantId: string, id: string) => {
    const programme = await prisma.programme.findFirst({
        where: { id, commercantId },
    })
    if (!programme) throw { status: 404, message: 'Programme introuvable' }

    const nbCartes = await prisma.carte.count({
        where: { programmeId: id, actif: true },
    })

    return { ...programme, nbCartes }
}

/**
 * Modifier un programme
 * @param commercantId 
 * @param id 
 * @param data 
 * @returns 
 */
export const modifier = async (commercantId: string, id: string, data: {
    nom?: string
    valeur?: number
    recompense?: string
}) => {
    const programme = await prisma.programme.findFirst({
        where: { id, commercantId },
    })
    if (!programme) throw { status: 404, message: 'Programme introuvable' }

    // Vérifier si la valeur est gelée (cartes actives existent)
    if (data.valeur !== undefined && data.valeur !== programme.valeur) {
        const cartesActives = await prisma.carte.count({
            where: { programmeId: id, actif: true },
        })
        if (cartesActives > 0) {
            throw { status: 409, message: 'Impossible de modifier la valeur : des cartes actives existent sur ce programme' }
        }
    }

    return prisma.programme.update({
        where: { id },
        data,
    })
}

/**
 * Supprimer un programme 
 * @param commercantId 
 * @param id 
 * @returns 
 */
export const supprimer = async (commercantId: string, id: string) => {
    const programme = await prisma.programme.findFirst({
        where: { id, commercantId },
    })
    if (!programme) throw { status: 404, message: 'Programme introuvable' }

    return prisma.programme.update({
        where: { id },
        data: { actif: false },
    })
}