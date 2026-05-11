const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const prisma = new PrismaClient();

async function main() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const email = 'owner@agrorent.com';
  const password = 'password123';
  const name = 'Suresh (Owner)';
  const phone = '+919876543211';

  console.log(`Creating user ${email}...`);

  // 1. Create Supabase Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists in Supabase Auth.');
    } else {
      console.error('Error creating auth user:', authError);
      return;
    }
  } else {
    console.log('Supabase Auth user created:', authData.user.id);
  }

  // 2. Get the user ID (either from create or by searching)
  let authId;
  if (authData?.user) {
    authId = authData.user.id;
  } else {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);
    authId = user?.id;
  }

  if (!authId) {
    console.error('Could not find Auth ID for user.');
    return;
  }

  // 3. Sync with Prisma
  const user = await prisma.user.upsert({
    where: { phone },
    update: { authId, email, name, role: 'OWNER' },
    create: { authId, email, phone, name, role: 'OWNER' }
  });

  console.log('User synced in Prisma:', user);
  console.log('\n--- SUCCESS ---');
  console.log('Email:', email);
  console.log('Password:', password);
}

main().catch(console.error).finally(() => prisma.$disconnect());
