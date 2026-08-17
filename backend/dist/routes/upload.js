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
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const supabase_js_1 = require("@supabase/supabase-js");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const imageProcessor_1 = require("../lib/imageProcessor");
const router = (0, express_1.Router)();
const path_1 = __importDefault(require("path"));
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and HEIC are allowed.'));
        }
        // Check extension
        const ext = path_1.default.extname(file.originalname).toLowerCase();
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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
router.post('/', authMiddleware_1.requireAuth, upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }
        // Process image (Resize, WebP, Compress)
        const processedBuffer = yield (0, imageProcessor_1.processImage)(req.file.buffer);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
        const bucketName = req.body.bucket || 'equipment-images';
        const { data, error } = yield supabaseAdmin.storage
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
    }
    catch (error) {
        console.error('Upload Route Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process upload' });
    }
}));
exports.default = router;
