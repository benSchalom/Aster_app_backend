import multer from 'multer'
import path from 'path'

// Stockage en mémoire — sharp s'occupe de sauvegarder après compression
const storage = multer.memoryStorage()

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const typesAutorises = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (typesAutorises.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Format non supporté. Utilisez JPEG, PNG ou WebP.'))
    }
}

export const uploadLogo = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 Mo max en entrée
    },
})

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'logos')
