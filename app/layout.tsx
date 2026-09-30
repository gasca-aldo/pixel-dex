import type { Metadata } from 'next';
import './globals.css';
import './landing.css';
export const metadata: Metadata = {
  title: 'Pixel Dex — Your personal gaming journal',
  description: 'Your games. Your hardware. Your journey. Pixel Dex is your personal gaming journal.',
  manifest: '/manifest.webmanifest',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.classList.toggle('dark',localStorage.getItem('pixel-dex-theme')==='dark')}catch{}"}}/>{children}</body>
    </html>
  );
}
