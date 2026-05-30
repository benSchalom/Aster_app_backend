import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
    },
})

export const envoyerEmail = async (destinataire: string, sujet: string, html: string) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: destinataire,
        subject: sujet,
        html,
    })
}

export const envoyerOTP = async (email: string, code: string) => {
    await envoyerEmail(
        email,
        'ASTER - Code de vérification',
        `
        <div style="font-family: Arial; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B9EE8;">ASTER</h2>
            <p>Votre code de vérification :</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #1E3A5C;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">Ce code expire dans 10 minutes.</p>
            <p style="color: #888; font-size: 13px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        </div>
        `
    )
}