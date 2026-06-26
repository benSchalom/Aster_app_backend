import { PKPass } from 'passkit-generator'
import path from 'path'
import fs from 'fs'

const ICONS_DIR = path.resolve(process.cwd(), 'src/models/apple-wallet.pass')

const TYPE_LABELS: Record<string, string> = {
    points: 'Points',
    gratuite: 'Tampons',
    abonnement_seances: 'Seances',
    abonnement_temps: 'Abonnement',
}

const labelEtat = (type: string, valeur: number, etat: string): string => {
    switch (type) {
        case 'points':
            return `${etat} pt${parseInt(etat) !== 1 ? 's' : ''}`
        case 'gratuite':
            return `${etat} / ${valeur}`
        case 'abonnement_seances':
            return etat === '0' ? 'En attente' : `${etat} seance${parseInt(etat) !== 1 ? 's' : ''}`
        case 'abonnement_temps':
            if (etat === 'inactif') return 'En attente'
            const exp = new Date(etat)
            if (exp < new Date()) return 'Expire'
            return `Jusqu\'au ${exp.toLocaleDateString('fr-FR')}`
        default:
            return etat
    }
}

const getCertificates = () => {
    if (process.env.APPLE_CERT_PEM) {
        return {
            wwdr: Buffer.from(process.env.APPLE_WWDR_PEM!, 'base64'),
            signerCert: Buffer.from(process.env.APPLE_CERT_PEM!, 'base64'),
            signerKey: Buffer.from(process.env.APPLE_KEY_PEM!, 'base64'),
        }
    }
    const dir = process.env.APPLE_CERTS_DIR || 'C:/APP/cle'
    return {
        wwdr: fs.readFileSync(path.join(dir, 'wwdr_cert.pem')),
        signerCert: fs.readFileSync(path.join(dir, 'pass_cert.pem')),
        signerKey: fs.readFileSync(path.join(dir, 'pass_key.pem')),
    }
}

export const genererPassApple = async (carte: {
    id: string
    numeroSerie: string
    clientNom: string
    etat: string
    programme: { id: string; nom: string; type: string; valeur: number }
    commercant: { nomCommerce: string }
}): Promise<Buffer> => {
    const etatStr = labelEtat(carte.programme.type, carte.programme.valeur, carte.etat)
    const typeLabel = TYPE_LABELS[carte.programme.type] || 'Fidelite'

    // Construire le pass.json dynamiquement — plus fiable que les overrides imbriques
    const passJson = {
        formatVersion: 1,
        passTypeIdentifier: 'pass.app.joinaster.loyalty',
        teamIdentifier: 'J7HS896TZX',
        organizationName: 'Aster',
        description: `Carte ${carte.programme.nom}`,
        serialNumber: carte.id,
        backgroundColor: 'rgb(59, 158, 232)',
        foregroundColor: 'rgb(255, 255, 255)',
        labelColor: 'rgb(200, 233, 252)',
        storeCard: {
            primaryFields: [
                { key: 'balance', label: typeLabel, value: etatStr },
            ],
            secondaryFields: [
                { key: 'program', label: 'Programme', value: carte.programme.nom },
            ],
            auxiliaryFields: [
                { key: 'merchant', label: 'Commercant', value: carte.commercant.nomCommerce },
            ],
            backFields: [
                { key: 'cardNumber', label: 'Numero de carte', value: carte.numeroSerie },
                { key: 'memberName', label: 'Membre', value: carte.clientNom },
            ],
        },
        barcodes: [
            { format: 'PKBarcodeFormatQR', message: carte.numeroSerie, messageEncoding: 'iso-8859-1' },
        ],
        barcode: {
            format: 'PKBarcodeFormatQR',
            message: carte.numeroSerie,
            messageEncoding: 'iso-8859-1',
        },
    }

    const pass = new PKPass(
        {
            'pass.json': Buffer.from(JSON.stringify(passJson)),
            'icon.png': fs.readFileSync(path.join(ICONS_DIR, 'icon.png')),
            'icon@2x.png': fs.readFileSync(path.join(ICONS_DIR, 'icon@2x.png')),
            'icon@3x.png': fs.readFileSync(path.join(ICONS_DIR, 'icon@3x.png')),
        },
        getCertificates()
    )

    return pass.getAsBuffer()
}
