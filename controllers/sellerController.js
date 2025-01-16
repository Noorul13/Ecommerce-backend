const sellerModel = require('../models/seller');
const productModel = require('../models/product');
const userModel = require('../models/user');
const priceLocationModel = require('../models/productLocationPrice');
const orderModel = require('../models/productOrder');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const haversine = require('haversine-distance');

module.exports.registerSeller = async (req, res) => {
    const { sellerName, email, password, address, location } = req.body;
    // console.log(req.body)

    if(!sellerName || !email || !password){
        return res.status(400).json({ message: "All field are required"});
    }
    try{
        const existingSeller = await sellerModel.findOne({email});
        if(existingSeller){
            return res.status(400).json({ message: "User is already register"});
        }

        const hashedPass = await bcrypt.hash(password, 10);

        const seller  = new sellerModel({
            sellerName,
            email,
            password: hashedPass,
            address,
            location
        })
        await seller.save();
        res.status(201).json({ message: "Seller registered successfully", seller});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: error.message});
    }
}

module.exports.loginSeller = async (req, res) => {
    const { email, password } = req.body;
    //console.log(req.body);
    if(!email || !password){
        return res.status(400).json({ message: "All field are required"});
    }
    try {
        const seller = await sellerModel.findOne({ email });
        if (!seller) {
            return res.status(404).json({ message: "Seller is not exist please signup" });
        }
        const isMatch = await bcrypt.compare(password, seller.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: seller._id, role: seller.role }, process.env.SELLER_JWT_SECRET, { expiresIn: '90d' });
        seller.accessToken = token;
        await seller.save();
        res.status(200).json({ suceess: true, message: 'Login successful', seller });
    } catch (error) {
        console.log(error);
        res.status(400).json({success: false, message: error.message});
    }
}

module.exports.approvedSeller = async (req, res) => {
    const { sellerId } = req.body;
    try {
        if (!sellerId) {
            return res.status(400).json({ message: 'Seller ID is required' });
        }
        const seller = await sellerModel.findByIdAndUpdate(sellerId, { isApproved: 'approved' }, { new: true });
        if(!seller){
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.status(200).json({ success: true, message: 'Seller approved successfully', seller });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports.rejectedSeller = async (req, res) => {
    const { sellerId } = req.body;
    try {
        if (!sellerId) {
            return res.status(400).json({ message: 'Seller ID is required' });
        }
        const seller = await sellerModel.findByIdAndUpdate(sellerId, { isApproved: 'rejected' }, { new: true });
        if(!seller){
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.status(200).json({ success: true, message: 'Seller approved successfully', seller });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports.addProductPrice = async (req, res) => {
    try {
      const { productId } = req.body;
      const sellerId = req.sellerId;
  
      const seller = await sellerModel.findById(sellerId);
      if (!seller) {
        return res.status(404).json({ message: "Seller not found." });
      }
  
      const product = await productModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      let finalPrice = 0;
      const productCoordinates = product.location.coordinates;
      const newLocationCoordinates = seller.location.coordinates;
      // console.log(productCoordinates)
      // console.log(newLocationCoordinates)
      
      const distanceInKm = haversine(
        { lat: productCoordinates[1], lon: productCoordinates[0] },
        { lat: newLocationCoordinates[1], lon: newLocationCoordinates[0] }
      ) / 1000; // Convert meters to kilometers

      if (distanceInKm > 500) {
        finalPrice = product.maxPrice; // Use max price
      } else if (distanceInKm <= 100) {
        finalPrice = product.minPrice; // Use min price
      } else {
        const priceIncrement = (product.maxPrice - product.minPrice) * 0.2; // Increase by 20% of the price range
        finalPrice = product.minPrice + priceIncrement;
      }

      if (finalPrice < product.minPrice || finalPrice > product.maxPrice) {
        return res.status(400).json({
          message: `Price must be between ${product.minPrice} and ${product.maxPrice}.`,
        });
      }
  
      // Check if the seller has already set a price for the product
      const existingPrice = await priceLocationModel.findOne({ productId, sellerId });
      if (existingPrice) {
        return res.status(400).json({
          message: "You have already set a price for this product.",
        });
      }
  
      // Create a new price entry
      const priceEntry = new priceLocationModel({
        productId,
        sellerId,
        price: finalPrice,
      });
  
      await priceEntry.save();
  
      return res.status(201).json({
        success: true,
        message: "Price added successfully.",
        priceEntry,
      });
    } catch (error) {
      console.error("Error adding product price:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const query = [
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    pipeline:[
                        {
                            $project:{
                                productName: 1
                            }
                        }
                    ],
                    as: "productDetails",
                }
            },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    pipeline:[
                        {
                            $project:{
                                sellerName: 1,
                                address: 1,
                                location: 1
                            }
                        }
                    ],
                    as: "sellerDetails",
                }
            },
            {
                $unwind: "$productDetails" 
            },

            {
                $match:{}
            },
            {
                $sort: { createdAt: -1 }
            },
        ]

        const result = await priceLocationModel.aggregate(query);
        return res.status(200).json({ success: true, data: result });
      
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({
        message: "Internal server error.",
        error: error.message,
      });
    }
};

exports.singleProducts = async (req, res) => {
    const { productId } = req.body;
    console.log(productId);
    try {
        const query = [
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(productId),
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    pipeline:[
                        {
                            $project:{
                                productName: 1
                            }
                        }
                    ],
                    as: "productDetails",
                }
            },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    pipeline:[
                        {
                            $project:{
                                sellerName: 1,
                                address: 1,
                                location: 1
                            }
                        }
                    ],
                    as: "sellerDetails"
                }
            }
        ]

        const result = await priceLocationModel.aggregate(query);
        console.log(result);
        if (result.length === 0) {
            return res.status(404).json({
              success: false,
              message: "No product found with the given ID.",
            });
        }
        return res.status(200).json({ success: true, data: result});
      
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({
        message: "Internal server error.",
        error: error.message,
      });
    }
};

