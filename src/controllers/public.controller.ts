import { Request, Response } from 'express'
import prisma from '../config/database.js'
import { genererNumeroSerie } from '../utils/numeroSerie.utils.js'
import * as demandeService from '../services/demande.service.js'
import { genererLienWallet } from '../services/wallet.service.js'
import { genererPassApple } from '../services/apple-wallet.service.js'

const BASE_URL = (): string => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`

const escapeHtml = (str: string): string =>
    str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#x27;')

const typeLabelFr = (type: string): string => {
    switch (type) {
        case 'points': return 'Carte a points'
        case 'gratuite': return 'Carte a tampons'
        case 'abonnement_seances': return 'Abonnement seances'
        case 'abonnement_temps': return 'Abonnement duree'
        default: return type
    }
}

const etatLabel = (type: string, valeur: number, etat: string): string => {
    switch (type) {
        case 'points':
            return `${etat} point${parseInt(etat) > 1 ? 's' : ''}`
        case 'gratuite':
            return `${etat} / ${valeur} tampon${valeur > 1 ? 's' : ''}`
        case 'abonnement_seances':
            if (etat === '0') return "En attente d'activation"
            return `${etat} seance${parseInt(etat) > 1 ? 's' : ''} restante${parseInt(etat) > 1 ? 's' : ''}`
        case 'abonnement_temps':
            if (etat === 'inactif') return "En attente d'activation"
            const expiry = new Date(etat)
            if (expiry < new Date()) return 'Abonnement expire'
            return `Actif jusqu'au ${expiry.toLocaleDateString('fr-FR')}`
        default:
            return etat
    }
}

