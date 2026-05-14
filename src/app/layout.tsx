import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Portal Revendedores — Febecos',
  description: 'Acceso exclusivo para revendedores Febecos',
  manifest: '/manifest.json',
  themeColor: '#0a1520',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Febecos Rev',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Febecos Rev" />
        <meta name="theme-color" content="#0a1520" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', background: '#0d1a2a' }}>
        {children}
        <Script id="pwa-register" strategy="afterInteractive">{`
          // Guardar token en localStorage cuando viene en la URL
          (function() {
            try {
              const params = new URLSearchParams(window.location.search);
              const token = params.get('token');
              if (token) {
                localStorage.setItem('febecos-token', token);
              }
            } catch(e) {}
          })();

          // Registrar service worker
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('SW error:', err);
              });
            });
          }
        `}</Script>
      </body>
    </html>
  )
}
