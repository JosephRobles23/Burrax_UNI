import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UNI Mobility - Sistema de Gestión Universitaria',
  description: 'Sistema moderno de gestión de movilidad universitaria para la Universidad Nacional de Ingeniería',
  keywords: 'UNI, universidad, movilidad, estudiantes, gestión',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <Toaster 
          theme="dark" 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            },
          }}
        />
      </body>
    </html>
  );
}