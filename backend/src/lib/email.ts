import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

export async function sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  
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

  if (!apiKey || apiKey === 're_123456789' || apiKey.includes('123456789')) {
    console.warn(`[WARNING] Valid RESEND_API_KEY is not set. Falling back to Ethereal Testing Mail.`);
    try {
      // Create ethereal test account on the fly
      const testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });

      const info = await transporter.sendMail({
        from: '"AgroRent AI Security" <security@agrorent.dev>',
        to: email,
        subject: subject,
        text: bodyText,
        html: bodyHtml,
      });

      console.log(`[SUCCESS] Ethereal Email sent! ID: ${info.messageId}`);
      console.log(`[ETHEREAL MAILBOX] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      return true;
    } catch (err) {
      console.error(`[EXCEPTION] Failed to dispatch via Ethereal:`, err);
      return false;
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AgroRent AI <onboarding@resend.dev>',
        to: email,
        subject,
        html: bodyHtml,
        text: bodyText
      })
    });

    const resJson = await response.json() as any;
    if (response.ok) {
      console.log(`[SUCCESS] Email OTP sent to ${email} via Resend. ID: ${resJson.id}`);
      return true;
    } else {
      console.error(`[ERROR] Resend API error:`, resJson);
      return false;
    }
  } catch (err) {
    console.error(`[EXCEPTION] Failed to dispatch email via Resend:`, err);
    return false;
  }
}
