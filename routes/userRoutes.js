const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const userauth = require('../middlewares/userAuth');

router.route("/userSignup").post(userController.registerUser);
router.route("/userLogin").post(userController.userLogin);
router.route("/changePassword").post(userauth, userController.changePassword);
router.route("/forgotPass").post(userauth, userController.forgotPassword);
router.route("/setPassword").post(userauth, userController.verifyOtpAndSetNewPassword);

module.exports = router;