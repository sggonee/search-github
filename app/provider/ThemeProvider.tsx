'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { deepPurple, teal } from '@mui/material/colors';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ReactNode, useMemo } from 'react';

type Props = { children: ReactNode };

export default function AppThemeProvider({ children }: Props) {
  // 시스템 다크 모드 감지
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: deepPurple,
          secondary: teal,
        },
        typography: {
          fontFamily: "-apple-system, 'Noto Sans KR', 'Noto Sans', system-ui, sans-serif",
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
