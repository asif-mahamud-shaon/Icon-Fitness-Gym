import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const routes = [
    '',
    '/about',
    '/why-icon',
    '/facilities',
    '/membership',
    '/store',
    '/trainers',
    '/programs',
    '/schedule',
    '/gallery',
    '/contact',
    '/login',
    '/register',
    '/privacy-policy',
    '/terms',
    '/cancellation-policy',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/schedule' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}

