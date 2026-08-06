import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/advisor', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt, language = 'English' } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Fetch all available equipment to give context to Gemini
    const equipmentList = await prisma.equipment.findMany({
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
    });

    await prisma.auditLog.create({
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

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('AI Advisor Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

export default router;
