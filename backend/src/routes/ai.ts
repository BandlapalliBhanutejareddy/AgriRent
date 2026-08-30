import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { aiProvider } from '../services/aiProvider';

const router = Router();

router.post('/advisor', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt, language = 'English' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Fetch all available equipment to give context to AI
    const equipmentList = await prisma.equipment.findMany({
      where: { available: true },
      select: { title: true, category: true, pricePerDay: true, location: true }
    });

    const responseText = await aiProvider.getAdvisorAdvice(prompt, language, equipmentList);

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

    res.json({ reply: responseText });
  } catch (error: any) {
    console.error('AI Advisor Error:', error);
    res.status(503).json({ error: 'AI Advisor is currently unavailable.', details: error.message || error.toString() });
  }
});

export default router;
