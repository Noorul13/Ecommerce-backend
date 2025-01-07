const mongoose = require("mongoose");
//const Schema = mongoose.Schema;

const orderSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    userId: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    quantity: {
        type: Number,
        default: 0
    },
    
},
{
    timestamps: true
});

  
module.exports = mongoose.model('order', orderSchema);
