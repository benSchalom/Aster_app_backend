import { Request, Response } from 'express'
import { ZodError } from 'zod'
import * as commercantService from '../services/commercant.service.js'
import * as logoService from '../services/logo.service.js'
import {
    modifierProfilSchema,
    changerMotDePasseSchema,
    changerEmailDemandeSchema,
    changerEmailConfirmationSchema,
    supprimerCompteSchema,
} from '../validators/commercant.validator.js'

export const consulter = async (req: Request, res: Response) => {
    try {
        const profil = await commercantService.consulterProfil((req as any).commercant.id)
        res.status(200).json(profil)
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur recuperation profil' } })
    }
}

export const modifier = async (req: Request, res: Response) => {
    try {
        const data = modifierProfilSchema.parse(req.body)
        const profil = await commercantService.modifierProfil((req as any).commercant.id, data)
        res.status(200).json(profil)
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur modification profil' } })
    }
}

export const changerMotDePasse = async (req: Request, res: Response) => {
    try {
        const data = changerMotDePasseSchema.parse(req.body)
        const resultat = await commercantService.changerMotDePasse((req as any).commercant.id, data.ancienMotDePasse, data.nouveauMotDePasse)
        res.status(200).json({ message: 'Mot de passe modifie', token: resultat.token })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur modification mot de passe' } })
    }
}

export const demanderChangementEmail = async (req: Request, res: Response) => {
    try {
        const data = changerEmailDemandeSchema.parse(req.body)
        await commercantService.demanderChangementEmail((req as any).commercant.id, data.nouvelEmail, data.motDePasse)
        res.status(200).json({ message: 'Code envoye au nouvel email' })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur demande changement email' } })
    }
}

export const confirmerChangementEmail = async (req: Request, res: Response) => {
    try {
        const data = changerEmailConfirmationSchema.parse(req.body)
        const resultat = await commercantService.confirmerChangementEmail((req as any).commercant.id, data.code)
        res.status(200).json({ message: 'Email mis a jour', email: resultat.email })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur confirmation changement email' } })
    }
}

export const uploaderLogo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erreur: { message: 'Aucun fichier recu' } })
        }
        const logoUrl = await logoService.sauvegarderLogo(
            (req as any).commercant.id,
            req.file.buffer,
            req.file.mimetype
        )
        res.status(200).json({ logo: logoUrl })
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur upload logo' } })
    }
}

export const supprimer = async (req: Request, res: Response) => {
    try {
        const data = supprimerCompteSchema.parse(req.body)
        await commercantService.supprimerCompte((req as any).commercant.id, data.motDePasse)
        res.status(200).json({ message: 'Compte supprime' })
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur suppression compte' } })
    }
}
