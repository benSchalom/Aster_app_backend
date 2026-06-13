import prisma from '../config/database.js'

export const creer = async (commercantId: string, data: {
    nom: string
    type: string
    valeur?: number
    pas?: number
    recompense?: string
}) => {
    return prisma.programme.create({
        data: {
            commercantId,
            nom: data.nom,
            type: data.type as any,
            valeur: data.type === 'points' ? 0 : (data.valeur ?? 0),
            pas: data.pas ?? 1,
            recompense: data.recompense ?? null,
        },
    })
}

export const lister = async (commercantId: string, inclureInactifs: boolean = false) => {
    return prisma.programme.findMany({
        where: {
            commercantId,
            ...(inclureInactifs ? {} : { actif: true }),
        },
        orderBy: { creeLe: 'desc' },
    })
}

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

export const modifier = async (commercantId: string, id: string, data: {
    nom?: string
    valeur?: number
    pas?: number
    recompense?: string | null
}) => {
    const programme = await prisma.programme.findFirst({
        where: { id, commercantId },
    })
    if (!programme) throw { status: 404, message: 'Programme introuvable' }

    // valeur : bloque si cartes actives
    if (data.valeur !== undefined && data.valeur !== programme.valeur) {
        const cartesActives = await prisma.carte.count({
            where: { programmeId: id, actif: true },
        })
        if (cartesActives > 0) {
            throw { status: 409, message: 'Impossible de modifier la valeur : des cartes actives existent sur ce programme' }
        }
    }

    // pas : libre, aucune restriction
    return prisma.programme.update({
        where: { id },
        data: {
            ...(data.nom !== undefined && { nom: data.nom }),
            ...(data.valeur !== undefined && { valeur: data.valeur }),
            ...(data.pas !== undefined && { pas: data.pas }),
            ...(data.recompense !== undefined && { recompense: data.recompense }),
        },
    })
}

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
