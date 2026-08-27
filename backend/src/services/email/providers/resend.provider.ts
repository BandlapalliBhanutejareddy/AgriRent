import { EmailProvider } from '../email.service';

export class ResendProvider implements EmailProvider {
    async sendEmail(to: string, subject: string, bodyText: string, bodyHtml: string): Promise<boolean> {
        const apiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.EMAIL_FROM || 'AgroRent AI <onboarding@resend.dev>';

        if (!apiKey) {
            console.error('[EMAIL ERROR] Email provider requires API key, but it is not set.');
            return false;
        }

        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to,
                    subject,
                    html: bodyHtml,
                    text: bodyText
                })
            });

            const resJson = await response.json() as any;
            if (response.ok) {
                console.log(`[SUCCESS] Email sent successfully via Resend provider.`);
                return true;
            } else {
                // Log sanitized error
                const statusCode = resJson?.statusCode || response.status;
                const errorName = resJson?.name || 'UnknownError';
                
                if (statusCode === 403) {
                    console.error(`[EMAIL PROVIDER ERROR] Delivery blocked by provider Sandbox restrictions (Status: 403).`);
                } else {
                    console.error(`[EMAIL PROVIDER ERROR] Provider rejected request (Status: ${statusCode}, Reason: ${errorName}).`);
                }
                return false;
            }
        } catch (err) {
            console.error(`[EMAIL PROVIDER ERROR] Network failure reaching email provider.`);
            return false;
        }
    }
}
