const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const adminauth = require('../middlewares/adminAuth');
const userauth = require('../middlewares/userAuth');

router.route("/addProduct").post(adminauth, productController.addProduct);
router.route("/updateProduct").put(adminauth, productController.updateProduct);
router.route("/deleteProduct").delete(adminauth, productController.deleteProduct);
// router.route("/getSingleProductByadmin").get(adminauth, productController.getProduct);
// router.route("/getAllProductByadmin").get(adminauth, productController.getAllProducts);

router.route("/getSingleProduct").get(userauth, productController.getProduct);
router.route("/getAllProduct").get(userauth, productController.getAllProducts);

router.route("/purchaseProductByuser").post(userauth, productController.purchaseProduct);

module.exports = router;