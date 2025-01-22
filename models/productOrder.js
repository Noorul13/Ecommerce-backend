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
        type:String
    },
    orderPrice: {
        type: Number
    }
},
{
    timestamps: true
});

  
module.exports = mongoose.model('order', orderSchema);
