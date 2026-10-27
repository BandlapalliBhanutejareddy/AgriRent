const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Testing Supabase REST client (HTTPS)...');
  const { data, error } = await supabase.from('User').select('id, name, email, role');
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('Supabase success! Users:', data);
  }
}

main();
