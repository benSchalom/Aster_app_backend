import { z } from 'zod'

export const modifierProfilSchema = z.object({
    nomCommerce: z.string().min(2, 'Min 2 caractères').optional(),
    telephone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Téléphone invalide').optional(),
    adresse: z.string().min(5, 'Adresse trop courte').optional(),
})

export const changerMotDePasseSchema = z.object({
    ancienMotDePasse: z.string().min(1, 'Votre ancien mot de passe requis'),
    nouveauMotDePasse: z.string()
        .min(8, 'Minimum 8 caractères')
        .regex(/[A-Z]/, 'Au moins une majuscule')
        .regex(/[0-9]/, 'Au moins un chiffre')
        .regex(/[^\w\s]/, 'Au moins un caractère spécial'),
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