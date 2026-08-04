import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('FATAL: RESEND_API_KEY environment variable is missing.');
    }

    // Removed all Ethereal fallbacks. Hard requirement for Production Resend SMTP.
    this.transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  async sendOTP(email: string, otp: string) {
    try {
      await this.transporter.sendMail({
        from: 'AgroRent AI Security <security@agrorent.ai>',
        to: email,
        subject: 'Your AgroRent AI Verification Code',
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 15 minutes.</p>`,
      });
    } catch (error) {
      console.error('Failed to send real email OTP:', error);
      throw new Error('Email delivery failed.');
    }
  }

  async sendForgotPassword(email: string, token: string) {
    // Similar production logic...
  }
}
