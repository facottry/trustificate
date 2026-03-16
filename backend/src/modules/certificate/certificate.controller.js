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

const listCertificates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const { certificates, total } = await certificateService.listCertificates({
    organizationId: req.user.organizationId,
    page: Number(page),
    limit: Number(limit),
    status,
    search,
  });
  success(res, { certificates, total, page: Number(page), limit: Number(limit) });
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await certificateService.getCertificateByNumber(req.params.certificateNumber);
  success(res, cert);
});

module.exports = { issueCertificate, listCertificates, verifyCertificate };
