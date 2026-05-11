import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import ThemeProvider from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgroRent Admin Dashboard',
  description: 'Manage your farm equipment and bookings',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100`}>
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
