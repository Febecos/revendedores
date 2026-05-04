import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal Revendedores — Febecos',
  description: 'Acceso exclusivo para revendedores Febecos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', background: '#f5f5f0' }}>
        {children}
      </body>
    </html>
  )
}
