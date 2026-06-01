import { Request, Response } from 'express'
import { ZodError } from 'zod'
import * as commercantService from '../services/commercant.service.js'
import {
    modifierProfilSchema,
    changerMotDePasseSchema,
    changerEmailDemandeSchema,
    changerEmailConfirmationSchema,
    supprimerCompteSchema,
} from '../validators/commercant.validator.js'

/**
 * Consulter le profil
 * @param req 
 * @param res 
 */
export const consulter = async (req: Request, res: Response) => {
    try {
        const profil = await commercantService.consulterProfil((req as any).commercant.id)
        res.status(200).json(profil)
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la récupération de vos informations' } })
    }
}

/**
 * Modifier un profil
 * @param req 
 * @param res 
 * @returns 
 */
export const modifier = async (req: Request, res: Response) => {
    try {
        const data = modifierProfilSchema.parse(req.body)
        const profil = await commercantService.modifierProfil((req as any).commercant.id, data)
        res.status(200).json(profil)
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la modification du profil' } })
    }
}

/**
 * Changer le mot de passe d'un compte commercant
 * @param req 
 * @param res 
 * @returns 
 */
export const changerMotDePasse = async (req: Request, res: Response) => {
    try {
        const data = changerMotDePasseSchema.parse(req.body)
        await commercantService.changerMotDePasse((req as any).commercant.id, data.ancienMotDePasse, data.nouveauMotDePasse)
        res.status(200).json({ message: 'Votre mot de passe a été modifié' })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la modification du mot de passe' } })
    }
}

/**
 * Demande d'un changement d'email
 * @param req 
 * @param res 
 * @returns 
 */
export const demanderChangementEmail = async (req: Request, res: Response) => {
    try {
        const data = changerEmailDemandeSchema.parse(req.body)
        await commercantService.demanderChangementEmail((req as any).commercant.id, data.nouvelEmail, data.motDePasse)
        res.status(200).json({ message: 'Code envoyé au nouvel email' })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la demande de changement d\'adresse email' } })
    }
}

/**
 * Confirmer un changement d'email
 * @param req 
 * @param res 
 * @returns 
 */
export const confirmerChangementEmail = async (req: Request, res: Response) => {
    try {
        const data = changerEmailConfirmationSchema.parse(req.body)
        const resultat = await commercantService.confirmerChangementEmail((req as any).commercant.id, data.code)
        res.status(200).json({ message: 'Email mis à jour', email: resultat.email })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors du changement de votre adresse email' } })
    }
}

/**
 * Supprimer un compte commercant
 * @param req 
 * @param res 
 * @returns 
 */
export const supprimer = async (req: Request, res: Response) => {
    try {
        const data = supprimerCompteSchema.parse(req.body)
        await commercantService.supprimerCompte((req as any).commercant.id, data.motDePasse)
        res.status(200).json({ message: 'Compte supprimé' })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la suppression du compte' } })
    }
}