import { supabase } from '../../lib/supabase';
import { prisma } from '../../lib/prisma';

export class AuthService {
  static async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(error?.message || 'Invalid credentials');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { authId: data.user.id },
          { email }
        ]
      }
    });

    return { token: data.session?.access_token, user, session: data.session };
  }

  static async register(data: { name: string; email: string; password: string; role: 'FARMER' | 'OWNER'; phone?: string }) {
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, role: data.role }
    });

    if (error) throw new Error(error.message);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: 'SUPABASE_AUTH_MANAGED',
        role: data.role,
        phone: data.phone || '',
        authId: authData.user?.id,
        isVerified: true
      }
    });

    return user;
  }
}
