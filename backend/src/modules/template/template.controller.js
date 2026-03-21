const templateService = require('./template.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

// Try to load R2 upload service
let uploadCertificate;
try {
  uploadCertificate = require('../../services/cloudflareR2Service').uploadCertificate;
} catch { uploadCertificate = null; }

const createTemplate = asyncHandler(async (req, res) => {
  const { name, title, placeholders, isActive, layout, numberPrefix, configuration } = req.body;
  const template = await templateService.createTemplate(
    { name, title, placeholders, isActive, layout, numberPrefix, configuration },
    req.user.organizationId,
    req.user.id
  );
  success(res, template, 'Template created', 201);
});

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listTemplates(req.user.organizationId);
  success(res, templates);
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplate(req.params.id, req.user.organizationId);
  success(res, template);
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplate(req.params.id, req.body, req.user.organizationId);
  success(res, template, 'Template updated');
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.deleteTemplate(req.params.id, req.user.organizationId);
  success(res, null, result.message);
});

const uploadAsset = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  if (!uploadCertificate) throw new Error('Storage service not configured');

  const ext = req.file.originalname.split('.').pop() || 'png';
  const folder = req.query.type === 'seal' ? 'seals' : 'signatures';
  const fileName = `${folder}/${req.user.organizationId}-${Date.now()}.${ext}`;

  const { url } = await uploadCertificate(req.file.buffer, fileName, req.file.mimetype);
  success(res, { url }, 'Asset uploaded');
});

/**
 * Proxy-fetch an image URL through the backend to avoid CORS issues.
 * Returns a data-URI string so the frontend can inline it for html2canvas.
 */
const proxyImageAsBase64 = asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'url query param required' });
  }
  // Only allow proxying from our own R2 bucket domain for security
  const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL || '';
  if (R2_PUBLIC_BASE_URL && !url.startsWith(R2_PUBLIC_BASE_URL)) {
    return res.status(403).json({ success: false, message: 'URL not allowed' });
  }

  const https = require('https');
  const http = require('http');
  const client = url.startsWith('https') ? https : http;

  const buffer = await new Promise((resolve, reject) => {
    client.get(url, (upstream) => {
      if (upstream.statusCode !== 200) return reject(new Error('Upstream ' + upstream.statusCode));
      const chunks = [];
      upstream.on('data', (c) => chunks.push(c));
      upstream.on('end', () => resolve({ buf: Buffer.concat(chunks), ct: upstream.headers['content-type'] || 'image/png' }));
      upstream.on('error', reject);
    }).on('error', reject);
  });

  const dataUri = `data:${buffer.ct};base64,${buffer.buf.toString('base64')}`;
  success(res, { dataUri });
});

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate, uploadAsset, proxyImageAsBase64 };
