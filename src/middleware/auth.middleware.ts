import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

/**
 * Middleware d'authentification
 * 1. lit le header
 * 2. verifie la signature du header (authenticite et validite dans le temps)
 * 3. on attache le payload dans req.commercant
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const authentifier = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ erreur: { message: 'Clés de sécurité manquante' } })
    }

    try {
        const token = header.split(' ')[1]
        const payload = jwt.verify(token, JWT_SECRET)
            ; (req as any).commercant = payload
        next()
    } catch {
        return res.status(401).json({ erreur: { message: 'Clés de sécurité invalide' } })
    }
}

/**
 * Exiger une verificartion d'email apres verficiation
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const exigerEmailVerifie = (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).commercant.emailVerifie) {
        return res.status(403).json({ erreur: { message: 'Email non vérifié' } })
    }
    next()
}