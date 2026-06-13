/**
 * Genere un numero de serie unique au format PPPP-XXXX-AAAA
 * PPPP = 4 premiers caracteres hex de l'UUID du programme (majuscules)
 *        => unique par programme, indépendant du nom
 * XXXX = 4 chiffres aleatoires
 * AAAA = 4 lettres aleatoires majuscules
 *
 * Ex: 3F9A-2847-KZWM
 */
export const genererNumeroSerie = (programmeId: string): string => {
    const lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const chiffres = '0123456789'

    // Utiliser les 4 premiers caracteres hex de l'UUID du programme (sans tiret)
    const prefix = programmeId.replace(/-/g, '').substring(0, 4).toUpperCase()

    const digits = Array.from({ length: 4 }, () =>
        chiffres[Math.floor(Math.random() * chiffres.length)]
    ).join('')

    const chars = Array.from({ length: 4 }, () =>
        lettres[Math.floor(Math.random() * lettres.length)]
    ).join('')

    return `${prefix}-${digits}-${chars}`
}
