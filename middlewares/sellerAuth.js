const jwt = require('jsonwebtoken');
require('dotenv').config();
const sellerModel = require('../models/seller');
const adminModel = require("../models/admin");

const sellerAuth = async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided.",
        });
    }
    try {
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.SELLER_JWT_SECRET); 
        // console.log(decoded.id);
        // console.log(decoded.role);
        if (!decoded) {
          return res.send({ code: 400, message: "Failed to authenticate token" });
        }

        if (!decoded.id) {
          return res.send({
            code: 400,
            message: "Cannot find seller_id in decoded token",
          });
        }
        //console.log(decoded.role);
        if (decoded.role === "admin") {
          const admin = await adminModel.findById(decoded.id);
          if (!admin) {
              return res.status(400).json({ message: "Admin not found" });
          }
          req.adminId = decoded.id; // Set admin ID to request
          req.adminRole = decoded.role;
          return next();
        }
        // console.log(decoded.id);
        const seller = await sellerModel.findById(decoded.id);
        // console.log(seller);
        if(!seller) {
          return res.status(400).json({
            message: "seller is not found"
          })
        }    
        req.sellerId = decoded.id;
        req.sellerRole = decoded.role;
        // console.log(req.userId);
        return next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification failed:", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = sellerAuth;