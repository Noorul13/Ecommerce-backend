const productModel = require('../models/product');
const userModel = require('../models/user');
const orderModel = require('../models/productOrder');
const mongoose = require('mongoose');

// Controller to add a product
exports.addProduct = async (req, res) => {
    try {
        const { productName, productType, quantity, minPrice, maxPrice } = req.body;

        // Validate input
        if (!productName || !productType || !minPrice || !maxPrice) {
            return res.status(400).json({ message: "Product name, type, and cost are required." });
        }

        // Create a new product
        const newProduct = new productModel({
            productName,
            productType,
            quantity: quantity || 0, // Default quantity to 0 if not provided
            minPrice,
            maxPrice
        });

        // Save to the database
        const savedProduct = await newProduct.save();

        return res.status(201).json({ success: true, message: "Product added successfully.", product: savedProduct });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// update product
exports.updateProduct = async (req, res) => {
    const { productId } = req.query; // Get the productId from the URL parameter
    const { productName, productType, quantity, price } = req.body; // Get the updated data from the request body

    try {
        // Find the product by its ID and update it
        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            {
                productName,
                productType,
                quantity,
                price
            },
            { new: true } // Return the updated product document
        );

        // If no product is found with that ID
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Return the updated product as a response
        return res.status(200).json({success: true, updatedProduct});
    } catch (error) {
        // Handle any errors (e.g., invalid product ID format)
        console.error(error);
        return res.status(500).json({success: false, message: error.message });
    }
}

// delete product
exports.deleteProduct = async (req, res) => {
    const { productId } = req.query; // Get the productId from the URL parameter

    try {
        // Find the product by its ID and delete it
        const deletedProduct = await productModel.findByIdAndDelete(productId);

        // If no product is found with that ID
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Return a success response
        return res.status(200).json({ success: true, message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        // Handle any errors (e.g., invalid product ID format)
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProduct = async (req, res) => {
    const { productId } = req.query; // Get the productId from the URL parameter

    try {
        // Find the product by its ID
        const product = await productModel.findById(productId);

        // If no product is found with that ID
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Return the found product as a response
        return res.status(200).json({ success: true, message: 'fetch successfully product', product});
    } catch (error) {
        // Handle any errors (e.g., invalid product ID format)
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Controller for getting all products
exports.getAllProducts = async (req, res) => {
    try {
        // Get pagination parameters from query, with defaults
        const { page = 1, limit = 10, search = "" } = req.query;
        const queryCheck = {};
        const skip = (page - 1) * limit;


        // Build search query
        if (search) {
            queryCheck.$or = [
              { productName: { $regex: search, $options: "i" } }, // Case-insensitive regex search
              { productType: { $regex: search, $options: "i" } },
            ];
            // If search term is numeric (like price), add a numeric filter
            if (!isNaN(search)) {
                queryCheck.$or.push({ price: Number(search) }); // numeric price search
            }
          }

        // Fetch products with search and pagination
        const products = await productModel.find(queryCheck)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        // Get total count of matched products
        const totalProducts = await productModel.countDocuments(queryCheck);

        // Send response
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                totalProducts,
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                hasNextPage: page * limit < totalProducts,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
        });
    }
};

// purchase product
// exports.purchaseProduct = async (req, res) => {
//     try {
//         const userId = req.userId;
//         console.log(userId);
//         const { productId, quantity } = req.body;

//         // Validate input
//         if (!userId || !productId || !quantity || quantity <= 0) {
//             return res.status(400).json({ message: "Invalid input" });
//         }

//         // Find the user
//         const user = await userModel.findById(userId);

//         if(user.isBlocked){
//             return res.status(400).json({ message: "User is blocked by the admin and product purchase is not allowed" });
//         }

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Check if the user is allowed to purchase
//         if (user.canPurchase !== "ALLOWED") {
//             return res.status(403).json({ message: "User is not allowed to make purchases" });
//         }

//         // Find the product
//         const product = await productModel.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: "Product not found" });
//         }

//         // Check product quantity
//         if (product.quantity < quantity) {
//             return res.status(400).json({ message: "Insufficient product quantity" });
//         }

//         // Deduct the purchased quantity from the product stock
//         product.quantity -= quantity;
//         await product.save();

//         // Create an order
//         const order = new orderModel({
//             productId,
//             userId,
//             quantity
//         });
//         await order.save();

//         // Respond with success
//         res.status(200).json({
//             success: true,
//             message: "Purchase successful",
//             order: {
//                 orderId: order._id,
//                 productId: order.productId,
//                 userId: order.userId,
//                 quantity: order.quantity,
//                 orderPrice: (quantity*product.price)
//             },
//             product: {
//                 productId: product._id,
//                 productName: product.productName,
//                 remainingQuantity: product.quantity
//             }
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// single product details
exports.getOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const {orderId} = req.body;
        console.log("Product Details", orderId);

        const query=[
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(orderId),
                    
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
                                productName: 1, 
                                price: 1 
                            }
                        }

                    ],
                    as: "productDetails",
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    pipeline:[
                        {
                            $project:{
                                username: 1, 
                                email: 1 
                            }
                        }

                    ],
                    as: "userDetails",
                }
            }
        ]


        // const order = await orderModel.findById(orderId)
        //     .populate("productId") 
        //     .populate("userId", "username email"); 

        const order = await orderModel.aggregate(query)
        console.log(order);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }
        // console.log(userId);
        // console.log(order[0].userId);
        if(userId !== String(order[0].userId)){
            return res.status(404).json({
                success: false,
                message: "This is user is not authenticated for access this order"
            });
        }

        // Send the order details in the response
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Controller to get all orders
exports.getAllOrders = async (req, res) => {
    try {

        const page =parseInt(req.query.page)|| 1
        const limit = parseInt(req.query.limit)|| 10

        const search = {};

        const query = [
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    pipeline:[
                        {
                            $project:{
                                username: 1, 
                                email: 1 
                            }
                        }
                    ],
                    as: "userDetails"
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
                                productName: 1, 
                                price: 1 
                            }
                        }

                    ],
                    as: "productDetails"
                },
            },
            {
                $unwind: "$productDetails" 
            },

            {
                $match:search
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $facet: {
                   metadata:[
                    { $count: "total" },{ $addFields: {  page } }
                   ],
                   data:[
                        { $skip: (page - 1) * limit },{ $limit: limit }
                   ]
                }
            }
        ];

        if (req.query.search) {
            search.$or = [
                { quantity: { $regex: req.query.search, $options: "i" } },
                { "productDetails.productName": { $regex: req.query.search, $options: "i" } },
                { "userDetails.username": { $regex: req.query.search, $options: "i" } },
                { "userDetails.email": { $regex: req.query.search, $options: "i" } },
            ];
            
        }
        const result = await orderModel.aggregate(query);
       
        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};








