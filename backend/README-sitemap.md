# CLI Sitemap Manager

This script generates a comprehensive XML sitemap for the Trustificate application, including both static marketing pages and dynamic certificate verification URLs.

## Usage

```bash
npm run generate-sitemap
```

## What it does

1. **Connects to MongoDB** using the existing database configuration
2. **Fetches static routes** with appropriate SEO metadata (priority, change frequency)
3. **Queries issued certificates** from the database (status: 'issued')
4. **Generates XML sitemap** compliant with sitemap protocol
5. **Writes to frontend public directory** at `frontend/public/sitemap.xml`

## SEO Configuration

### Static Routes
- **Home (/)**: Priority 1.0, weekly updates
- **Marketing pages** (about, pricing, contact): Priority 0.8, weekly updates
- **Legal pages** (terms, privacy): Priority 0.8, monthly updates
- **Content pages** (blog, docs, careers, team, testimonials): Priority 0.6-0.7, weekly/monthly updates
- **Feature pages** (certificate-generator, bulk-certificate-generator, verify-certificate-online): Priority 0.7, monthly updates

### Dynamic Routes
- **Certificate verification** (`/verify/{certificateNumber}`): Priority 0.5, never changes
- Only includes certificates with `status: 'issued'`
- Uses `lastmod` from certificate's `updatedAt` timestamp

## Environment Variables

- `FRONTEND_URL`: Base URL for the sitemap (default: http://localhost:8080)
- `MONGO_URI`: Database connection string
- `NODE_ENV`: Environment (affects logging)

## Output

The script generates clean, valid XML sitemap at `frontend/public/sitemap.xml` that can be served directly by the frontend.

## CI/CD Integration

Add this command to your deployment pipeline:

```bash
npm run generate-sitemap
```

The script exits with code 0 on success, 1 on failure, making it suitable for automated builds.