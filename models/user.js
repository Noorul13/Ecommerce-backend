const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ["user"],
    default: 'user'
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  canPurchase: {
    type: String,
    enum: ['ALLOWED', 'DENIED', 'PENDING'], // Define your enum values
    default: 'ALLOWED', // Set a default value if needed
  },
  otp: {
    type: String
  },
  deviceToken: String,
  deviceType: String,
  accessToken: String
});

const User = mongoose.model('user', userSchema);

module.exports = User;
