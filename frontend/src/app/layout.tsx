import type { Metadata, Viewport } from 'next';
import { Anton, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-mono',
});

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
      className={`light ${anton.variable} ${inter.variable} ${spaceGrotesk.variable}`}
    >
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
