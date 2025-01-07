const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const adminSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    phoneNumber: String,
    role: {
        type: String,
        enum: ["admin"],
        default: 'admin'
    },
    userName:{
        type: String,
        required: true,
        unique: true
    },
    password: String,
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    otp: {
      type: String
    },
    deviceToken: String,
    deviceType: String,
    accessToken: String
}, {
    timestamps: true
});

const Admin = mongoose.model('admin', adminSchema);

const createAdmin = async () => {
    const adminExists = await Admin.findOne({ role: "admin" });
    // console.log(adminExists);
    if (!adminExists) {
      const password = "123";
      const hashedPass = await bcrypt.hash(password, 10);
      const admin = new Admin({
        role: "admin",
        name: "noorul",
        email: "khannoorul1365@gmail.com",
        userName: "noorul",
        password: hashedPass,
      });
      // console.log(admin);
      await admin.save();
      console.log("Admin user created.");
    } else {
      console.log("Admin user already exists.");
    }
};
  
  
mongoose.connection.once("open", async () => {
  await createAdmin();
});
 
module.exports = Admin;
