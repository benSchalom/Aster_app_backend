import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { creerProgrammeSchema, modifierProgrammeSchema } from '../validators/programme.validator.js'
import * as programmeService from '../services/programme.service.js'

/**
 * Creation d'un programme de fidélité
 * @param req 
 * @param res 
 * @returns 
 */
export const creer = async (req: Request, res: Response) => {
    try {
        const data = creerProgrammeSchema.parse(req.body)
        const programme = await programmeService.creer((req as any).commercant.id, data)
        res.status(201).json(programme)
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la création du programme' } })
    }
}

/**
 * Liste des programmes créer (actifs ou tous)
 * @param req 
 * @param res 
 */
export const lister = async (req: Request, res: Response) => {
    try {
        const inclureInactifs = req.query.inclureInactifs === 'true'
        const programmes = await programmeService.lister((req as any).commercant.id, inclureInactifs)
        res.status(200).json(programmes)
    } catch (error: any) {
        res.status(500).json({ erreur: { message: 'Erreur lors de la récupération de la liste de programme' } })
    }
}

/**
 * Obtenir les infos sur un programme en particulier
 * @param req 
 * @param res 
 */
export const obtenir = async (req: Request, res: Response) => {
    try {
        const programme = await programmeService.obtenir((req as any).commercant.id, req.params.id as string)
        res.status(200).json(programme)
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la récupération des infos sur de ce programme' } })
    }
}

/**
 * Modifier les infos d'un programme
 * @param req 
 * @param res 
 * @returns 
 */
export const modifier = async (req: Request, res: Response) => {
    try {
        const data = modifierProgrammeSchema.parse(req.body)
        const programme = await programmeService.modifier((req as any).commercant.id, req.params.id as string, data)
        res.status(200).json(programme)
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la modification des informations de ce programme' } })
    }
}

/**
 * Supprimer un programme
 * @param req 
 * @param res 
 */
export const supprimer = async (req: Request, res: Response) => {
    try {
        await programmeService.supprimer((req as any).commercant.id, req.params.id as string)
        res.status(200).json({ message: 'Programme désactivé' })
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la suppression de ce programme' } })
    }
}