const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const firebaseAuth = require('../middlewares/firebaseAuth');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/register-admin', firebaseAuth, roleMiddleware(['superadmin']), authController.registerAdmin);
router.get('/admins', firebaseAuth, roleMiddleware(['superadmin']), authController.getAdmins);
router.get('/me', firebaseAuth, authController.getMe);

module.exports = router;
