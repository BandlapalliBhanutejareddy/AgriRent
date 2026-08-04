const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('FarmingGuide').select('*');
  console.log('FarmingGuide data count:', data ? data.length : null);
  if (error) {
    console.error('FarmingGuide error:', error);
  } else {
    console.log('FarmingGuide sample:', data && data.slice(0, 2));
  }

  const { data: tech, error: techError } = await supabase.from('ModernTechnique').select('*');
  console.log('ModernTechnique data count:', tech ? tech.length : null);
  if (techError) {
    console.error('ModernTechnique error:', techError);
  } else {
    console.log('ModernTechnique sample:', tech && tech.slice(0, 2));
  }
}

test();
