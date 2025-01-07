const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminModel = require("../models/admin");

const adminAuth = async (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided.",
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        
        if (!decoded) {
          return res.send({ code: 400, message: "Failed to authenticate token" });
        }

        if (!decoded.id) {
          return res.send({
            code: 400,
            message: "Cannot find admin_id in decoded token",
          });
        }
        
        const admin = await adminModel.findById(decoded.id);
        console.log(admin);

        if(!admin) {
          return res.status(400).json({
            message: "admin role is required"
          })
        }
        

        req.adminId = decoded.id;
        // console.log(req.adminId);
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification failed:", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = adminAuth;