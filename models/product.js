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
      type:String
    },
    price: {
        type: Number,
        required: true
    }
},
{
    timestamps: true
});

  
module.exports = mongoose.model('product', productSchema);
