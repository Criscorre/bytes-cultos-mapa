const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/institutions', authMiddleware, roleMiddleware(['admin', 'superadmin']), reportController.exportInstitutions);
router.get('/social-actions', authMiddleware, roleMiddleware(['admin', 'superadmin']), reportController.exportSocialActions);

module.exports = router;
