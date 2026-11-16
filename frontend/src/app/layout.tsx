import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f8fafc',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ),
  title: {
    default: 'Icon Fitness Gym | Strength & Conditioning in Ashkona, Dhaka',
    template: '%s | Icon Fitness Gym Ashkona',
  },
  description:
    'Icon Fitness Gym in Ashkona, Dakshinkhan, Dhaka, Bangladesh — Strength Training, Free Weights, Cardio, Personal Coaching, Structured Workout Programs & Online Member Portal.',
  keywords: [
    'Icon Fitness Gym',
    'Gym in Ashkona',
    'Gym in Dakshinkhan Dhaka',
    'Fitness Center Ashkona',
    'Strength Training Dhaka',
    'Personal Trainer Ashkona',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    siteName: 'Icon Fitness Gym',
    title: 'Icon Fitness Gym — Ashkona, Dakshinkhan, Dhaka',
    description:
      'Premier strength, conditioning, and personal training facility in Ashkona, Dhaka, Bangladesh.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    name: 'Icon Fitness Gym',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ashkona Main Road',
      addressLocality: 'Dakshinkhan, Dhaka',
      postalCode: '1230',
      addressCountry: 'BD',
    },
    areaServed: ['Ashkona', 'Dakshinkhan', 'Uttara', 'Dhaka'],
  };

  const themeInitScript = `try{var m=localStorage.getItem('ifg_theme_mode');var t=m==='dark'?'dark':'light';var r=document.documentElement;r.setAttribute('data-theme',t);r.classList.remove('dark','light');r.classList.add(t);}catch(e){}`;

  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className="light"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
