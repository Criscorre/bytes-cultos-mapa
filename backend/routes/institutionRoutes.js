const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Public routes
router.get('/public', institutionController.getPublicList);
router.get('/public/:id', institutionController.getPublicDetail);

// Admin-only routes
router.get('/admin', authMiddleware, roleMiddleware(['admin', 'superadmin']), institutionController.getAdminList);
router.get('/admin/:id', authMiddleware, roleMiddleware(['admin', 'superadmin']), institutionController.getAdminDetail);
router.put('/admin/:id/status', authMiddleware, roleMiddleware(['admin', 'superadmin']), institutionController.updateStatus);
router.post('/admin/:id/contact', authMiddleware, roleMiddleware(['admin', 'superadmin']), institutionController.addContactHistory);
router.delete('/admin/:id', authMiddleware, roleMiddleware(['admin', 'superadmin']), institutionController.delete);

// Shared route (accessible by institution owner or admin)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'superadmin', 'institution']), institutionController.update);

module.exports = router;