exports.purchaseProduct = async (req, res) => {
    try {
        const {sellerId, productId, quantityPurchased } = req.body;
        const userId = req.userId;

        const user = await userModel.findById(userId);

        if(user.isBlocked){
            return res.status(400).json({ message: "User is blocked by the admin and product purchase is not allowed" });
        }
        // Find the product by productId
        const product = await productModel.findById(productId);
        console.log(product);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user is allowed to purchase
        if (user.canPurchase !== "ALLOWED") {
            return res.status(403).json({ message: "User is not allowed to make purchases" });
        }

        // Find the priceSeller entry for the product and seller
        const priceSeller = await priceLocationModel.findOne({ 
            productId: productId, 
            sellerId: sellerId 
        });

        if (!priceSeller) {
            return res.status(400).json({ message: 'Product not available with the seller' });
        }

        if (priceSeller.price < product.minPrice || priceSeller.price > product.maxPrice) {
            return res.status(400).json({
                message: 'Seller price is outside the allowed range set by admin'
            });
        }

        if (product.quantity < quantityPurchased) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        product.quantity -= quantityPurchased;
        await product.save();

        // Create an order
        const order = new orderModel({
            productId,
            userId,
            quantity : quantityPurchased
        });
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Purchase successful",
            order: {
                orderId: order._id,
                productId: order.productId,
                userId: order.userId,
                quantity: order.quantity,
                orderPrice: (quantityPurchased*priceSeller.price)
            },
            product: {
                productId: product._id,
                productName: product.productName,
                remainingQuantity: product.quantity
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.insertToWishlist = async (req, res) => {
    const { userId, itemId } = req.query;
    //console.log(userId);
  
    try {
      const user = await userModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.wishlist.includes(itemId)) {
        return res.status(400).json({ message: "Item already in wishlist" });
      }
  
      user.wishlist.push(itemId);

      await user.save();
  
      return res.status(200).json({ success: true, message: "Item added to wishlist", wishlist: user.wishlist });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserWishlist = async (req, res) => {
    const { userId } = req.query;
    try {
        if (userId) {
            const objId = new mongoose.Types.ObjectId(userId);
            const result = await userModel.aggregate([
                {
                    $match: { _id: objId }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "wishlist",
                        foreignField: "_id",
                        as: "wishlistDetails",
                    }
                }
            ])
            return res.status(200).json({ success: true, message: "All wishlist data found", data: result });
        }
        else{
            return res.status(400).json({ success: false, message: "user id is required" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
}