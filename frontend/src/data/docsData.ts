export interface DocPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  order: number;
  content: string;
}

const BASE_URL = "https://trustificate.clicktory.in";

export const docPages: DocPage[] = [
  {
    slug: "introduction",
    title: "Introduction",
    metaTitle: "TRUSTIFICATE API Documentation | Introduction",
    metaDescription: "Get started with the TRUSTIFICATE API. Learn how to generate, manage, and verify digital certificates programmatically.",
    category: "Getting Started",
    order: 1,
    content: `
# Introduction

TRUSTIFICATE provides a RESTful API that lets you programmatically create, manage, and verify digital certificates at scale.

## What You Can Do

- **Generate certificates** from templates with dynamic recipient data
- **Bulk generate** hundreds or thousands of certificates in a single request
- **Verify certificates** using certificate numbers or slugs
- **Manage templates** – create, update, and list your certificate templates
- **Track events** – monitor certificate views, downloads, and verification attempts
- **Webhooks** – receive real-time notifications when certificates are issued or verified

## Base URL

All API requests are made to:

\`\`\`
${BASE_URL}/api/v1
\`\`\`

## Content Type

All requests must include:

\`\`\`
Content-Type: application/json
\`\`\`

## Rate Limits

| Plan       | Requests/min | Certificates/month |
|------------|-------------|---------------------|
| Free       | 10          | 50                  |
| Starter    | 60          | 500                 |
| Pro        | 300         | 5,000               |
| Enterprise | Custom      | Unlimited           |

## Need Help?

- **Email**: api-support@TRUSTIFICATE.app
- **Status Page**: status.TRUSTIFICATE.app
- **Community**: Join our developer Discord
`,
  },
  {
    slug: "getting-started",
    title: "Getting Started",
    metaTitle: "Getting Started with TRUSTIFICATE API | Quick Start Guide",
    metaDescription: "Quick start guide for the TRUSTIFICATE API. Generate your first certificate in under 5 minutes with step-by-step instructions.",
    category: "Getting Started",
    order: 2,
    content: `
# Getting Started

Generate your first certificate in under 5 minutes.

## Step 1: Create an Account

Sign up at [trustificate.clicktory.in/signup](/signup) and complete email verification.

## Step 2: Generate an API Key

Navigate to **Settings → Developers → API Keys** and click **Create API Key**.

Choose:
- **Development** – for testing (prefixed with \`pk_test_\`)
- **Production** – for live usage (prefixed with \`pk_live_\`)

> ⚠️ Copy your key immediately. It won't be shown again.

## Step 3: Create a Template

Before generating certificates, create a template via the dashboard or API:

\`\`\`bash
curl -X POST ${BASE_URL}/api/v1/templates \\
  -H "Authorization: Bearer pk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Course Completion",
    "body_text": "This certifies that {{recipient_name}} completed {{course_name}}.",
    "number_prefix": "CC",
    "placeholders": ["recipient_name", "course_name", "completion_date"]
  }'
\`\`\`

## Step 4: Issue a Certificate

\`\`\`bash
curl -X POST ${BASE_URL}/api/v1/certificates \\
  -H "Authorization: Bearer pk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tpl_23423",
    "recipient_name": "Rahul Sharma",
    "recipient_email": "rahul@example.com",
    "course_name": "AI Bootcamp",
    "issue_date": "2026-03-01"
  }'
\`\`\`

**Response:**

\`\`\`json
{
  "certificate_id": "CERT-2026-A1B2C3D4-E5F6",
  "certificate_number": "CC-2026-A1B2C3D4-E5F6",
  "verification_url": "${BASE_URL}/certificate/cc-2026-a1b2c3d4-e5f6",
  "pdf_url": "${BASE_URL}/storage/certificate-pdfs/cc-2026-a1b2c3d4-e5f6.pdf",
  "status": "issued"
}
\`\`\`

## Step 5: Verify

Share the verification URL or certificate number. Anyone can verify at [/verify](/verify).

## Next Steps

- [Authentication](/docs/authentication) – learn about API key security
- [Create Certificate](/docs/create-certificate) – full endpoint reference
- [Bulk Generation](/docs/bulk-certificate-generation) – issue at scale
`,
  },
  {
    slug: "authentication",
    title: "Authentication",
    metaTitle: "API Authentication | TRUSTIFICATE Developer Docs",
    metaDescription: "Learn how to authenticate with the TRUSTIFICATE API using API keys. Understand key types, scopes, and security best practices.",
    category: "Getting Started",
    order: 3,
    content: `
# Authentication

All API requests require authentication via API keys passed in the \`Authorization\` header.

## API Key Types

| Type        | Prefix      | Use Case                        |
|-------------|-------------|----------------------------------|
| Development | \`pk_test_\` | Testing & development            |
| Production  | \`pk_live_\` | Live certificate issuance        |

## Using Your API Key

Include your key in the Authorization header:

\`\`\`bash
curl -X GET ${BASE_URL}/api/v1/templates \\
  -H "Authorization: Bearer pk_live_your_api_key_here"
\`\`\`

## Key Permissions

When creating an API key, you can scope it to specific operations:

| Permission              | Description                          |
|------------------------|--------------------------------------|
| \`certificate:create\`  | Generate new certificates            |
| \`certificate:read\`    | View certificate details             |
| \`certificate:verify\`  | Verify certificate authenticity      |
| \`template:manage\`     | Create, update, delete templates     |
| \`webhook:manage\`      | Configure webhook endpoints          |

## Security Best Practices

1. **Never expose keys in client-side code** – API keys should only be used server-side
2. **Use development keys for testing** – avoid using production keys in development
3. **Rotate keys regularly** – revoke and regenerate keys periodically
4. **Set minimum permissions** – only grant the permissions your integration needs
5. **Monitor usage** – check the API key logs in Settings for unusual activity

## Revoking Keys

Revoke a compromised key immediately from **Settings → Developers → API Keys**. Revoked keys return \`401 Unauthorized\` on all requests.

## Error Responses

\`\`\`json
{
  "error": "unauthorized",
  "message": "Invalid or expired API key",
  "status": 401
}
\`\`\`
`,
  },
  {
    slug: "api-keys",
    title: "API Keys",
    metaTitle: "Managing API Keys | TRUSTIFICATE Developer Docs",
    metaDescription: "Create, manage, and rotate API keys for the TRUSTIFICATE API. Learn about key types, permissions, and security practices.",
    category: "Getting Started",
    order: 4,
    content: `
# API Keys

Manage your API keys from the TRUSTIFICATE dashboard under **Settings → Developers → API Keys**.

## Creating a Key

\`\`\`bash
POST /api/v1/api-keys

{
  "name": "My Integration",
  "type": "production",
  "permissions": [
    "certificate:create",
    "certificate:read",
    "certificate:verify"
  ]
}
\`\`\`

**Response:**

\`\`\`json
{
  "id": "key_abc123",
  "name": "My Integration",
  "key": "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxx",
  "type": "production",
  "permissions": ["certificate:create", "certificate:read", "certificate:verify"],
  "created_at": "2026-03-01T00:00:00Z",
  "last_used_at": null
}
\`\`\`

> ⚠️ The full key is only returned once at creation. Store it securely.

## Listing Keys

\`\`\`bash
GET /api/v1/api-keys
\`\`\`

Returns all keys with masked values (e.g., \`pk_live_xxxx...xxxx\`).

## Revoking a Key

\`\`\`bash
DELETE /api/v1/api-keys/:id
\`\`\`

Revoked keys immediately stop working. This action cannot be undone.

## Regenerating a Key

\`\`\`bash
POST /api/v1/api-keys/:id/regenerate
\`\`\`

Generates a new key value while preserving the key name and permissions. The old key is immediately revoked.

## Key Usage Logs

View usage statistics for each key:

\`\`\`bash
GET /api/v1/api-keys/:id/usage?period=30d
\`\`\`

\`\`\`json
{
  "total_requests": 1247,
  "certificates_created": 892,
  "verifications": 355,
  "errors": 12,
  "period": "30d"
}
\`\`\`
`,
  },
  {
    slug: "create-certificate",
    title: "Create Certificate",
    metaTitle: "Create Certificate API | TRUSTIFICATE Developer Docs",
    metaDescription: "Full API reference for creating certificates with the TRUSTIFICATE API. Includes request/response examples, field descriptions, and error handling.",
    category: "API Reference",
    order: 5,
    content: `
# Create Certificate

Issue a new certificate using a template.

## Endpoint

\`\`\`
POST /api/v1/certificates
\`\`\`

## Request Body

| Field              | Type   | Required | Description                            |
|--------------------|--------|----------|----------------------------------------|
| \`template_id\`     | string | Yes      | Template ID to use                     |
| \`recipient_name\`  | string | Yes      | Full name of the recipient             |
| \`recipient_email\` | string | No       | Email for delivery                     |
| \`course_name\`     | string | No       | Course or program name                 |
| \`training_name\`   | string | No       | Training program name                  |
| \`company_name\`    | string | No       | Recipient's company                    |
| \`completion_date\` | string | No       | Date of completion (YYYY-MM-DD)        |
| \`issue_date\`      | string | No       | Date of issue (defaults to today)      |
| \`score\`           | string | No       | Score or grade achieved                |
| \`duration_text\`   | string | No       | Duration (e.g., "16 hours")            |
| \`issuer_name\`     | string | No       | Name of the issuer                     |
| \`issuer_title\`    | string | No       | Title of the issuer                    |
| \`metadata\`        | object | No       | Custom key-value pairs                 |

## Example Request

\`\`\`bash
curl -X POST ${BASE_URL}/api/v1/certificates \\
  -H "Authorization: Bearer pk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tpl_23423",
    "recipient_name": "Rahul Sharma",
    "recipient_email": "rahul@example.com",
    "course_name": "AI Bootcamp",
    "completion_date": "2026-03-01",
    "score": "95%",
    "issuer_name": "Dr. Priya Mehta",
    "issuer_title": "Program Director"
  }'
\`\`\`

## Response

\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "certificate_number": "CC-2026-A1B2C3D4-E5F6",
  "slug": "cc-2026-a1b2c3d4-e5f6",
  "recipient_name": "Rahul Sharma",
  "status": "issued",
  "verification_url": "${BASE_URL}/certificate/cc-2026-a1b2c3d4-e5f6",
  "pdf_url": "${BASE_URL}/storage/certificate-pdfs/cc-2026-a1b2c3d4-e5f6.pdf",
  "issue_date": "2026-03-01",
  "created_at": "2026-03-01T12:00:00Z"
}
\`\`\`

## Status Codes

| Code | Description                              |
|------|------------------------------------------|
| 201  | Certificate created successfully         |
| 400  | Invalid request body                     |
| 401  | Unauthorized – invalid API key           |
| 404  | Template not found                       |
| 429  | Rate limit exceeded                      |
`,
  },
  {
    slug: "bulk-certificate-generation",
    title: "Bulk Generation",
    metaTitle: "Bulk Certificate Generation API | TRUSTIFICATE Developer Docs",
    metaDescription: "Generate hundreds of certificates in a single API call. Learn about batch processing, CSV upload, and async generation with the TRUSTIFICATE API.",
    category: "API Reference",
    order: 6,
    content: `
# Bulk Certificate Generation

Generate multiple certificates in a single request.

## Endpoint

\`\`\`
POST /api/v1/certificates/bulk
\`\`\`

## Request Body

| Field          | Type   | Required | Description                        |
|----------------|--------|----------|------------------------------------|
| \`template_id\` | string | Yes      | Template to use for all certs      |
| \`recipients\`  | array  | Yes      | Array of recipient objects         |
| \`notify\`      | bool   | No       | Send email notifications (false)   |

## Example Request

\`\`\`bash
curl -X POST ${BASE_URL}/api/v1/certificates/bulk \\
  -H "Authorization: Bearer pk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tpl_23423",
    "notify": true,
    "recipients": [
      {
        "recipient_name": "Rahul Sharma",
        "recipient_email": "rahul@example.com",
        "course_name": "AI Bootcamp"
      },
      {
        "recipient_name": "Priya Patel",
        "recipient_email": "priya@example.com",
        "course_name": "AI Bootcamp"
      },
      {
        "recipient_name": "James Lee",
        "recipient_email": "james@example.com",
        "course_name": "AI Bootcamp"
      }
    ]
  }'
\`\`\`

## Response

\`\`\`json
{
  "batch_id": "batch_abc123",
  "total": 3,
  "status": "processing",
  "certificates": [
    {
      "recipient_name": "Rahul Sharma",
      "certificate_number": "CC-2026-A1B2C3D4-E5F6",
      "status": "issued"
    },
    {
      "recipient_name": "Priya Patel",
      "certificate_number": "CC-2026-B2C3D4E5-F6A7",
      "status": "issued"
    },
    {
      "recipient_name": "James Lee",
      "certificate_number": "CC-2026-C3D4E5F6-A7B8",
      "status": "issued"
    }
  ]
}
\`\`\`

## CSV Upload

Alternatively, upload a CSV file:

\`\`\`bash
curl -X POST ${BASE_URL}/api/v1/certificates/bulk/csv \\
  -H "Authorization: Bearer pk_live_xxxxx" \\
  -F "template_id=tpl_23423" \\
  -F "file=@recipients.csv"
\`\`\`

**CSV Format:**

\`\`\`csv
recipient_name,recipient_email,course_name,completion_date
Rahul Sharma,rahul@example.com,AI Bootcamp,2026-03-01
Priya Patel,priya@example.com,AI Bootcamp,2026-03-01
\`\`\`

## Limits

| Plan       | Max per batch |
|------------|--------------|
| Free       | 10           |
| Starter    | 100          |
| Pro        | 1,000        |
| Enterprise | 10,000       |

## Checking Batch Status

\`\`\`
GET /api/v1/certificates/bulk/:batch_id
\`\`\`
`,
  },
  {
    slug: "verify-certificate",
    title: "Verify Certificate",
    metaTitle: "Verify Certificate API | TRUSTIFICATE Developer Docs",
    metaDescription: "Programmatically verify certificate authenticity using the TRUSTIFICATE API. Check certificate status, details, and history.",
    category: "API Reference",
    order: 7,
    content: `
# Verify Certificate

Programmatically verify a certificate's authenticity and retrieve its details.

## Endpoint

\`\`\`
GET /api/v1/certificates/verify/:certificate_number
\`\`\`

## Example Request

\`\`\`bash
curl -X GET ${BASE_URL}/api/v1/certificates/verify/CC-2026-A1B2C3D4-E5F6 \\
  -H "Authorization: Bearer pk_live_xxxxx"
\`\`\`

## Response – Valid Certificate

\`\`\`json
{
  "valid": true,
  "certificate": {
    "certificate_number": "CC-2026-A1B2C3D4-E5F6",
    "recipient_name": "Rahul Sharma",
    "course_name": "AI Bootcamp",
    "issue_date": "2026-03-01",
    "status": "issued",
    "issuer_name": "Dr. Priya Mehta",
    "issuer_title": "Program Director",
    "organization": "LearnHub Academy",
    "verification_url": "${BASE_URL}/certificate/cc-2026-a1b2c3d4-e5f6"
  }
}
\`\`\`

## Response – Revoked Certificate

\`\`\`json
{
  "valid": false,
  "certificate": {
    "certificate_number": "CC-2026-A1B2C3D4-E5F6",
    "status": "revoked",
    "revoked_at": "2026-04-15T10:30:00Z",
    "reason": "Certificate issued in error"
  }
}
\`\`\`

## Response – Not Found

\`\`\`json
{
  "valid": false,
  "error": "certificate_not_found",
  "message": "No certificate found with the given number"
}
\`\`\`

## Public Verification (No Auth Required)

For embedding verification in your own website, use the public endpoint:

\`\`\`
GET /api/v1/public/verify/:certificate_number
\`\`\`

This returns limited information (name, course, status, date) without requiring an API key.

## QR Code Verification

Every certificate includes a QR code that links to its public verification page:

\`\`\`
${BASE_URL}/certificate/:slug
\`\`\`

Scanning the QR code opens the verification page with full certificate details and a trust badge.
`,
  },
  {
    slug: "webhooks",
    title: "Webhooks",
    metaTitle: "Webhooks | TRUSTIFICATE Developer Docs",
    metaDescription: "Set up webhooks to receive real-time notifications when certificates are issued, verified, or revoked in TRUSTIFICATE.",
    category: "Advanced",
    order: 8,
    content: `
# Webhooks

Receive real-time HTTP notifications when events occur in your TRUSTIFICATE account.

## Setting Up Webhooks

### Via Dashboard

Navigate to **Settings → Developers → Webhooks** and add an endpoint URL.

### Via API

\`\`\`bash
curl -X POST ${BASE_URL}/api/v1/webhooks \\
  -H "Authorization: Bearer pk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks/TRUSTIFICATE",
    "events": ["certificate.issued", "certificate.verified", "certificate.revoked"],
    "secret": "whsec_your_signing_secret"
  }'
\`\`\`

## Event Types

| Event                    | Trigger                                |
|--------------------------|----------------------------------------|
| \`certificate.issued\`    | A new certificate is created           |
| \`certificate.verified\`  | Someone verifies a certificate         |
| \`certificate.revoked\`   | A certificate is revoked               |
| \`certificate.downloaded\`| Certificate PDF is downloaded          |
| \`batch.completed\`       | A bulk generation batch completes      |

## Webhook Payload

\`\`\`json
{
  "id": "evt_abc123",
  "type": "certificate.issued",
  "created_at": "2026-03-01T12:00:00Z",
  "data": {
    "certificate_id": "550e8400-e29b-41d4-a716-446655440000",
    "certificate_number": "CC-2026-A1B2C3D4-E5F6",
    "recipient_name": "Rahul Sharma",
    "status": "issued"
  }
}
\`\`\`

## Verifying Webhook Signatures

Every webhook includes an \`X-TRUSTIFICATE-Signature\` header. Verify it using your webhook secret:

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
\`\`\`

## Retry Policy

Failed deliveries (non-2xx responses) are retried up to 5 times with exponential backoff:

| Attempt | Delay     |
|---------|-----------|
| 1       | 1 minute  |
| 2       | 5 minutes |
| 3       | 30 minutes|
| 4       | 2 hours   |
| 5       | 24 hours  |
`,
  },
  {
    slug: "sdk-examples",
    title: "SDK & Examples",
    metaTitle: "SDK & Code Examples | TRUSTIFICATE Developer Docs",
    metaDescription: "Code examples for integrating TRUSTIFICATE in JavaScript, Python, PHP, and cURL. Copy-paste snippets to get started quickly.",
    category: "Advanced",
    order: 9,
    content: `
# SDK & Code Examples

Integrate TRUSTIFICATE into your application using these examples.

## JavaScript / Node.js

\`\`\`javascript
const TRUSTIFICATE_API_KEY = process.env.TRUSTIFICATE_API_KEY;
const BASE_URL = '${BASE_URL}/api/v1';

// Issue a certificate
async function issueCertificate(data) {
  const response = await fetch(\`\${BASE_URL}/certificates\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TRUSTIFICATE_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Usage
const cert = await issueCertificate({
  template_id: 'tpl_23423',
  recipient_name: 'Rahul Sharma',
  recipient_email: 'rahul@example.com',
  course_name: 'AI Bootcamp',
  issue_date: '2026-03-01',
});

console.log(cert.verification_url);
\`\`\`

## Python

\`\`\`python
import requests

API_KEY = "pk_live_xxxxx"
BASE_URL = "${BASE_URL}/api/v1"

def issue_certificate(data):
    response = requests.post(
        f"{BASE_URL}/certificates",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json=data,
    )
    return response.json()

# Usage
cert = issue_certificate({
    "template_id": "tpl_23423",
    "recipient_name": "Rahul Sharma",
    "course_name": "AI Bootcamp",
    "issue_date": "2026-03-01",
})

print(cert["verification_url"])
\`\`\`

## PHP

\`\`\`php
<?php
$apiKey = 'pk_live_xxxxx';
$baseUrl = '${BASE_URL}/api/v1';

function issueCertificate($data) {
    global $apiKey, $baseUrl;
    
    $ch = curl_init("$baseUrl/certificates");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json",
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$cert = issueCertificate([
    'template_id' => 'tpl_23423',
    'recipient_name' => 'Rahul Sharma',
    'course_name' => 'AI Bootcamp',
]);

echo $cert['verification_url'];
\`\`\`

## Webhook Handler (Express.js)

\`\`\`javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.post('/webhooks/TRUSTIFICATE', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-TRUSTIFICATE-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  
  switch (event.type) {
    case 'certificate.issued':
      console.log('New certificate:', event.data.certificate_number);
      break;
    case 'certificate.verified':
      console.log('Certificate verified:', event.data.certificate_number);
      break;
  }

  res.status(200).send('OK');
});
\`\`\`
`,
  },
  {
    slug: "errors",
    title: "Error Reference",
    metaTitle: "API Error Reference | TRUSTIFICATE Developer Docs",
    metaDescription: "Complete reference of TRUSTIFICATE API error codes, messages, and troubleshooting steps. Handle errors gracefully in your integration.",
    category: "Advanced",
    order: 10,
    content: `
# Error Reference

All API errors return a consistent JSON structure.

## Error Format

\`\`\`json
{
  "error": "error_code",
  "message": "Human-readable description",
  "status": 400,
  "details": {}
}
\`\`\`

## HTTP Status Codes

| Code | Meaning               | Common Cause                           |
|------|-----------------------|----------------------------------------|
| 400  | Bad Request           | Invalid or missing request body fields |
| 401  | Unauthorized          | Missing or invalid API key             |
| 403  | Forbidden             | API key lacks required permissions     |
| 404  | Not Found             | Resource doesn't exist                 |
| 409  | Conflict              | Duplicate certificate number           |
| 422  | Unprocessable Entity  | Validation error (e.g., invalid email) |
| 429  | Too Many Requests     | Rate limit exceeded                    |
| 500  | Internal Server Error | Unexpected server error                |

## Error Codes

### Authentication Errors

| Code                    | Message                                  |
|-------------------------|------------------------------------------|
| \`unauthorized\`         | Invalid or expired API key               |
| \`forbidden\`            | Insufficient permissions for this action |
| \`key_revoked\`          | This API key has been revoked            |

### Validation Errors

| Code                    | Message                                  |
|-------------------------|------------------------------------------|
| \`missing_field\`        | Required field is missing                |
| \`invalid_format\`       | Field value has wrong format             |
| \`invalid_template\`     | Template ID does not exist               |
| \`invalid_date\`         | Date must be in YYYY-MM-DD format        |

### Resource Errors

| Code                    | Message                                  |
|-------------------------|------------------------------------------|
| \`not_found\`            | Resource not found                       |
| \`template_inactive\`    | Template is not active                   |
| \`certificate_revoked\`  | Certificate has been revoked             |

### Rate Limit Errors

| Code                    | Message                                  |
|-------------------------|------------------------------------------|
| \`rate_limited\`         | Too many requests, retry after X seconds |
| \`quota_exceeded\`       | Monthly certificate quota exceeded       |

## Handling Errors

\`\`\`javascript
try {
  const response = await fetch('/api/v1/certificates', { ... });
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (error.status) {
      case 401:
        // Re-authenticate or check API key
        break;
      case 429:
        // Wait and retry with exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        await sleep(retryAfter * 1000);
        break;
      case 422:
        // Fix validation errors
        console.log('Validation errors:', error.details);
        break;
      default:
        console.error('API error:', error.message);
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
\`\`\`

## Need Help?

If you encounter persistent errors, contact [api-support@TRUSTIFICATE.app](mailto:api-support@TRUSTIFICATE.app) with:

- Your request payload
- The full error response
- Your API key ID (not the key itself)
- Timestamp of the request
`,
  },
];

export const docCategories = ["Getting Started", "API Reference", "Advanced"];

export function getDocNavigation() {
  return docCategories.map((cat) => ({
    category: cat,
    pages: docPages
      .filter((p) => p.category === cat)
      .sort((a, b) => a.order - b.order),
  }));
}

