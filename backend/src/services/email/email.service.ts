import { SmtpProvider } from './providers/smtp.provider';

export interface EmailProvider {
    sendEmail(to: string, subject: string, bodyText: string, bodyHtml: string): Promise<boolean>;
}

export class EmailService {
    private provider: EmailProvider;

    constructor() {
        this.provider = new SmtpProvider();
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

    async sendPasswordReset(email: string, token: string): Promise<boolean> {
        const subject = 'AgroRent AI Password Reset Request';
        const bodyText = `You requested a password reset. Your secure reset token is: ${token}. This token expires in 15 minutes.`;
        const bodyHtml = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #059669; text-align: center;">AgroRent AI Password Reset</h2>
            <p>Hello,</p>
            <p>You recently requested to reset your password for your AgroRent AI account. Use the secure token below to proceed with resetting your password.</p>
            <div style="background-color: #f0fdf4; border: 1.5px dashed #10b981; border-radius: 12px; padding: 15px; text-align: center; margin: 20px 0; word-break: break-all;">
                <span style="font-size: 24px; font-weight: 700; color: #047857;">${token}</span>
            </div>
            <p style="font-size: 12px; color: #64748b;">This token expires in 15 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
        `;

        try {
            return await this.provider.sendEmail(email, subject, bodyText, bodyHtml);
        } catch (error) {
            // Log securely without exposing token or email in plaintext
            console.error('[EMAIL DISPATCH ERROR] Failed to send password reset email.');
            return false;
        }
    }
}
