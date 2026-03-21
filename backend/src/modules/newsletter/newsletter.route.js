const express = require('express');
const router = express.Router();
const c = require('./newsletter.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const sa = [protect, restrictTo('admin', 'super_admin')];

router.post('/polish',  ...sa, c.polish);
router.post('/send',    ...sa, c.send);
router.get('/history',  ...sa, c.history);

module.exports = router;
