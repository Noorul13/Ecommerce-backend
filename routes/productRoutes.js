const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const adminauth = require('../middlewares/adminAuth');
const userauth = require('../middlewares/userAuth');

router.route("/addProduct").post(adminauth, productController.addProduct);
router.route("/updateProduct").put(adminauth, productController.updateProduct);
router.route("/deleteProduct").delete(adminauth, productController.deleteProduct);


router.route("/getSingleProduct").get(productController.getProduct);
router.route("/getAllProduct").get(productController.getAllProducts);

// router.route("/purchaseProductByuser").post(userauth, productController.purchaseProduct);

// order details
router.route("/singleOrderDetails").get(userauth, productController.getOrder);
router.route("/getAllOrder").get(productController.getOrdersList);


module.exports = router;