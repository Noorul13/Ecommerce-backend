const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminTokensSchema = mongoose.Schema({
	adminId : {
		type: Schema.Types.ObjectId,
        ref: "admin"
	},
	token: {
		type: String
	}
},
{
	timestamps: true
});

  
const adminTokensModel = mongoose.model('admin_tokens', adminTokensSchema);

module.exports = {
	adminTokensModel
}