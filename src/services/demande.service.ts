import prisma from '../config/database.js'
import { genererNumeroSerie } from '../utils/numeroSerie.utils.js'

const etatConfirme = (type: string, valeur: number): string => {
    switch (type) {
        case 'abonnement_seances':
            return valeur.toString()
        case 'abonnement_temps':
            return new Date(Date.now() + valeur * 24 * 60 * 60 * 1000).toISOString()
        default:
            return '0'
    }
}

/**
 * Creer une demande d'inscription (abonnements uniquement)
 */
export const creer = async (
    programmeId: string,
    clientNom: string,
    clientTelephone: string
) => {
    const programme = await prisma.programme.findFirst({
        where: { id: programmeId, actif: true },
    })
    if (!programme) throw { status: 404, message: 'Programme introuvable ou inactif' }

    // Verifier si une carte active existe deja
    const carteExistante = await prisma.carte.findFirst({
        where: { programmeId, clientTelephone, actif: true },
    })
    if (carteExistante) {
        throw { status: 409, message: 'Ce numero possede deja une carte active sur ce programme' }
    }

    // Verifier si une demande en attente existe deja
    const demandeExistante = await prisma.demande.findFirst({
        where: { programmeId, clientTelephone, statut: 'en_attente' },
    })
    if (demandeExistante) {
        throw { status: 409, message: 'Une demande est deja en attente pour ce numero' }
    }

    return prisma.demande.create({
        data: { programmeId, clientNom, clientTelephone },
        include: { programme: { select: { nom: true, type: true } } },
    })
}

/**
 * Lister les demandes du commercant (optionnellement filtrées par statut)
 */
export const lister = async (commercantId: string, statut?: string) => {
    return prisma.demande.findMany({
        where: {
            programme: { commercantId },
            ...(statut ? { statut: statut as any } : {}),
        },
        include: {
            programme: { select: { nom: true, type: true } },
        },
        orderBy: { creeLe: 'desc' },
    })
}

/**
 * Verifier le statut d'une demande (endpoint public pour le polling)
 */
export const obtenirStatut = async (demandeId: string) => {
    const demande = await prisma.demande.findUnique({
        where: { id: demandeId },
        select: { statut: true, carteId: true },
    })
    if (!demande) throw { status: 404, message: 'Demande introuvable' }
    return demande
}

/**
 * Confirmer une demande — cree la carte avec abonnement actif
 */
export const confirmer = async (demandeId: string, commercantId: string) => {
    const demande = await prisma.demande.findFirst({
        where: { id: demandeId, programme: { commercantId }, statut: 'en_attente' },
        include: { programme: true },
    })
    if (!demande) throw { status: 404, message: 'Demande introuvable ou deja traitee' }

    // Securite : re-verifier doublon (concurrence)
    const existante = await prisma.carte.findFirst({
        where: { programmeId: demande.programmeId, clientTelephone: demande.clientTelephone, actif: true },
    })
    if (existante) {
        throw { status: 409, message: 'Ce client possede deja une carte active sur ce programme' }
    }

    // Generer un numero de serie unique
    let numeroSerie: string
    let tentatives = 0
    do {
        numeroSerie = genererNumeroSerie(demande.programmeId)
        tentatives++
        if (tentatives > 10) throw { status: 500, message: 'Impossible de generer un numero de serie unique' }
    } while (await prisma.carte.findUnique({ where: { numeroSerie } }))

    // Transaction atomique : creer la carte + confirmer la demande
    const carte = await prisma.$transaction(async (tx) => {
        const nouvelleCarte = await tx.carte.create({
            data: {
                numeroSerie,
                programmeId: demande.programmeId,
                commercantId,
                clientNom: demande.clientNom,
                clientTelephone: demande.clientTelephone,
                etat: etatConfirme(demande.programme.type, demande.programme.valeur),
            },
        })
        await tx.demande.update({
            where: { id: demandeId },
            data: { statut: 'confirmee', carteId: nouvelleCarte.id },
        })
        return nouvelleCarte
    })

    return carte
}

/**
 * Refuser une demande
 */
export const refuser = async (demandeId: string, commercantId: string) => {
    const demande = await prisma.demande.findFirst({
        where: { id: demandeId, programme: { commercantId }, statut: 'en_attente' },
    })
    if (!demande) throw { status: 404, message: 'Demande introuvable ou deja traitee' }

    return prisma.demande.update({
        where: { id: demandeId },
        data: { statut: 'refusee' },
    })
}
