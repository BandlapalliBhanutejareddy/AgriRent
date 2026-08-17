"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvs = [
    'DATABASE_URL',
    'JWT_SECRET',
    'RESEND_API_KEY',
    'GEMINI_API_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
];
function validateEnv() {
    const missing = requiredEnvs.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ FATAL ERROR: Missing required environment variables:');
        missing.forEach((key) => console.error(`   - ${key}`));
        console.error('The server cannot start without these configurations.');
        process.exit(1);
    }
    console.log('✅ Environment validation passed.');
}
