import Header from '@/shared/components/Header';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { PropsWithChildren } from 'react';
import './globals.css';
import ThemeProvider from './provider/ThemeProvider';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <AppRouterCacheProvider
          options={{
            // Tailwind, CSS Modules 등과 함께 쓸 때 권장: MUI 스타일을 @layer mui 에 넣어줌  [oai_citation:2‡mui.com](https://mui.com/material-ui/integrations/nextjs/?utm_source=chatgpt.com)
            enableCssLayer: true,
          }}
        >
          <ThemeProvider>
            <Header />
            <main className="flex min-h-screen w-full flex-col items-center sm:items-start px-4 sm:px-8 md:px-12 lg:px-16 py-8">
              {children}
            </main>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
