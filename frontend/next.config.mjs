/** @type {import('next').NextConfig} */
const nextConfig = (phase) => {
  const isDev = phase === 'phase-development-server';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  let apiOrigin = 'http://localhost:4000';
  try {
    apiOrigin = new URL(apiUrl).origin;
  } catch {}
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const isHttpsSite = siteUrl.startsWith('https://');

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:" + (isDev ? ` ${apiOrigin}` : ''),
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}${isDev ? ' http://localhost:4000 http://127.0.0.1:4000 ws://localhost:3000 ws://127.0.0.1:3000' : ''}`,
    "media-src 'self' blob:",
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const securityHeaders = [
    { key: 'Content-Security-Policy', value: cspDirectives },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
    },
    ...(isHttpsSite
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ]
      : []),
  ];

  return {
    distDir: isDev ? '.next-dev' : '.next',
    reactStrictMode: true,
    compress: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    experimental: {
      optimizePackageImports: ['lucide-react', 'recharts'],
    },
    images: {
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 86400,
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
        {
          protocol: 'https',
          hostname: 'res.cloudinary.com',
        },
      ],
    },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
        {
          source: '/(admin|trainer|member)/:path*',
          headers: [
            ...securityHeaders,
            { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
            { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          ],
        },
      ];
    },
  };
};

export default nextConfig;
