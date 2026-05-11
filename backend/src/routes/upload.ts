import { Router, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { processImage } from '../lib/imageProcessor';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

router.post('/', requireAuth, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Process image (Resize, WebP, Compress)
    const processedBuffer = await processImage(req.file.buffer);
    
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const bucketName = req.body.bucket || 'equipment-images';

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, processedBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      res.status(500).json({ error: 'Failed to upload image to storage' });
      return;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    res.json({ url: publicUrlData.publicUrl });
  } catch (error: any) {
    console.error('Upload Route Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process upload' });
  }
});

export default router;
