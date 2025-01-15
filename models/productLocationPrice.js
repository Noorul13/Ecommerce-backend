const mongoose = require("mongoose");
//const Schema = mongoose.Schema;

const priceSellerSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'seller'
    },
    price: {
        type: Number,
        required: true,
    },
},
{
    timestamps: true
});

  
module.exports = mongoose.model('priceLocation', priceSellerSchema);
