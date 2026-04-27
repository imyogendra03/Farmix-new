const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '..', 'public');
const siteUrl = (process.env.REACT_APP_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const routes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about-us', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/experts', changefreq: 'weekly', priority: '0.9' },
  { path: '/community', changefreq: 'daily', priority: '0.8' },
  { path: '/crop-recommendation', changefreq: 'weekly', priority: '0.9' },
  { path: '/disease-prediction', changefreq: 'weekly', priority: '0.9' },
  { path: '/yield-prediction', changefreq: 'weekly', priority: '0.9' },
  { path: '/weather-monitor', changefreq: 'daily', priority: '0.8' },
  { path: '/market-prediction', changefreq: 'daily', priority: '0.8' },
  { path: '/farm-map', changefreq: 'weekly', priority: '0.7' },
  { path: '/farm-calendar', changefreq: 'weekly', priority: '0.7' },
  { path: '/reviews', changefreq: 'weekly', priority: '0.7' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.4' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.4' }
];

const buildUrl = (routePath) => `${siteUrl}${routePath === '/' ? '' : routePath}`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    ({ path: routePath, changefreq, priority }) => `  <url>
    <loc>${buildUrl(routePath)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Disallow:
Allow: /

Sitemap: ${buildUrl('/sitemap.xml')}
`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');
