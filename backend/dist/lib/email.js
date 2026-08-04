"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function sendOtpEmail(email, otp, purpose) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.RESEND_API_KEY;
        const subject = purpose === 'REGISTER'
            ? 'Verify Your AgroRent AI Account'
            : 'AgroRent AI Password Recovery OTP';
        const bodyText = purpose === 'REGISTER'
            ? `Welcome to AgroRent AI! Your secure 6-digit account activation verification code is ${otp}.`
            : `You requested password recovery. Your secure 6-digit recovery OTP is ${otp}.`;
        const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
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
        if (!apiKey) {
            console.warn(`[WARNING] RESEND_API_KEY is not set. Emails will not be dispatched.`);
            return false;
        }
        try {
            const response = yield fetch('https://api.resend.com/emails', {
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
            const resJson = yield response.json();
            if (response.ok) {
                console.log(`[SUCCESS] Email OTP sent to ${email} via Resend. ID: ${resJson.id}`);
                return true;
            }
            else {
                console.error(`[ERROR] Resend API error:`, resJson);
                return false;
            }
        }
        catch (err) {
            console.error(`[EXCEPTION] Failed to dispatch email via Resend:`, err);
            return false;
        }
    });
}
