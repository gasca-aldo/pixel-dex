import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Pixel Dex — Your collection',
  description: 'A personal home for your games, consoles, and PC builds.',
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
