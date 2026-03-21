const express = require('express');
const router = express.Router();
const controller = require('./subscriber.controller');

/**
 * @swagger
 * tags:
 *   name: Newsletter (Public)
 *   description: Public newsletter subscription and archive endpoints
 */

router.post('/subscribe', controller.subscribe);
router.get('/confirm/:token', controller.confirm);
router.get('/unsubscribe/:email', controller.unsubscribe);
router.get('/:slug', controller.detail);
router.get('/', controller.list);

module.exports = router;
