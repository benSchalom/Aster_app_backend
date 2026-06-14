import prisma from '../config/database.js'

/**
 * Indicateurs globaux pour le tableau de bord
 */
export const resume = async (commercantId: string) => {
    const [cartesActives, nbProgrammes, demandesEnAttente] = await Promise.all([
        prisma.carte.findMany({
            where: { commercantId, actif: true },
            select: { clientTelephone: true, programme: { select: { type: true } } },
        }),
        prisma.programme.count({ where: { commercantId, actif: true } }),
        prisma.demande.count({
            where: { programme: { commercantId }, statut: 'en_attente' },
        }),
    ])

    const nbCartesActives = cartesActives.length
    const nbClients = new Set(cartesActives.map(c => c.clientTelephone)).size

    const cartesParType: Record<string, number> = {}
    cartesActives.forEach(c => {
        const type = c.programme.type
        cartesParType[type] = (cartesParType[type] || 0) + 1
    })

    return { nbClients, nbCartesActives, nbProgrammes, demandesEnAttente, cartesParType }
}

/**
 * Activite transactionnelle jour par jour sur une periode
 */
export const activite = async (
    commercantId: string,
    debut: Date,
    fin: Date
) => {
    const transactions = await prisma.transaction.findMany({
        where: {
            date: { gte: debut, lte: fin },
            carte: { commercantId },
        },
        select: { type: true, date: true },
        orderBy: { date: 'asc' },
    })

    // Construire un index vide pour chaque jour de la periode
    const parJour: Record<string, { date: string; nbGains: number; nbConsommations: number; nbRecompenses: number }> = {}

    const curseur = new Date(debut)
    curseur.setHours(0, 0, 0, 0)
    const limite = new Date(fin)
    limite.setHours(23, 59, 59, 999)

    while (curseur <= limite) {
        const cle = curseur.toISOString().split('T')[0]
        parJour[cle] = { date: cle, nbGains: 0, nbConsommations: 0, nbRecompenses: 0 }
        curseur.setDate(curseur.getDate() + 1)
    }

    transactions.forEach(t => {
        const cle = t.date.toISOString().split('T')[0]
        if (!parJour[cle]) return
        if (t.type === 'gain') parJour[cle].nbGains++
        else if (t.type === 'consommation') parJour[cle].nbConsommations++
        else if (t.type === 'recompense') parJour[cle].nbRecompenses++
    })

    return Object.values(parJour)
}

/**
 * Nouveaux clients (cartes creees) sur une periode, avec comparaison periode precedente
 */
export const nouveauxClients = async (
    commercantId: string,
    debut: Date,
    fin: Date
) => {
    const dureeMs = fin.getTime() - debut.getTime()
    const debutPrecedent = new Date(debut.getTime() - dureeMs)
    const finPrecedent = new Date(debut.getTime() - 1)

    const [periode, precedente] = await Promise.all([
        prisma.carte.count({
            where: { commercantId, actif: true, creeLe: { gte: debut, lte: fin } },
        }),
        prisma.carte.count({
            where: { commercantId, actif: true, creeLe: { gte: debutPrecedent, lte: finPrecedent } },
        }),
    ])

    const delta = precedente > 0 ? Math.round(((periode - precedente) / precedente) * 100) : null

    return { periode, precedente, delta }
}

/**
 * Transactions regroupees par jour de la semaine sur une periode
 */
export const joursActifs = async (
    commercantId: string,
    debut: Date,
    fin: Date
) => {
    const transactions = await prisma.transaction.findMany({
        where: {
            date: { gte: debut, lte: fin },
            carte: { commercantId },
        },
        select: { date: true },
    })

    // 0 = Dimanche, 1 = Lundi … 6 = Samedi
    const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const comptes = Array(7).fill(0)

    transactions.forEach(t => {
        comptes[t.date.getDay()]++
    })

    // Retourner dans l'ordre Lun → Dim (plus naturel pour un commerce)
    const ordre = [1, 2, 3, 4, 5, 6, 0]
    return ordre.map(i => ({ jour: JOURS[i], nb: comptes[i] }))
}

/**
 * Classement des programmes par nombre de cartes actives
 */
export const classementProgrammes = async (commercantId: string) => {
    const programmes = await prisma.programme.findMany({
        where: { commercantId, actif: true },
        select: {
            id: true,
            nom: true,
            type: true,
            _count: { select: { cartes: { where: { actif: true } } } },
        },
        orderBy: { cartes: { _count: 'desc' } },
        take: 5,
    })

    return programmes.map(p => ({
        id: p.id,
        nom: p.nom,
        type: p.type,
        nbCartes: p._count.cartes,
    }))
}
