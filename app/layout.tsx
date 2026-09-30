import type { Metadata } from 'next';
import './globals.css';
import './landing.css';
export const metadata: Metadata = {
  title: 'Pixel Dex — Your personal gaming journal',
  description: 'Your games. Your hardware. Your journey. Pixel Dex is your personal gaming journal.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{url:'/brand/pixel-dex-app-icon.svg',type:'image/svg+xml'}, {url:'/brand/pixel-dex-app-icon-192.png',sizes:'192x192',type:'image/png'}],
    apple: [{url:'/brand/pixel-dex-apple-touch-icon.png',sizes:'180x180',type:'image/png'}],
  },
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
