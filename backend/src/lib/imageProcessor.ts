import sharp from 'sharp';

export const processImage = async (buffer: Buffer): Promise<Buffer> => {
  return await sharp(buffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
};
