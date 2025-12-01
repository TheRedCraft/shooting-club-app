'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import theme from '@/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { RingModeProvider } from '@/contexts/RingModeContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import '../i18n/config';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LanguageProvider>
          <AuthProvider>
            <RingModeProvider>
              {children}
            </RingModeProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

