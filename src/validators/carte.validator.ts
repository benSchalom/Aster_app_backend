import { z } from 'zod'

export const creerCarteSchema = z.object({
    programmeId: z.string().uuid({ message: 'ID de programme invalide' }),
    clientNom: z.string().min(2, { message: 'Le nom du client doit contenir au moins 2 caracteres' }),
    clientTelephone: z.string().min(6, { message: 'Numero de telephone invalide' }),
})
