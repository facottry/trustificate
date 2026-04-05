const express = require('express');
const router = express.Router();
const c = require('./admin.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// SuperAdminGuard on frontend checks role === 'admin'; accept both admin and super_admin
const sa = [protect, restrictTo('admin', 'super_admin')];

router.get('/super/stats',           ...sa, c.getSuperStats);
router.get('/super/users',           ...sa, c.getSuperUsers);
router.patch('/super/users/:userId/role', ...sa, c.assignRole);
router.get('/super/organizations',   ...sa, c.getSuperOrgs);
router.patch('/super/organizations/:orgId/plan', ...sa, c.changeOrgPlan);
router.get('/super/certificates',    ...sa, c.getSuperCerts);
router.patch('/super/certificates/:certId/status', ...sa, c.setCertStatus);
router.get('/super/templates',       ...sa, c.getSuperTemplates);
router.patch('/super/templates/:templateId', ...sa, c.updateSuperTemplate);
router.get('/super/billing',         ...sa, c.getSuperBilling);
router.get('/super/plans',           ...sa, c.getSuperPlans);
router.get('/super/audit-logs',      ...sa, c.getAuditLogs);

// Legacy
router.post('/log',        protect, c.logAdminAction);
router.get('/user-roles',  protect, c.listUserRoles);

module.exports = router;
