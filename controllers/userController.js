const userModel = require('../models/user'); // Adjust the path as needed
const bcrypt = require('bcrypt');
const userTokenModel = require('../models/userToken');
const { sendOtpEmail } = require('../utils/email');
const jwt = require("jsonwebtoken");
require('dotenv').config();

const generateToken = (userId, userRole) => {
    return jwt.sign({ id: userId, role: userRole }, process.env.USER_JWT_SECRET, { expiresIn: '90d' });
};

// Send Token Function
const sendToken = async (user, res) => {
    const token = generateToken(user._id, user.role);

    // Check if the token already exists for this user
    const data = await userModel.findById(user._id).select("-password");
    const existingToken = await userTokenModel.findOne({
        userId: user._id,
    });

    if (existingToken) {
        // Update the existing token
        await userTokenModel.findOneAndUpdate(
            { userId: user._id },
            { $set: { token } },
            { new: true }
        );
    } else {
        // Save the new token
        const newToken = new userTokenModel({
            userId: user._id,
            token,
        });
        await newToken.save();
    }
    const savedToken = await userTokenModel.findOne({ userId: user._id });
    // Send response
    return res.send({
        code: 200,
        message: "Login Successful",
        token: savedToken.token,
        details: data,
    });
};

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    // Basic input validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check for existing username or email
        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the user
        const user = new userModel({
            username,
            email,
            password: hashedPassword,
            // canPurchase: 'PENDING', // Optional
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

module.exports.userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if admin exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found.",
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }
        user.last_login = new Date();
        user.current_login_start = new Date();
        await user.save();
        // Send token
        await sendToken(user, res);
    } catch (error) {
        console.error("Error during user login:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports.userLogout = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("userID", userId);
        // Check if the user token exists
        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingToken = await userTokenModel.findOne({ userId });
        if (!existingToken) {
            return res.status(404).json({
                success: false,
                message: "User is not logged in or token not found.",
            });
        }

        // Calculate session duration
        const currentTime = new Date();
        let sessionDuration = 0;
        if (user.current_login_start) {
            sessionDuration = Math.floor(
                (currentTime - new Date(user.current_login_start)) / (1000 * 60) // Convert milliseconds to minutes
            );
        }

        // Update total_login_time and clear current_login_start
        user.total_login_time += sessionDuration;
        user.current_login_start = null;
        await user.save();

        // Remove the token from the database
        const logoutUser = await userTokenModel.deleteOne({ userId });


        return res.status(200).json({
            success: true,
            message: "Logout successful.",
            total_login_time: user.total_login_time,
            user: logoutUser
        });
    } catch (error) {
        console.error("Error during user logout:", error);
        return res.status(500).json({
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
        const userId = req.userId;
        console.log(userId);
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if the current password matches
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports.forgotPassword = async (req, res) => {
    const { email } = req.body; // Get email from request body

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'user not found' });
        }

        // Generate a 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Send OTP to the  email
        await sendOtpEmail(email, otp);

        // Store the OTP temporarily (e.g., in the session or in-memory store)
        // Here, we are just sending it back in response for simplicity
        // You might want to use a better approach for storing OTPs securely.
        user.otp = otp; // Save OTP to the patient record or use a separate storage
        await user.save();

        res.status(200).json({ message: 'OTP sent to your email', otp });
    } catch (error) {
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

module.exports.verifyOtpAndSetNewPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body; // Get email, OTP, and new password from request body

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'user not found' });
        }

        // Check if the OTP matches
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Update the password
        user.password = hashedPassword; // Ensure new password is hashed before saving
        user.otp = undefined; // delete after use
        // admin.otp = null; // Clear OTP after use
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

exports.getUser = async (req, res) => {
    const userId = req.userId; // Get the productId from the URL parameter

    try {
        // Find the product by its ID
        const user = await userModel.findById(userId);

        // If no user is found with that ID
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the found user as a response
        return res.status(200).json({ success: true, message: 'fetch successfully user', user });
    } catch (error) {
        // Handle any errors (e.g., invalid user ID format)
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports.updateUser = async (req, res) => {
    const userId = req.userId;
    const updateData = req.body;

    try {
        // Find user by ID and user their details
        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true } // Return the updated document and validate fields
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};