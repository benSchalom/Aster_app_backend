import { Request, Response } from 'express'
import * as verificationService from '../services/verification.service.js'

/**
 * Demande de verification de l'adresse courriel
 */
export const demande = async (req: Request, res: Response) => {
    try {
        await verificationService.demanderVerification((req as any).commercant.id)
        res.status(200).json({ message: 'Code de vérification envoyé' })
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Une erreur est survenue lors de l\'envoie du code de vérifiaction' } })
    }
}

/**
 * Demande de confirmation de l'adresse courriel
 * @param req 
 * @param res 
 * @returns 
 */
export const confirmation = async (req: Request, res: Response) => {
    try {
        const { code } = req.body
        if (!code) return res.status(422).json({ erreur: { message: 'Code requis' } })
        const resultat = await verificationService.confirmerVerification((req as any).commercant.id, code)
        res.status(200).json(resultat)
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Une erreur est survenue lors de la vérification de l\'adresse email' } })
    }
}