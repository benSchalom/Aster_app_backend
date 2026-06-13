import { z } from 'zod'

export const creerProgrammeSchema = z.object({
    nom: z.string().min(2, 'Nom du programme requis (min 2 caracteres)'),
    type: z.enum(['points', 'gratuite', 'abonnement_seances', 'abonnement_temps'], {
        message: 'Type de programme invalide',
    }),
    // points n'a pas de seuil — valeur est optionnelle pour ce type uniquement
    valeur: z.number().int().positive('La valeur doit etre superieure a 0').optional(),
    pas: z.number().int().positive('Le pas doit etre superieur a 0').default(1),
    recompense: z.string().min(2).optional(),
}).superRefine((data, ctx) => {
    if (data.type !== 'points' && !data.valeur) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'valeur est requis pour ce type de programme',
            path: ['valeur'],
        })
    }
})

export const modifierProgrammeSchema = z.object({
    nom: z.string().min(2).optional(),
    valeur: z.number().int().positive().optional(),
    pas: z.number().int().positive().optional(),
    recompense: z.string().min(2).optional().nullable(),
})
