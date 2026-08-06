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
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('FATAL: RESEND_API_KEY environment variable is missing.');
        }
        // Removed all Ethereal fallbacks. Hard requirement for Production Resend SMTP.
        this.transporter = nodemailer_1.default.createTransport({
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: {
                user: 'resend',
                pass: process.env.RESEND_API_KEY,
            },
        });
    }
    sendOTP(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.transporter.sendMail({
                    from: 'AgroRent AI Security <security@agrorent.ai>',
                    to: email,
                    subject: 'Your AgroRent AI Verification Code',
                    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 15 minutes.</p>`,
                });
            }
            catch (error) {
                console.error('Failed to send real email OTP:', error);
                throw new Error('Email delivery failed.');
            }
        });
    }
    sendForgotPassword(email, token) {
        return __awaiter(this, void 0, void 0, function* () {
            // Similar production logic...
        });
    }
}
exports.EmailService = EmailService;
