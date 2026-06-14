import { Request, Response } from 'express'
import * as demandeService from '../services/demande.service.js'

export const lister = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id
        const { statut } = req.query
        const demandes = await demandeService.lister(commercantId, statut as string | undefined)
        res.json(demandes)
    } catch (e: any) {
        res.status(e.status || 500).json({ erreur: { message: e.message || 'Erreur serveur' } })
    }
}

export const confirmer = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id
        const { id } = req.params
        const carte = await demandeService.confirmer(id, commercantId)
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
        res.json({ carte, carteUrl: `${baseUrl}/carte/${carte.id}` })
    } catch (e: any) {
        res.status(e.status || 500).json({ erreur: { message: e.message || 'Erreur serveur' } })
    }
}

export const refuser = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id
        const { id } = req.params
        await demandeService.refuser(id, commercantId)
        res.json({ message: 'Demande refusee' })
    } catch (e: any) {
        res.status(e.status || 500).json({ erreur: { message: e.message || 'Erreur serveur' } })
    }
}
