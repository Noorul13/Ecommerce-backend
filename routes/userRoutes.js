const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const userauth = require('../middlewares/userAuth');
const { validationMiddleware } = require('../middlewares/validation');
const { registerValidation } = require('../validation/validation');


router.route("/userSignup").post(validationMiddleware(registerValidation), userController.registerUser);
router.route("/userLogin").post(userController.userLogin);
router.route("/userLogout").post(userauth,userController.userLogout);
router.route("/changePassword").post(userauth, userController.changePassword);
router.route("/forgotPass").post(userController.forgotPassword);
router.route("/setPassword").post(userController.verifyOtpAndSetNewPassword);
router.route("/getUser").get(userauth, userController.getUser);
router.route("/updateUser").post(userauth, userController.updateUser);

module.exports = router;