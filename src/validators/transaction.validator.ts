import { z } from 'zod'

export const creerTransactionSchema = z.object({
    type: z.enum(['gain', 'consommation', 'recompense'], {
        message: 'Type de transaction invalide (gain | consommation | recompense)',
    }),
    montant: z.number().int().positive().optional(),
})
