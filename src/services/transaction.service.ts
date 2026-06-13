import prisma from '../config/database.js'

/**
 * Calcule le nouvel etat apres une transaction
 * Utilise programme.pas pour les increments (gain)
 */
const calculerNouvelEtat = (
    programme: { type: string; valeur: number; pas: number },
    etatActuel: string,
    typeTransaction: string,
    montant?: number
): string => {
    switch (programme.type) {
        case 'points': {
            const solde = parseInt(etatActuel) || 0
            if (typeTransaction === 'gain') {
                return String(solde + programme.pas)
            }
            if (typeTransaction === 'consommation' || typeTransaction === 'recompense') {
                const deduction = montant ?? programme.pas
                return String(Math.max(0, solde - deduction))
            }
            return etatActuel
        }

        case 'gratuite': {
            const tampons = parseInt(etatActuel) || 0
            if (typeTransaction === 'gain') {
                // Plafonner au seuil — ne jamais depasser valeur
                return String(Math.min(tampons + programme.pas, programme.valeur))
            }
            if (typeTransaction === 'recompense') {
                return '0'
            }
            return etatActuel
        }

        case 'abonnement_seances': {
            const seances = parseInt(etatActuel) || 0
            if (typeTransaction === 'gain') {
                return String(programme.valeur)
            }
            if (typeTransaction === 'consommation') {
                return String(Math.max(0, seances - 1))
            }
            return etatActuel
        }

        case 'abonnement_temps': {
            if (typeTransaction === 'gain') {
                const expiration = new Date()
                expiration.setDate(expiration.getDate() + programme.valeur)
                return expiration.toISOString()
            }
            if (typeTransaction === 'consommation') {
                if (etatActuel === 'inactif') throw { status: 400, message: 'Abonnement inactif' }
                if (new Date(etatActuel) < new Date()) throw { status: 400, message: 'Abonnement expire' }
                return etatActuel
            }
            return etatActuel
        }

        default:
            return etatActuel
    }
}

const validerTransaction = (
    programme: { type: string; valeur: number; pas: number },
    etatActuel: string,
    typeTransaction: string,
    montant?: number
) => {
    if (programme.type === 'abonnement_seances' && typeTransaction === 'consommation') {
        if ((parseInt(etatActuel) || 0) <= 0) throw { status: 400, message: 'Aucune seance disponible' }
    }

    if (programme.type === 'points') {
        if (typeTransaction === 'consommation' || typeTransaction === 'recompense') {
            const solde = parseInt(etatActuel) || 0
            const deduction = montant ?? programme.pas
            if (solde < deduction) {
                throw { status: 400, message: `Solde insuffisant (${solde} points disponibles)` }
            }
        }
    }

    if (programme.type === 'gratuite') {
        const tampons = parseInt(etatActuel) || 0
        if (typeTransaction === 'gain' && tampons >= programme.valeur) {
            throw { status: 400, message: `Seuil atteint (${tampons}/${programme.valeur}) — accordez la recompense avant d'ajouter un tampon` }
        }
        if (typeTransaction === 'recompense' && tampons < programme.valeur) {
            throw { status: 400, message: `Pas encore assez de tampons (${tampons}/${programme.valeur})` }
        }
    }
}

export const enregistrer = async (
    commercantId: string,
    carteId: string,
    data: { type: string; montant?: number }
) => {
    const carte = await prisma.carte.findFirst({
        where: { id: carteId, commercantId, actif: true },
        include: { programme: true },
    })
    if (!carte) throw { status: 404, message: 'Carte introuvable ou inactive' }

    validerTransaction(carte.programme, carte.etat, data.type, data.montant)

    const nouvelEtat = calculerNouvelEtat(
        carte.programme,
        carte.etat,
        data.type,
        data.montant
    )

    const [transaction] = await prisma.$transaction([
        prisma.transaction.create({
            data: { carteId, type: data.type as any, montant: data.montant },
        }),
        prisma.carte.update({
            where: { id: carteId },
            data: { etat: nouvelEtat },
        }),
    ])

    return { transaction, nouvelEtat }
}

export const lister = async (commercantId: string, carteId: string, limite: number = 50) => {
    const carte = await prisma.carte.findFirst({ where: { id: carteId, commercantId } })
    if (!carte) throw { status: 404, message: 'Carte introuvable' }

    return prisma.transaction.findMany({
        where: { carteId },
        orderBy: { date: 'desc' },
        take: limite,
    })
}
