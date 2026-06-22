const express = require('express');
const router = express.Router();
const municipalityController = require('../controllers/municipalityController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/metadata', municipalityController.getMetadata);
router.get('/all', municipalityController.getAll);
router.get('/stats', authMiddleware, roleMiddleware(['admin', 'superadmin']), municipalityController.getStats);
router.post('/', authMiddleware, roleMiddleware(['superadmin']), municipalityController.create);

module.exports = router;
