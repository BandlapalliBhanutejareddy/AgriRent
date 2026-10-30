import { Router, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { processImage } from '../lib/imageProcessor';
import path from 'path';

const router = Router();

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and HEIC are allowed.'));
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension.'));
    }

    // Reject executable content explicitly
    if (ext === '.exe' || ext === '.sh' || ext === '.bat' || ext === '.js') {
      return cb(new Error('Executable files are not allowed.'));
    }

    cb(null, true);
  }
});

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl && !rawSupabaseUrl.includes('placeholder')
  ? rawSupabaseUrl
  : 'https://ezylxyrtnodxthdgynvn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eWx4eXJ0bm9keHRoZGd5bnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDkxMjIsImV4cCI6MjA5MzcyNTEyMn0.hohg6GuliXMQ77e2sdotu79jL0WQkalq0VPe_RkOY58';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const handleUpload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Process image (Resize, WebP, Compress)
    const processedBuffer = await processImage(req.file.buffer);
    
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const isProfileUpload = req.path.includes('profile') || req.originalUrl.includes('profile');
    let bucketName = req.body.bucket || (isProfileUpload ? 'avatars' : 'equipment-images');

    let { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, processedBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    // If initial bucket fails, try fallback bucket
    if (error && bucketName !== 'equipment-images') {
      bucketName = 'equipment-images';
      const fallback = await supabaseAdmin.storage
        .from('equipment-images')
        .upload(fileName, processedBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true,
        });
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
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
};

const uploadMiddleware = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

const normalizeFile = (req: any, res: any, next: any) => {
  if (req.files) {
    req.file = req.files['file']?.[0] || req.files['image']?.[0];
  }
  next();
};

router.post('/', requireAuth, uploadMiddleware, normalizeFile, handleUpload);
router.post('/profile-image', requireAuth, uploadMiddleware, normalizeFile, handleUpload);

export default router;
