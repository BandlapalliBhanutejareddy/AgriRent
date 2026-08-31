import nodemailer from 'nodemailer';
import { EmailProvider } from '../email.service';

export class SmtpProvider implements EmailProvider {
    private transporter: nodemailer.Transporter;
    private fromEmail: string;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        this.fromEmail = process.env.SMTP_FROM || 'noreply@agrorent.ai';
    }

    async sendEmail(to: string, subject: string, bodyText: string, bodyHtml: string): Promise<boolean> {
        try {
            const info = await this.transporter.sendMail({
                from: `"AgroRent AI" <${this.fromEmail}>`,
                to: to,
                subject: subject,
                text: bodyText,
                html: bodyHtml,
            });

            console.log(`[SMTP] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
            
            // If using ethereal, output the URL
            if (process.env.SMTP_HOST?.includes('ethereal')) {
                console.log(`[SMTP] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
            
            return true;
        } catch (error) {
            console.error(`[SMTP ERROR] Failed to send email to ${to}:`, error);
            return false;
        }
    }
}
