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
  isBlocked: {
    type: Boolean,
    default: false
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
  accessToken: String,
  last_login: { type: Date },
  total_login_time: { type: Number, default: 0 }, // Total login time in minutes
  current_login_start: { type: Date }, // Start time of the current session
});

const User = mongoose.model('user', userSchema);

module.exports = User;
