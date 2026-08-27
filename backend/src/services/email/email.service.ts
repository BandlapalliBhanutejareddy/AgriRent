import { ResendProvider } from './providers/resend.provider';

export interface EmailProvider {
    sendEmail(to: string, subject: string, bodyText: string, bodyHtml: string): Promise<boolean>;
}

export class EmailService {
    private provider: EmailProvider;

    constructor() {
        const providerName = process.env.EMAIL_PROVIDER || 'resend';
        
        if (providerName === 'resend') {
            this.provider = new ResendProvider();
        } else {
            // Default or fallback provider
            this.provider = new ResendProvider();
        }
    }

    async sendOtp(email: string, otp: string, purpose: string): Promise<boolean> {
        const subject = purpose === 'REGISTER' 
            ? 'Verify Your AgroRent AI Account' 
            : 'AgroRent AI Password Recovery OTP';
        
        const bodyText = purpose === 'REGISTER'
            ? `Welcome to AgroRent AI! Your secure 6-digit account activation verification code is ${otp}.`
            : `You requested password recovery. Your secure 6-digit recovery OTP is ${otp}.`;

        const bodyHtml = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #059669; text-align: center;">AgroRent AI Security Service</h2>
            <p>Hello,</p>
            <p>${purpose === 'REGISTER' ? 'Thank you for signing up with AgroRent AI!' : 'You initiated a secure password recovery request.'}</p>
            <div style="background-color: #f0fdf4; border: 1.5px dashed #10b981; border-radius: 12px; padding: 15px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #047857;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #64748b;">This OTP code expires in 5 minutes. If you did not request this verification, please secure your account immediately.</p>
            </div>
        `;

        console.log(`[EMAIL DISPATCH] Target: ${email} | Purpose: ${purpose} | Status: Initiated`);
        
        return await this.provider.sendEmail(email, subject, bodyText, bodyHtml);
    }
}