const etatCouleur = (type: string, etat: string): string => {
    if (type === 'abonnement_temps') {
        if (etat === 'inactif') return '#888'
        return new Date(etat) < new Date() ? '#E24B4A' : '#5DCAA5'
    }
    if (type === 'abonnement_seances' && etat === '0') return '#888'
    return '#3B9EE8'
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #f5f5f5; min-height: 100vh; display: flex; flex-direction: column;
         align-items: center; justify-content: center; padding: 20px; }
  .card { background: #fff; border-radius: 20px; padding: 32px 24px; width: 100%; max-width: 400px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .logo { width: 52px; height: 52px; border-radius: 14px; background: #3B9EE8;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
          font-size: 24px; font-weight: 800; color: #fff; }
  h1 { font-size: 22px; font-weight: 700; color: #111; text-align: center; margin-bottom: 6px; }
  .badge { display: inline-block; background: #EFF6FF; color: #3B9EE8; font-size: 12px;
           font-weight: 600; padding: 4px 12px; border-radius: 20px; margin: 0 auto 6px; }
  .marchand { font-size: 13px; color: #888; text-align: center; margin-bottom: 24px; }
  label { display: block; font-size: 13px; font-weight: 600; color: #444; margin-bottom: 6px; }
  input { width: 100%; padding: 14px 16px; border: 1.5px solid #e0e0e0; border-radius: 12px;
          font-size: 16px; color: #111; background: #fafafa; margin-bottom: 16px; outline: none; }
  input:focus { border-color: #3B9EE8; background: #fff; }
  button { width: 100%; padding: 16px; background: #3B9EE8; color: #fff; border: none;
           border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; }
  button:hover { background: #2B7CD4; }
  .erreur { background: #FEF2F2; color: #E24B4A; padding: 12px 16px; border-radius: 10px;
            font-size: 14px; margin-bottom: 16px; }
  .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #bbb; }
  .centre { text-align: center; }
`

export const formulaireEnrollment = async (req: Request, res: Response) => {
    const { programmeId } = req.params
    const erreur = req.query.erreur as string | undefined

    const programme = await prisma.programme.findFirst({
        where: { id: programmeId, actif: true },
        include: { commercant: { select: { nomCommerce: true } } },
    })

    if (!programme) {
        return res.status(404).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Programme introuvable</title><style>${css}</style></head>
<body><div class="card centre"><div class="logo">A</div>
<h1>Programme introuvable</h1>
<p class="marchand">Ce programme n'existe plus ou a ete desactive.</p>
</div><p class="footer">Powered by Aster</p></body></html>`)
    }

    const erreurHtml = erreur
        ? `<div class="erreur">${escapeHtml(decodeURIComponent(erreur))}</div>`
        : ''

    res.send(`<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rejoindre ${escapeHtml(programme.nom)}</title><style>${css}</style></head>
<body><div class="card">
<div class="logo">A</div>
<h1>${escapeHtml(programme.nom)}</h1>
<div class="centre"><span class="badge">${typeLabelFr(programme.type)}</span></div>
<p class="marchand">${escapeHtml(programme.commercant.nomCommerce)}</p>
${erreurHtml}
<form method="POST" action="/p/${programmeId}">
<label for="clientNom">Votre nom</label>
<input type="text" id="clientNom" name="clientNom" placeholder="Nom et prenom" required minlength="2" autocomplete="name">
<label for="clientTelephone">Votre telephone</label>
<input type="tel" id="clientTelephone" name="clientTelephone" placeholder="Ex: 5141234567" required minlength="7" autocomplete="tel">
<button type="submit">Rejoindre le programme</button>
</form></div>
<p class="footer">Powered by Aster</p></body></html>`)
}

export const traiterEnrollment = async (req: Request, res: Response) => {
    const { programmeId } = req.params
    const { clientNom, clientTelephone } = req.body

    if (!clientNom || clientNom.trim().length < 2) {
        return res.redirect(`/p/${programmeId}?erreur=${encodeURIComponent('Veuillez entrer votre nom (minimum 2 caracteres).')}`)
    }
    if (!clientTelephone || clientTelephone.trim().length < 7) {
        return res.redirect(`/p/${programmeId}?erreur=${encodeURIComponent('Veuillez entrer un numero de telephone valide.')}`)
    }

    const nom = clientNom.trim()
    const telephone = clientTelephone.trim()
    const base = BASE_URL()

    try {
        const programme = await prisma.programme.findFirst({ where: { id: programmeId, actif: true } })
        if (!programme) {
            return res.redirect(`/p/${programmeId}?erreur=${encodeURIComponent('Programme introuvable ou inactif.')}`)
        }

        if (programme.type === 'points' || programme.type === 'gratuite') {
            const existante = await prisma.carte.findFirst({
                where: { programmeId, clientTelephone: telephone, actif: true },
            })
            if (existante) return res.redirect(`/carte/${existante.id}`)

            let numeroSerie: string
            let tentatives = 0
            do {
                numeroSerie = genererNumeroSerie(programmeId)
                tentatives++
                if (tentatives > 10) {
                    return res.redirect(`/p/${programmeId}?erreur=${encodeURIComponent('Erreur technique. Veuillez reessayer.')}`)
                }
            } while (await prisma.carte.findUnique({ where: { numeroSerie } }))

            const carte = await prisma.carte.create({
                data: { numeroSerie, programmeId, commercantId: programme.commercantId, clientNom: nom, clientTelephone: telephone, etat: '0' },
            })
            return res.redirect(`${base}/carte/${carte.id}`)
        } else {
            // Abonnement : si une carte active existe déjà, rediriger vers elle
            const existante = await prisma.carte.findFirst({
                where: { programmeId, clientTelephone: telephone, actif: true },
            })
            if (existante) return res.redirect(`${base}/carte/${existante.id}`)

            const demande = await demandeService.creer(programmeId, nom, telephone)
            res.send(pageAttente(demande.id, base))
        }
    } catch (e: any) {
        const msg = e.message || 'Une erreur est survenue. Veuillez reessayer.'
        return res.redirect(`/p/${programmeId}?erreur=${encodeURIComponent(msg)}`)
    }
}

const pageAttente = (demandeId: string, base: string): string => `<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>En attente de confirmation</title>
<style>${css}
.spinner { width: 48px; height: 48px; border: 4px solid #e0e0e0; border-top-color: #3B9EE8;
           border-radius: 50%; animation: spin 0.9s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.sous-titre { font-size: 14px; color: #888; text-align: center; margin-top: 8px; line-height: 1.5; }
</style></head>
<body><div class="card centre">
<div class="spinner"></div>
<h1>En attente</h1>
<p class="sous-titre">Le commercant va bientot confirmer votre inscription.<br>Ne fermez pas cette page.</p>
</div>
<p class="footer">Powered by Aster</p>
<script>
const poll = async () => {
    try {
        const r = await fetch('/api/public/demande/${demandeId}/statut');
        const data = await r.json();
        if (data.statut === 'confirmee' && data.carteId) {
            window.location.href = '${base}/carte/' + data.carteId;
        } else if (data.statut === 'refusee') {
            document.querySelector('h1').textContent = 'Demande refusee';
            document.querySelector('.sous-titre').textContent = "Le commercant n'a pas accepte votre demande. Contactez-le directement.";
            document.querySelector('.spinner').style.display = 'none';
        } else { setTimeout(poll, 3000); }
    } catch (e) { setTimeout(poll, 5000); }
};
setTimeout(poll, 3000);
</script></body></html>`

export const pageCarte = async (req: Request, res: Response) => {
    const { carteId } = req.params

    const carte = await prisma.carte.findFirst({
        where: { id: carteId, actif: true },
        include: {
            programme: { select: { id: true, nom: true, type: true, valeur: true } },
            commercant: { select: { nomCommerce: true, logo: true } },
        },
    })

    if (!carte) {
        return res.status(404).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Carte introuvable</title><style>${css}</style></head>
<body><div class="card centre"><div class="logo">A</div>
<h1>Carte introuvable</h1>
<p class="marchand">Cette carte n'existe pas ou a ete desactivee.</p>
</div></body></html>`)
    }

    const p = carte.programme
    const labelEtatStr = etatLabel(p.type, p.valeur, carte.etat)
    const couleurEtat = etatCouleur(p.type, carte.etat)
    const walletCss = `
        .etat-valeur { font-size: 36px; font-weight: 800; color: ${couleurEtat}; margin: 8px 0; }
        .serie { font-size: 11px; color: #bbb; font-family: monospace; letter-spacing: 1px; margin-top: 16px; }
        .qr-label { font-size: 12px; color: #aaa; margin-top: 12px; margin-bottom: 4px; }
        #qr { margin: 4px auto 0; display: flex; justify-content: center; }
        .wallet-btn { width: 100%; margin-top: 12px; padding: 14px 16px; background: #000; color: #fff;
                      border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
        .wallet-btn:hover { background: #222; }
        .wallet-btn:disabled { background: #555; cursor: not-allowed; }
        .apple-btn { width: 100%; margin-top: 12px; padding: 14px 16px; background: #000; color: #fff;
                     border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;
                     display: none; }
        .apple-btn:hover { background: #222; }
        .wallet-msg { font-size: 13px; color: #E24B4A; margin-top: 10px; min-height: 18px; }
    `

    res.send(`<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Votre carte - ${escapeHtml(p.nom)}</title>
<style>${css}${walletCss}</style></head>
<body><div class="card centre">
<div class="logo">A</div>
<h1>${escapeHtml(p.nom)}</h1>
<div><span class="badge">${typeLabelFr(p.type)}</span></div>
<p class="etat-valeur">${escapeHtml(labelEtatStr)}</p>
<p class="serie">${escapeHtml(carte.numeroSerie)}</p>
<p class="qr-label">Montrez ce code au commercant</p>
<div id="qr"></div>
<button class="wallet-btn" id="wallet-btn" onclick="ajouterGoogle()"> Ajouter a Google Wallet</button>
<button class="apple-btn" id="apple-btn" onclick="ajouterApple()"> Ajouter a Apple Wallet</button>
<p class="wallet-msg" id="wallet-msg"></p>
</div>
<p class="footer">Powered by Aster</p>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
new QRCode(document.getElementById('qr'), {
    text: '${escapeHtml(carte.numeroSerie)}',
    width: 160, height: 160,
    colorDark: '#111', colorLight: '#fff',
    correctLevel: QRCode.CorrectLevel.M
});

// Afficher le bouton Apple Wallet seulement sur iOS
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.getElementById('apple-btn').style.display = 'block';
}

async function ajouterGoogle() {
    var btn = document.getElementById('wallet-btn');
    var msg = document.getElementById('wallet-msg');
    btn.disabled = true;
    btn.textContent = 'Chargement...';
    try {
        var r = await fetch('/api/public/cartes/${carteId}/wallet/google');
        var d = await r.json();
        if (d.lienAjout) {
            window.location.href = d.lienAjout;
        } else {
            msg.textContent = (d.erreur && d.erreur.message) || 'Erreur inattendue.';
            btn.disabled = false;
            btn.textContent = ' Ajouter a Google Wallet';
        }
    } catch (e) {
        msg.textContent = 'Impossible de generer le lien. Reessayez.';
        btn.disabled = false;
        btn.textContent = ' Ajouter a Google Wallet';
    }
}

function ajouterApple() {
    var btn = document.getElementById('apple-btn');
    var msg = document.getElementById('wallet-msg');
    btn.disabled = true;
    btn.textContent = 'Chargement...';
    window.location.href = '/api/public/cartes/${carteId}/wallet/apple';
    setTimeout(function() {
        btn.disabled = false;
        btn.textContent = ' Ajouter a Apple Wallet';
    }, 3000);
}
</script></body></html>`)
}

export const lienWalletGoogle = async (req: Request, res: Response) => {
    try {
        const { carteId } = req.params
        const carte = await prisma.carte.findFirst({
            where: { id: carteId, actif: true },
            include: {
                programme: { select: { id: true, nom: true, type: true, valeur: true } },
                commercant: { select: { nomCommerce: true, logo: true } },
            },
        })
        if (!carte) return res.status(404).json({ erreur: { message: 'Carte introuvable' } })
        const lien = await genererLienWallet(carte as any)
        res.json({ lienAjout: lien })
    } catch (e: any) {
        res.status(500).json({ erreur: { message: 'Erreur generation lien wallet' } })
    }
}

export const passWalletApple = async (req: Request, res: Response) => {
    try {
        const { carteId } = req.params
        const carte = await prisma.carte.findFirst({
            where: { id: carteId, actif: true },
            include: {
                programme: { select: { id: true, nom: true, type: true, valeur: true } },
                commercant: { select: { nomCommerce: true } },
            },
        })
        if (!carte) return res.status(404).json({ erreur: { message: 'Carte introuvable' } })

        const buffer = await genererPassApple(carte as any)

        res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="carte-${carte.numeroSerie}.pkpass"`,
            'Content-Length': buffer.length,
        })
        res.send(buffer)
    } catch (e: any) {
        console.error('[apple-wallet]', e)
        res.status(500).json({ erreur: { message: 'Erreur generation pass Apple Wallet' } })
    }
}

export const statutDemande = async (req: Request, res: Response) => {
    try {
        const { demandeId } = req.params
        const data = await demandeService.obtenirStatut(demandeId)
        res.json(data)
    } catch (e: any) {
        res.status(e.status || 500).json({ message: e.message || 'Erreur serveur' })
    }
}
