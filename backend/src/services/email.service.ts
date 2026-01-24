import nodemailer from 'nodemailer'
import logger from '../utils/logger'

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  EMAIL_FROM,
} = process.env

const port = SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.gmail.com',
  port,
  secure: port === 465,
  auth: SMTP_USER && SMTP_PASSWORD ? {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  } : undefined,
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions): Promise<void> => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    logger.warn('SMTP non configuré, email ignoré', { to, subject })
    return
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || SMTP_USER,
      to,
      subject,
      html,
      text,
    })
  } catch (error) {
    logger.error('Erreur lors de l’envoi d’email', { error, to, subject })
  }
}
