import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Mentora AI — Your Personal Student Mentor',
  description: 'AI-powered student mentoring MVP',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Mentora AI' },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
