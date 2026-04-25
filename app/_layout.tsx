import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { LanguageProvider, useLanguage } from '../src/context/LanguageContext';
import { WebContainer } from '../src/components/ui/WebContainer';
import { colors } from '../src/theme';

function RootLayoutNav() {
  const { isAuthenticated, isInitializing: authInitializing } = useAuth();
  const { isConfigured, isInitializing: langInitializing } = useLanguage();
  const segments = useSegments();
  const router = useRouter();

  const isInitializing = authInitializing || langInitializing;

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!isAuthenticated) {
      if (!inAuthGroup) router.replace('/(auth)');
    } else if (!isConfigured) {
      // Not yet configured — must complete onboarding before using the app
      if (!inOnboarding) router.replace('/(onboarding)/language-setup');
    } else {
      // Configured — redirect away from auth; allow onboarding (for re-configuration)
      if (inAuthGroup) router.replace('/(tabs)');
    }
  }, [isAuthenticated, isConfigured, isInitializing, segments]);

  // Inject global web styles to remove default browser margins/scrollbars
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          background-color: #F0EFEB;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        * { box-sizing: border-box; }
        input, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, []);

  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <WebContainer>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </WebContainer>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <RootLayoutNav />
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
