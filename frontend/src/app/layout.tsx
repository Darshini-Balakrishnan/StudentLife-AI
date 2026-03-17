import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from '@/lib/socket';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StudentLife AI',
  description: 'AI-powered student platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          {children}
          <Toaster position="top-right" />
        </SocketProvider>
      </body>
    </html>
  );
}
