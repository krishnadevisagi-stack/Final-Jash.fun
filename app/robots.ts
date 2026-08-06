import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/privacy', '/terms', '/leaderboard'],
      disallow: ['/celebrate/', '/create', '/api/'],
    },
    sitemap: 'https://jashn.fun/sitemap.xml',
  };
}
