const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const adminModel = require("../models/admin");
const userModel = require("../models/user");
const { adminTokensModel } = require("../models/adminToken");
const { sendOtpEmail } = require('../utils/email');
require('dotenv').config();

const generateToken = (adminId, adminRole) => {
    return jwt.sign({ id: adminId, role: adminRole }, process.env.ADMIN_JWT_SECRET, { expiresIn: '90d' });
};

// Send Token Function
const sendToken = async (admin, res) => {
    const token = generateToken(admin._id, admin.role);

    // Check if the token already exists for this admin
    const data = await adminModel.findById(admin._id).select("-password");
    const existingToken = await adminTokensModel.findOne({
        adminId: admin._id,
    });

    if (existingToken) {
        // Update the existing token
        await adminTokensModel.findOneAndUpdate(
            { adminId: admin._id },
            { $set: { token } },
            { new: true }
        );
    } else {
        // Save the new token
        const newToken = new adminTokensModel({
            adminId: admin._id,
            token,
        });
        await newToken.save();
    }
    const savedToken = await adminTokensModel.findOne({ adminId: admin._id });
    // Send response
    return res.send({
        code: 200,
        message: "Login Successful",
        token: savedToken.token,
        details: data,
      });
};

// Login Controller
module.exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if admin exists
        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found."
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // Check if admin is active
        if (admin.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Admin account is inactive.",
            });
        }

        // Send token
        await sendToken(admin, res);
    } catch (error) {
        console.error("Error during admin login:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required." });
    }

    try {
        // Find the user by ID from the authenticated user's token
        const adminId = req.adminId; 
        console.log(adminId);
        const admin = await adminModel.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found." });
        }

        // Check if the current password matches
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        admin.password = hashedPassword;
        await admin.save();

        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports.forgotPassword = async (req, res) => {
    const { email } = req.body; // Get email from request body
  
    try {
      const admin = await adminModel.findOne({ email });
  
      if (!admin) {
        return res.status(404).json({ message: 'admin not found' });
      }
  
      // Generate a 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
      // Send OTP to the  email
      await sendOtpEmail(email, otp);
  
      // Store the OTP temporarily (e.g., in the session or in-memory store)
      // Here, we are just sending it back in response for simplicity
      // You might want to use a better approach for storing OTPs securely.
      admin.otp = otp; // Save OTP to the patient record or use a separate storage
      await admin.save();
  
      res.status(200).json({ message: 'OTP sent to your email', otp });
    } catch (error) {
      res.status(500).json({ message: 'Server error', details: error.message });
    }
};

module.exports.verifyOtpAndSetNewPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body; // Get email, OTP, and new password from request body
  
    try {
      const admin = await adminModel.findOne({ email });
  
      if (!admin) {
        return res.status(404).json({ message: 'admin not found' });
      }
  
      // Check if the OTP matches
      if (admin.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // Update the password
      admin.password = hashedPassword; // Ensure new password is hashed before saving
      admin.otp = undefined; // delete after use
      // admin.otp = null; // Clear OTP after use
      await admin.save();
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', details: error.message });
    }
};

module.exports.blockUser = async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if(user.isBlocked){
            return res.status(404).json({ message: 'User is already block' });
        }

        user.isBlocked = true;
        user.canPurchase = "DENIED";
        await user.save();

        res.status(200).json({ message: 'User blocked successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error blocking user', error: error.message });
    }
};

module.exports.unblockUser = async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if(!user.isBlocked){
            return res.status(404).json({ message: 'User is already unblock' });
        }

        user.isBlocked = false;
        user.canPurchase = "ALLOWED";
        await user.save();

        res.status(200).json({ message: 'User unblocked successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error unblocking user', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Get pagination parameters from query, with defaults
        const { page = 1, limit = 10, search = "" } = req.query;
        const queryCheck = {};
        const skip = (page - 1) * limit;


        // Build search query
        if (search) {
            queryCheck.$or = [
              { username: { $regex: search, $options: "i" } }, // Case-insensitive regex search
              { email: { $regex: search, $options: "i" } },
            ];
          }

        // Fetch products with search and pagination
        const users = await userModel.find(queryCheck)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        // Get total count of matched products
        const totalusers = await userModel.countDocuments(queryCheck);

        // Send response
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                totalusers,
                currentPage: page,
                totalPages: Math.ceil(totalusers / limit),
                hasNextPage: page * limit < totalusers,
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

exports.getAllBlockedUsers = async (req, res) => {
    try {
        // Get pagination parameters from query, with defaults
        const { page = 1, limit = 10, search = "" } = req.query;
        const queryCheck = { isBlocked: true };
        const skip = (page - 1) * limit;


        // Build search query
        if (search) {
            queryCheck.$or = [
              { username: { $regex: search, $options: "i" } }, // Case-insensitive regex search
              { email: { $regex: search, $options: "i" } },
            ];
          }

        // Fetch products with search and pagination
        const users = await userModel.find(queryCheck)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        // Get total count of matched products
        const totalusers = await userModel.countDocuments(queryCheck);

        // Send response
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                totalusers,
                currentPage: page,
                totalPages: Math.ceil(totalusers / limit),
                hasNextPage: page * limit < totalusers,
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

exports.getAllUnBlockedUsers = async (req, res) => {
    try {
        // Get pagination parameters from query, with defaults
        const { page = 1, limit = 10, search = "" } = req.query;
        const queryCheck = { isBlocked: false };
        const skip = (page - 1) * limit;


        // Build search query
        if (search) {
            queryCheck.$or = [
              { username: { $regex: search, $options: "i" } }, // Case-insensitive regex search
              { email: { $regex: search, $options: "i" } },
            ];
          }

        // Fetch products with search and pagination
        const users = await userModel.find(queryCheck)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        // Get total count of matched products
        const totalusers = await userModel.countDocuments(queryCheck);

        // Send response
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                totalusers,
                currentPage: page,
                totalPages: Math.ceil(totalusers / limit),
                hasNextPage: page * limit < totalusers,
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