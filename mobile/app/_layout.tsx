import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { useLanguageStore } from '../src/store/languageStore';
import { supabase } from '../src/lib/supabase';
import i18n from '../src/lib/i18n';
import NetworkBoundary from '../src/components/NetworkBoundary';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  const { session, setSession, user } = useAuthStore();
  const { language } = useLanguageStore();
  const { initializeTheme } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Session initialized:', session ? 'User logged in' : 'No user');
        setSession(session);
        setIsReady(true);
      })
      .catch(err => {
        console.error('Supabase initialization failed:', err);
        setIsReady(true); // Fallback to show the app anyway (redirects will handle it)
      });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login';
    const inLanguageGroup = segments[0] === 'language';
    const hasAuth = !!session || !!user;

    setTimeout(() => {
      if (!hasAuth && !inAuthGroup && !inLanguageGroup) {
        // If no auth and not in login/language, go to language first if not set
        router.replace('/language');
      } else if (hasAuth && (inAuthGroup || inLanguageGroup)) {
        router.replace('/(tabs)');
      }
    }, 0);
  }, [session, user, segments, isReady]);

  if (!isReady) return null;

  return (
    <ErrorBoundary>
      <NetworkBoundary>
        <Stack>
          <Stack.Screen name="language" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="equipment/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="saved" options={{ headerShown: false }} />
          <Stack.Screen name="owner/dashboard" options={{ headerShown: false }} />
        </Stack>
      </NetworkBoundary>
    </ErrorBoundary>
  );
}
