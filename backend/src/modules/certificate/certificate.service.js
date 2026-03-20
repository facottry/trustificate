const crypto = require('crypto');
const Certificate = require('./certificate.schema');
const Template = require('../template/template.schema');
const Event = require('../event/event.schema');
const { AppError } = require('../../middlewares/error.middleware');
const usageService = require('../usage/usage.service');
const { ensureBillingCycle } = require('../organization/organization.service');

// Try to load uploadCertificate, but don't crash if unavailable
let uploadCertificate;
try {
  uploadCertificate = require('../../services/cloudflareR2Service').uploadCertificate;
} catch {
  uploadCertificate = null;
}

const generateCertificateNumber = async (prefix = 'CERT') => {
  const candidate = `${prefix.toUpperCase()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
  const exists = await Certificate.findOne({ certificateNumber: candidate });
  if (exists) return generateCertificateNumber(prefix);
  return candidate;
};

const issueCertificate = async (
  { templateId, recipientDetails, pdfUrl, pdfBase64, pdfFileName, status = 'issued' },
  organizationId,
  userId
) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const template = await Template.findOne({ _id: templateId, organizationId });
  if (!template) throw new AppError('Template not found', 404);

  const certificateNumber = await generateCertificateNumber(template.numberPrefix || 'CERT');

  let storedPdfUrl = pdfUrl;
  let pdfKey = null;

  if (!storedPdfUrl && pdfBase64 && pdfFileName && uploadCertificate) {
    const buffer = Buffer.from(pdfBase64, 'base64');
    const uploadResult = await uploadCertificate(buffer, pdfFileName, 'application/pdf');
    storedPdfUrl = uploadResult.url;
    pdfKey = uploadResult.key;
  }

  const certificate = await Certificate.create({
    templateId,
    certificateNumber,
    status,
    pdfUrl: storedPdfUrl,
    pdfKey,
    recipientDetails,
    organizationId,
    createdBy: userId,
  });

  try {
    await Event.create({ certificateId: certificate._id, eventType: 'issued', actorId: userId });
  } catch { /* graceful */ }

  // Increment usage for non-draft certificates
  if (certificate.status !== 'draft') {
    const org = await ensureBillingCycle(certificate.organizationId);
    if (org) {
      await usageService.incrementUsage(org._id, 'certificates_created', org.billingCycleStart, org.billingCycleEnd);
    }
  }

  return certificate;
};

/** Generic create certificate (frontend form) */
const createCertificate = async (data, organizationId, userId) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);

  const certNumber = data.certificateNumber || await generateCertificateNumber(data.numberPrefix || 'CERT');
  const slug = data.slug || certNumber.toLowerCase().replace(/\s+/g, '-');

  const certificate = await Certificate.create({
    templateId: data.templateId,
    certificateNumber: certNumber,
    slug,
    status: data.status || 'issued',
    recipientName: data.recipientName || '',
    recipientEmail: data.recipientEmail || '',
    courseName: data.courseName || '',
    trainingName: data.trainingName || '',
    companyName: data.companyName || '',
    score: data.score || '',
    durationText: data.durationText || '',
    issuerName: data.issuerName || 'TRUSTIFICATE',
    issuerTitle: data.issuerTitle || '',
    issueDate: data.issueDate || new Date(),
    completionDate: data.completionDate || null,
    isExternal: data.isExternal || false,
    originalIssuer: data.originalIssuer || '',
    externalVerificationUrl: data.externalVerificationUrl || '',
    externalPdfUrl: data.externalPdfUrl || '',
    notes: data.notes || '',
    metadataJson: data.metadataJson || {},
    organizationId,
    createdBy: userId,
  });

  if (data.status !== 'draft') {
    try {
      await Event.create({ certificateId: certificate._id, eventType: 'issued', actorId: userId });
    } catch { /* graceful */ }

    // Increment usage for non-draft certificates
    const org = await ensureBillingCycle(certificate.organizationId);
    if (org) {
      await usageService.incrementUsage(org._id, 'certificates_created', org.billingCycleStart, org.billingCycleEnd);
    }
  }

  return certificate;
};

const getCertificateById = async (id) => {
  const cert = await Certificate.findById(id).populate('templateId').lean();
  if (!cert) throw new AppError('Certificate not found', 404);
  return cert;
};

const getCertificateBySlug = async (slug) => {
  const cert = await Certificate.findOne({ slug }).populate('templateId').lean();
  if (!cert) throw new AppError('Certificate not found', 404);
  return cert;
};

const updateCertificate = async (id, data) => {
  const cert = await Certificate.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  if (!cert) throw new AppError('Certificate not found', 404);
  return cert;
};

const listCertificates = async ({ organizationId, page = 1, limit = 20, status, search }) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const filter = { organizationId };
  if (status) filter.status = status;
  if (search) {
    filter['$or'] = [
      { certificateNumber: new RegExp(search, 'i') },
      { recipientName: new RegExp(search, 'i') },
      { recipientEmail: new RegExp(search, 'i') },
      { 'recipientDetails.name': new RegExp(search, 'i') },
    ];
  }
  const skip = (page - 1) * limit;
  const [certificates, total] = await Promise.all([
    Certificate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('templateId', 'title').lean(),
    Certificate.countDocuments(filter),
  ]);
  return { certificates, total };
};

const getCertificateByNumber = async (certificateNumber) => {
  const cert = await Certificate.findOne({ certificateNumber }).populate('templateId').lean();
  if (!cert) throw new AppError('Certificate not found or not issued', 404);
  return cert;
};

const deleteCertificate = async (id, organizationId) => {
  const cert = await Certificate.findOne({ _id: id, organizationId });
  if (!cert) throw new AppError('Certificate not found', 404);
  await Certificate.deleteOne({ _id: id });
  try {
    await Event.deleteMany({ certificateId: id });
  } catch { /* graceful */ }
  return cert;
};

module.exports = {
  issueCertificate,
  createCertificate,
  getCertificateById,
  getCertificateBySlug,
  updateCertificate,
  listCertificates,
  getCertificateByNumber,
  deleteCertificate,
};
