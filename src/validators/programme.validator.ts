import { z } from 'zod'

/**
 * Validation du formulaire de creation d'un programme
 */
export const creerProgrammeSchema = z.object({
    nom: z.string().min(2, 'Nom du programme requis (min 2 caractères)'),
    type: z.enum(['points', 'gratuite', 'abonnement_seances', 'abonnement_temps'], {
        message: 'Type de programme invalide',
    }),
    valeur: z.number().int().positive('La valeur doit être supérieure à 0'),
    recompense: z.string().min(2, 'Récompense requise'),
})

/**
 * Valuidation du formulaire de modification d'un programme
 */
export const modifierProgrammeSchema = z.object({
    nom: z.string().min(2).optional(),
    valeur: z.number().int().positive().optional(),
    recompense: z.string().min(2).optional(),
})