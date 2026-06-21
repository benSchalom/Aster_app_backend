import { Request, Response } from 'express'
import { inscriptionSchema, connexionSchema } from '../validators/authentification.validator.js'
import * as authService from '../services/authentification.service.js'

/**
 * Inscription des commercants
 * 1. Recuprer les informations provenant du formulaire et valider
 * 2. appel le service d'authentification dans le but de faire une inscription
 * 
 * @param req 
 * @param res 
 */
export const inscription = async (req: Request, res: Response) => {
    try {
        const data = inscriptionSchema.parse(req.body)
        const resultat = await authService.inscrire(data)
        res.status(201).json(resultat)
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(422).json({ erreur: { message: error.issues[0].message } })
        } else if (error.status) {
            res.status(error.status).json({ erreur: { message: error.message } })
        } else {
            res.status(500).json({ erreur: { message: 'Erreur serveur' } })
        }
    }
}

/**
 * Connecter un commercant
 * 1. Validation du formulaire de connexion
 * 2. appel du service de connexion
 * @param req 
 * @param res 
 */
export const connexion = async (req: Request, res: Response) => {
    try {
        const data = connexionSchema.parse(req.body)
        const resultat = await authService.connecter(data)
        res.status(200).json(resultat)
    } catch (error: any) {
        console.log(error)
        if (error.name === 'ZodError') {
            res.status(422).json({ erreur: { message: error.issues[0].message } })
        } else if (error.status) {
            res.status(error.status).json({ erreur: { message: error.message } })
        } else {
            res.status(500).json({ erreur: { message: 'Erreur serveur' } })
        }
    }
}

/**
 * Rafraichir le token 
 * 1. appel le service de rafraichissement de token
 * @param req 
 * @param res 
 */
export const rafraichirToken = async (req: Request, res: Response) => {
    try {
        const resultat = await authService.rafraichir((req as any).commercant.id)
        res.status(200).json(resultat)
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ erreur: { message: error.message } })
        } else {
            res.status(500).json({ erreur: { message: 'Erreur serveur' } })
        }
    }
}