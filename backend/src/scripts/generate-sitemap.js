#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import certificate model
const Certificate = require('../modules/certificate/certificate.schema');

const BASE_URL = process.env.FRONTEND_URL || 'https://trustificate.clicktory.in';

// Static routes with their SEO metadata
const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changefreq: 'weekly' },
  { url: '/about', priority: 0.8, changefreq: 'weekly' },
  { url: '/pricing', priority: 0.8, changefreq: 'weekly' },
  { url: '/contact', priority: 0.8, changefreq: 'weekly' },
  { url: '/terms', priority: 0.8, changefreq: 'monthly' },
  { url: '/privacy', priority: 0.8, changefreq: 'monthly' },
  { url: '/verify', priority: 0.8, changefreq: 'weekly' },
  { url: '/blog', priority: 0.7, changefreq: 'weekly' },
  { url: '/docs', priority: 0.7, changefreq: 'weekly' },
  { url: '/careers', priority: 0.6, changefreq: 'monthly' },
  { url: '/team', priority: 0.6, changefreq: 'monthly' },
  { url: '/testimonials', priority: 0.6, changefreq: 'monthly' },
  { url: '/certificate-generator', priority: 0.7, changefreq: 'monthly' },
  { url: '/bulk-certificate-generator', priority: 0.7, changefreq: 'monthly' },
  { url: '/verify-certificate-online', priority: 0.7, changefreq: 'monthly' },
];

async function generateSitemap() {
  console.log('🚀 Starting sitemap generation...');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Build XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    console.log('📝 Adding static routes...');
    for (const route of STATIC_ROUTES) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${BASE_URL}${route.url}</loc>\n`;
      sitemap += `    <priority>${route.priority}</priority>\n`;
      sitemap += `    <changefreq>${route.changefreq}</changefreq>\n`;
      sitemap += '  </url>\n';
    }

    // Add dynamic certificate routes
    console.log('🔍 Fetching issued certificates...');
    const batchSize = 1000;
    let skip = 0;
    let totalCertificates = 0;

    while (true) {
      const certificates = await Certificate.find({ status: 'issued' })
        .select('certificateNumber updatedAt')
        .skip(skip)
        .limit(batchSize)
        .sort({ updatedAt: -1 });

      if (certificates.length === 0) break;

      console.log(`📄 Processing ${certificates.length} certificates (batch ${Math.floor(skip / batchSize) + 1})`);

      for (const cert of certificates) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${BASE_URL}/verify/${cert.certificateNumber}</loc>\n`;
        sitemap += '    <priority>0.5</priority>\n';
        sitemap += '    <changefreq>never</changefreq>\n';
        sitemap += `    <lastmod>${cert.updatedAt.toISOString()}</lastmod>\n`;
        sitemap += '  </url>\n';
      }

      totalCertificates += certificates.length;
      skip += batchSize;
    }

    sitemap += '</urlset>';

    // Write to frontend public directory
    const frontendPublicDir = path.resolve(__dirname, '../../../documintapp/public');
    const sitemapPath = path.join(frontendPublicDir, 'sitemap.xml');

    // Ensure directory exists
    if (!fs.existsSync(frontendPublicDir)) {
      fs.mkdirSync(frontendPublicDir, { recursive: true });
    }

    fs.writeFileSync(sitemapPath, sitemap, 'utf8');

    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📊 Total URLs: ${STATIC_ROUTES.length + totalCertificates}`);
    console.log(`📁 Written to: ${sitemapPath}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
generateSitemap();