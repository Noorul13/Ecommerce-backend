const mongoose = require("mongoose");
//const Schema = mongoose.Schema;

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    productType: {
        type: String,
        enum: ['medicine', 'clothes', 'electric']
    },
    quantity: {
      type: Number
    },
    minPrice: {
        type: Number,
        required: true,
    },
    maxPrice: {
        type: Number,
        required: true,
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
},
{
    timestamps: true
});

productSchema.index({ geoCoordinates: '2dsphere' });
  
module.exports = mongoose.model('product', productSchema);
