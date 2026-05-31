import { Request, Response } from 'express'
import { ZodError } from 'zod'
import * as motdepasseService from '../services/motdepasse.service.js'
import { z } from 'zod'

const demandeSchema = z.object({
  email: z.string().email('cet email est invalide'),
})

const confirmationSchema = z.object({
    code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
    nouveauMotDePasse: z.string()
        .min(8, 'Minimum 8 caractères')
        .regex(/[A-Z]/, 'Au moins une majuscule')
        .regex(/[0-9]/, 'Au moins un chiffre')
        .regex(/[^\w\s]/, 'Au moins un caractère spécial'),
})

/**
 * Demande de reinitialisation de mot de passe
 * @param req 
 * @param res 
 * @returns 
 */
export const demande = async (req: Request, res: Response) => {
    try {
        const data = demandeSchema.parse(req.body)
        await motdepasseService.demanderReinitialisation(data.email)
        res.status(200).json({ message: 'Si le compte existe, un email a été envoyé' })
    } catch (error: any) {
        if (error instanceof ZodError) {
        return res.status(422).json({ erreur: { message: error.issues[0].message } })
        }
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la demande de réinitialisation du mot de passe' } })
    }
}

/**
 * Confirmation de la réinitialisation du mot de passe
 * @param req 
 * @param res 
 * @returns 
 */
export const confirmation = async (req: Request, res: Response) => {
    try {
        const data = confirmationSchema.parse(req.body)
        await motdepasseService.confirmerReinitialisation(data.code, data.nouveauMotDePasse)
        res.status(200).json({ message: 'Mot de passe modifié' })
    } catch (error: any) {
        if (error instanceof ZodError) {
        return res.status(422).json({ erreur: { message: error.issues[0].message } })
        }
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur serveur' } })
    }
}