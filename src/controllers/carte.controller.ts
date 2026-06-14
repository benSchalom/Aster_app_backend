import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { creerCarteSchema } from '../validators/carte.validator.js'
import * as carteService from '../services/carte.service.js'

export const creer = async (req: Request, res: Response) => {
    try {
        const data = creerCarteSchema.parse(req.body)
        const carte = await carteService.creer((req as any).commercant.id, data)
        res.status(201).json(carte)
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la creation de la carte' } })
    }
}

export const lister = async (req: Request, res: Response) => {
    try {
        const filtres = {
            recherche: req.query.recherche as string | undefined,
            programmeId: req.query.programmeId as string | undefined,
        }
        const cartes = await carteService.lister((req as any).commercant.id, filtres)
        res.status(200).json(cartes)
    } catch (error: any) {
        res.status(500).json({ erreur: { message: 'Erreur lors de la recuperation des cartes' } })
    }
}

export const obtenir = async (req: Request, res: Response) => {
    try {
        const carte = await carteService.obtenir((req as any).commercant.id, req.params.id as string)
        res.status(200).json(carte)
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la recuperation de la carte' } })
    }
}

export const trouverParNumeroSerie = async (req: Request, res: Response) => {
    try {
        const carte = await carteService.trouverParNumeroSerie(
            (req as any).commercant.id,
            req.params.numeroSerie as string
        )
        res.status(200).json(carte)
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Carte introuvable' } })
    }
}

export const supprimer = async (req: Request, res: Response) => {
    try {
        await carteService.supprimer((req as any).commercant.id, req.params.id as string)
        res.status(200).json({ message: 'Carte desactivee' })
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la suppression de la carte' } })
    }
}
