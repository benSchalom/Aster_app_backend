import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { creerTransactionSchema } from '../validators/transaction.validator.js'
import * as transactionService from '../services/transaction.service.js'

export const enregistrer = async (req: Request, res: Response) => {
    try {
        const data = creerTransactionSchema.parse(req.body)
        const resultat = await transactionService.enregistrer(
            (req as any).commercant.id,
            req.params.carteId,
            data
        )
        res.status(201).json(resultat)
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(422).json({ erreur: { message: error.issues[0].message } })
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la transaction' } })
    }
}

export const lister = async (req: Request, res: Response) => {
    try {
        const limite = req.query.limite ? parseInt(req.query.limite as string) : 50
        const transactions = await transactionService.lister(
            (req as any).commercant.id,
            req.params.carteId,
            limite
        )
        res.status(200).json(transactions)
    } catch (error: any) {
        const status = error.status || 500
        res.status(status).json({ erreur: { message: error.message || 'Erreur lors de la recuperation des transactions' } })
    }
}
