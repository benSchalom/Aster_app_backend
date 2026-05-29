import { z } from 'zod'

export const inscriptionSchema = z.object({
    nomCommerce: z.string().min(2, 'Le nom de l\'établissement est requis. (Minimum 2 caractères.)'),
    email: z.string().email('Cet email est invalide'),
    motDePasse: z.string()
        .min(8, 'Au moins 8 caractères')
        .regex(/[A-Z]/, 'Au moins une majuscule')
        .regex(/[0-9]/, 'Au moins un chiffre')
        .regex(/[^\w\s]/, 'Au moins un caractère spécial'),
    telephone: z.string()
        .regex(/^\+?[0-9]{10,15}$/, 'Numéro de téléphone invalide')
        .optional(),
    adresse: z.string().min(5, 'Adresse trop courte').optional(),
})

export const connexionSchema = z.object({
  email: z.string().email('Cet email est invalide'),
  motDePasse: z.string().min(1, 'Mot de passe requis'),
})