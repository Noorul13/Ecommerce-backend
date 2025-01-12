const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');
const userAuth = require('../middlewares/userAuth');

router.route("/login").post(adminController.adminLogin);
router.route("/changePassword").post(adminAuth, adminController.changePassword);
router.route("/forgotPass").post(adminController.forgotPassword);
router.route("/setPassword").post(adminController.verifyOtpAndSetNewPassword);
router.route("/userBlocked").post(adminAuth, adminController.blockUser);
router.route("/userUnBlocked").post(adminAuth, adminController.unblockUser);
router.route("/getAllUser").get(adminAuth, adminController.getAllUsers);
router.route("/getAllBlockedUsers").get(adminAuth, adminController.getAllBlockedUsers);
router.route("/getAllUnBlockedUsers").get(adminAuth, adminController.getAllUnBlockedUsers);


module.exports = router;