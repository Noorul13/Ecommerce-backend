const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    sellerName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["seller"],
        default: "seller"
    },
    address: {
        type: String
    },
    location: {
        type: {
          type: String,
          enum: ['Point'],
          required: true
        },
        coordinates: { 
          type: [Number],  // [longitude, latitude]
          required: true 
        }
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isApproved: {
        type: String,
        default: "pending",
        enum: ["approved", "pending", "rejected"]
    },
    accessToken: {
        type: String
    }
})

sellerSchema.index({ geoCoordinates: '2dsphere' });

const Seller = mongoose.model('seller', sellerSchema);

module.exports = Seller;