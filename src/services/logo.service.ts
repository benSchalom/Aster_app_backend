import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { UPLOADS_DIR } from '../config/upload.js'
import prisma from '../config/database.js'

/**
 * Compresse et sauvegarde un logo, supprime l'ancien si présent
 */
export const sauvegarderLogo = async (
    commercantId: string,
    buffer: Buffer,
    mimetype: string
): Promise<string> => {
    // Supprimer l'ancien logo s'il existe
    const existant = await prisma.commercant.findUnique({ where: { id: commercantId }, select: { logo: true } })
    if (existant?.logo) {
        const nomFichierAncien = path.basename(existant.logo)
        const cheminAncien = path.join(UPLOADS_DIR, nomFichierAncien)
        if (fs.existsSync(cheminAncien)) {
            fs.unlinkSync(cheminAncien)
        }
    }

    // Nom unique
    const ext = mimetype === 'image/webp' ? 'webp' : 'webp' // toujours convertir en webp
    const nomFichier = `${randomUUID()}.${ext}`
    const cheminFichier = path.join(UPLOADS_DIR, nomFichier)

    // Compression avec sharp : redimensionner à 512×512 max, qualité 80
    await sharp(buffer)
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(cheminFichier)

    // Mettre à jour la DB
    const logoUrl = `/uploads/logos/${nomFichier}`
    await prisma.commercant.update({
        where: { id: commercantId },
        data: { logo: logoUrl },
    })

    return logoUrl
}
