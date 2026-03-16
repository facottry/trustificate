const crypto = require('crypto');
const Certificate = require('./certificate.schema');
const Template = require('../template/template.schema');
const Event = require('../event/event.schema');
const { AppError } = require('../../middlewares/error.middleware');
const { uploadCertificate } = require('../../services/cloudflareR2Service');

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

  if (!storedPdfUrl && pdfBase64 && pdfFileName) {
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

  await Event.create({ certificateId: certificate._id, eventType: 'issued', actorId: userId });

  return certificate;
};

const listCertificates = async ({ organizationId, page = 1, limit = 20, status, search }) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const filter = { organizationId };
  if (status) filter.status = status;
  if (search) {
    filter['$or'] = [
      { certificateNumber: new RegExp(search, 'i') },
      { 'recipientDetails.name': new RegExp(search, 'i') },
    ];
  }
  const skip = (page - 1) * limit;
  const [certificates, total] = await Promise.all([
    Certificate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Certificate.countDocuments(filter),
  ]);
  return { certificates, total };
};

const getCertificateByNumber = async (certificateNumber) => {
  const cert = await Certificate.findOne({ certificateNumber, status: 'issued' }).lean();
  if (!cert) throw new AppError('Certificate not found or not issued', 404);
  return cert;
};

module.exports = { issueCertificate, listCertificates, getCertificateByNumber };
