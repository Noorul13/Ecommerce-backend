const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

const userTokensSchema = mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    token: {
        type: String
    }
},
{
    timestamps: true
});

  
module.exports = mongoose.model('userTokens', userTokensSchema);

 