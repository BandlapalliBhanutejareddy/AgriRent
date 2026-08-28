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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const prisma_1 = require("../lib/prisma");
const genai_1 = require("@google/genai");
const router = (0, express_1.Router)();
// Initialize Gemini Client
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
router.post('/advisor', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prompt, language = 'English' } = req.body;
        if (!prompt || typeof prompt !== 'string') {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_api_key_here') || process.env.GEMINI_API_KEY.includes('MOCK')) {
            res.status(503).json({ error: 'AI Advisor is currently unavailable pending production credentials.' });
            return;
        }
        // Fetch all available equipment to give context to Gemini
        const equipmentList = yield prisma_1.prisma.equipment.findMany({
            where: { available: true },
            select: { title: true, category: true, pricePerDay: true, location: true }
        });
        const contextPrompt = `
      You are an expert Agricultural AI Advisor for AgroRent AI.
      A farmer is asking you for advice: "${prompt}".
      
      CRITICAL INSTRUCTION: You MUST respond in ${language}. Provide the entire response in ${language} to maximize rural accessibility for this farmer.

      Here is a list of currently available equipment on the platform:
      ${JSON.stringify(equipmentList)}
      
      Provide helpful, localized farming advice and recommend specific equipment from the list above if it suits their needs. Keep the response concise, encouraging, and formatted in Markdown.
    `;
        let responseText = '';
        try {
            const response = yield ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contextPrompt,
            });
            responseText = response.text || '';
        }
        catch (modelErr) {
            console.warn('Gemini 2.5 Flash model call failed, falling back to 1.5 Flash:', modelErr.message);
            const fallbackResponse = yield ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: contextPrompt,
            });
            responseText = fallbackResponse.text || '';
        }
        yield prisma_1.prisma.auditLog.create({
            data: {
                actorId: req.prismaUser.id,
                actorRole: req.prismaUser.role,
                action: 'AI_PROMPT_EXECUTED',
                resource: 'AI',
                metadata: JSON.stringify({ prompt, language }),
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            }
        });
        res.json({ reply: responseText });
    }
    catch (error) {
        console.error('AI Advisor Error:', error);
        res.status(500).json({ error: 'Failed to generate AI response', details: error.message || error.toString() });
    }
}));
exports.default = router;
