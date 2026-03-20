const certificateService = require('./certificate.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

const issueCertificate = asyncHandler(async (req, res) => {
  const { templateId, recipientDetails, pdfUrl, pdfBase64, pdfFileName, status } = req.body;
  const cert = await certificateService.issueCertificate(
    { templateId, recipientDetails, pdfUrl, pdfBase64, pdfFileName, status },
    req.user.organizationId,
    req.user.id
  );
  success(res, cert, 'Certificate issued', 201);
});

/** POST /api/certificates - create certificate from frontend form */
const createCertificate = asyncHandler(async (req, res) => {
  const cert = await certificateService.createCertificate(
    req.body,
    req.body.organizationId || req.user.organizationId,
    req.user.id
  );
  success(res, cert, 'Certificate created', 201);
});

const listCertificates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const result = await certificateService.listCertificates({
    organizationId: req.user.organizationId,
    page: Number(page),
    limit: Number(limit),
    status,
    search,
  });
  // Return flat array for simple listing, or paginated object
  if (req.query.flat === 'true') {
    return success(res, result.certificates);
  }
  success(res, result.certificates);
});

const getCertificateById = asyncHandler(async (req, res) => {
  const cert = await certificateService.getCertificateById(req.params.id);
  success(res, cert);
});

const getCertificateBySlug = asyncHandler(async (req, res) => {
  const cert = await certificateService.getCertificateBySlug(req.params.slug);
  success(res, cert);
});

const updateCertificate = asyncHandler(async (req, res) => {
  const cert = await certificateService.updateCertificate(req.params.id, req.body);
  success(res, cert, 'Certificate updated');
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await certificateService.getCertificateByNumber(req.params.certificateNumber);
  success(res, cert);
});

const deleteCertificate = asyncHandler(async (req, res) => {
  await certificateService.deleteCertificate(req.params.id, req.user.organizationId);
  success(res, null, 'Certificate deleted');
});

module.exports = {
  issueCertificate,
  createCertificate,
  listCertificates,
  getCertificateById,
  getCertificateBySlug,
  updateCertificate,
  verifyCertificate,
  deleteCertificate,
};
