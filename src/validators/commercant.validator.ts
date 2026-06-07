import { z } from 'zod'

export const modifierProfilSchema = z.object({
    nomCommerce: z.string().min(2, 'Min 2 caracteres').optional(),
    telephone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Telephone invalide').optional(),
    adresse: z.string().min(5, 'Adresse trop courte').optional(),
}).refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: 'Au moins un champ est requis' }
)

export const changerMotDePasseSchema = z.object({
    ancienMotDePasse: z.string().min(1, 'Ancien mot de passe requis'),
    nouveauMotDePasse: z.string()
        .min(8, 'Minimum 8 caracteres')
        .regex(/[A-Z]/, 'Au moins une majuscule')
        .regex(/[0-9]/, 'Au moins un chiffre')
        .regex(/[^\w\s]/, 'Au moins un caractere special'),
})

export const changerEmailDemandeSchema = z.object({
    nouvelEmail: z.string().email('Cet email est invalide'),
    motDePasse: z.string().min(1, 'Mot de passe requis'),
})

export const changerEmailConfirmationSchema = z.object({
    code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
})

export const supprimerCompteSchema = z.object({
    motDePasse: z.string().min(1, 'Mot de passe requis'),
})
