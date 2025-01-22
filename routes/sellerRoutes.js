const express = require('express');
const router = express.Router();

const userAuth = require('../middlewares/userAuth');
const adminAuth = require('../middlewares/adminAuth');
const sellerAuth = require('../middlewares/sellerAuth');
const sellerController = require("../controllers/sellerController");

router.route("/sellerSignup").post( sellerController.registerSeller);
router.route("/sellerLogin").post( sellerController.loginSeller);
router.route("/addProductPriceBySeller").post(sellerAuth, sellerController.addProductPrice);
router.route("/changePassword").post(sellerAuth, sellerController.changePassword);
router.route("/forgotPassword").post(sellerController.forgotPassword);
router.route("/verifyOtpAndSetNewPassword").post(sellerController.verifyOtpAndSetNewPassword);

// admin
router.route("/approvedSeller").post(adminAuth, sellerController.approvedSeller);
router.route("/rejectedSeller").post(adminAuth, sellerController.rejectedSeller);

// user
router.route("/getAllProduct").get(sellerController.getAllProducts);
router.route("/getSingleProduct").get(sellerController.singleProducts);
router.route("/purchaseProduct").post(userAuth, sellerController.purchaseProduct);
router.route("/insertToWishlist").post(sellerController.insertToWishlist);
router.route("/getUserWishlist").post(sellerController.getUserWishlist);

module.exports = router;
