const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in env!');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Inspecting Supabase Storage...');
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      throw error;
    }
    console.log('Available Storage Buckets:', buckets);

    const hasEquipBucket = buckets.some(b => b.name === 'equipment-images');
    if (!hasEquipBucket) {
      console.log('Bucket "equipment-images" does not exist! Creating it...');
      const { data, error: createError } = await supabaseAdmin.storage.createBucket('equipment-images', {
        public: true,
        allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (createError) {
        throw createError;
      }
      console.log('Bucket "equipment-images" created successfully!', data);
    } else {
      console.log('Bucket "equipment-images" exists and is ready.');
    }
  } catch (err) {
    console.error('Error during Supabase storage check:', err.message || err);
  }
}

main();
