import { supabase } from '../src/lib/supabase';
import { prisma } from '../src/lib/prisma';

async function reset() {
  const accounts = [
    { email: 'farmer.live@agrorent.ai', role: 'FARMER', name: 'Ramesh Patel', phone: '+919876543001' },
    { email: 'owner.live@agrorent.ai', role: 'OWNER', name: 'Suresh Reddy', phone: '+919876543002' },
    { email: 'admin.live@agrorent.ai', role: 'ADMIN', name: 'Admin Live', phone: '+919876543003' },
    { email: 'farmer.demo@agrorent.ai', role: 'FARMER', name: 'Ramesh Patel', phone: '+919876543001' },
    { email: 'owner.demo@agrorent.ai', role: 'OWNER', name: 'Suresh Reddy', phone: '+919876543002' },
    { email: 'admin.demo@agrorent.ai', role: 'ADMIN', name: 'Admin Demo', phone: '+919876543003' },
  ];

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const existingUsers = usersData?.users || [];

  for (const acc of accounts) {
    const found = existingUsers.find(u => u.email?.toLowerCase() === acc.email.toLowerCase());
    let authId = '';
    if (found) {
      console.log(`Updating password for ${acc.email}...`);
      await supabase.auth.admin.updateUserById(found.id, {
        password: 'Password123!',
        user_metadata: { name: acc.name, role: acc.role, phone: acc.phone }
      });
      authId = found.id;
    } else {
      console.log(`Creating user in Supabase auth: ${acc.email}...`);
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { name: acc.name, role: acc.role, phone: acc.phone }
      });
      if (error) {
        console.error(`Error creating ${acc.email}:`, error.message);
      }
      authId = created?.user?.id || '';
    }

    // Also sync in prisma DB
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        name: acc.name,
        role: acc.role as any,
        phone: acc.phone,
        authId: authId || undefined,
        isVerified: true
      },
      create: {
        email: acc.email,
        name: acc.name,
        role: acc.role as any,
        phone: acc.phone,
        authId: authId || undefined,
        password: 'SUPABASE_AUTH_MANAGED',
        isVerified: true
      }
    });
    console.log(`Synced user ${acc.email} in DB.`);
  }
}

reset()
  .then(() => {
    console.log('ALL PASSWORDS AND USERS SET TO Password123!');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
