import { z } from 'zod';

const configSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
});

const getConfig = () => {
  const env = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  };

  const result = configSchema.safeParse(env);

  if (!result.success) {
    console.warn('⚠️ Mobile Config Warning:', result.error.format());
    return env as any;
  }

  return result.data;
};

export const config = getConfig();
