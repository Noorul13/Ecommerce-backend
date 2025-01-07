const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');
const userAuth = require('../middlewares/userAuth');

router.route("/login").post(adminController.adminLogin);
router.route("/changePassword").post(adminAuth, adminController.changePassword);
router.route("/forgotPass").post(adminAuth, adminController.forgotPassword);
router.route("/setPassword").post(adminAuth, adminController.verifyOtpAndSetNewPassword);

module.exports = router;