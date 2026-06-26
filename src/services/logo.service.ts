import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'
import prisma from '../config/database.js'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Compresse l'image et l'uploade sur Cloudinary.
 * Utilise un public_id fixe par commerçant — l'ancien logo est automatiquement
 * remplacé et invalidé du CDN. Aucune suppression manuelle nécessaire.
 */
export const sauvegarderLogo = async (
    commercantId: string,
    buffer: Buffer,
): Promise<string> => {
    // Convertir en PNG via sharp (Cloudinary accepte PNG, JPEG, WebP)
    const imageBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .png({ quality: 80 })
        .toBuffer()

    // public_id fixe par commerçant → overwrite remplace l'ancien logo
    const publicId = `aster/logos/${commercantId}`

    const url: string = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id: publicId,
                overwrite: true,
                invalidate: true, // purge le cache CDN
                resource_type: 'image',
                format: 'png',
            },
            (error, result) => {
                if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
                resolve(result.secure_url)
            }
        )
        stream.end(imageBuffer)
    })

    // Stocker l'URL Cloudinary dans la BD
    await prisma.commercant.update({
        where: { id: commercantId },
        data: { logo: url },
    })

    return url
}
