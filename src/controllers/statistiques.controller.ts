import { Request, Response } from 'express'
import * as statsService from '../services/statistiques.service.js'

export const obtenirResume = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id
        const data = await statsService.resume(commercantId)
        res.json(data)
    } catch (e: any) {
        res.status(500).json({ erreur: { message: 'Erreur lors du calcul des statistiques' } })
    }
}

export const obtenirActivite = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id

        // Periode : defaut 30 derniers jours
        const fin = new Date()
        fin.setHours(23, 59, 59, 999)

        const jours = parseInt(req.query.jours as string) || 30
        if (jours < 1 || jours > 365) {
            return res.status(422).json({ erreur: { message: 'La periode doit etre entre 1 et 365 jours' } })
        }

        const debut = new Date()
        debut.setDate(debut.getDate() - (jours - 1))
        debut.setHours(0, 0, 0, 0)

        const data = await statsService.activite(commercantId, debut, fin)
        res.json(data)
    } catch (e: any) {
        res.status(500).json({ erreur: { message: 'Erreur lors du calcul de l\'activite' } })
    }
}

const parsePeriode = (query: any) => {
    const jours = parseInt(query.jours as string) || 30
    const fin = new Date(); fin.setHours(23, 59, 59, 999)
    const debut = new Date(); debut.setDate(debut.getDate() - (jours - 1)); debut.setHours(0, 0, 0, 0)
    return { debut, fin, jours }
}

export const obtenirNouveauxClients = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id
        const { debut, fin, jours } = parsePeriode(req.query)
        if (jours < 1 || jours > 365) {
            return res.status(422).json({ erreur: { message: 'La periode doit etre entre 1 et 365 jours' } })
        }
        const data = await statsService.nouveauxClients(commercantId, debut, fin)
        res.json(data)
    } catch {
        res.status(500).json({ erreur: { message: 'Erreur lors du calcul des nouveaux clients' } })
    }
}

export const obtenirJoursActifs = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id
        const { debut, fin, jours } = parsePeriode(req.query)
        if (jours < 1 || jours > 365) {
            return res.status(422).json({ erreur: { message: 'La periode doit etre entre 1 et 365 jours' } })
        }
        const data = await statsService.joursActifs(commercantId, debut, fin)
        res.json(data)
    } catch {
        res.status(500).json({ erreur: { message: 'Erreur lors du calcul des jours actifs' } })
    }
}

export const obtenirClassement = async (req: Request, res: Response) => {
    try {
        const commercantId = (req as any).commercant.id
        const data = await statsService.classementProgrammes(commercantId)
        res.json(data)
    } catch (e: any) {
        res.status(500).json({ erreur: { message: 'Erreur lors du classement des programmes' } })
    }
}
