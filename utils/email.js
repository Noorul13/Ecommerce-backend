const nodemailer = require("nodemailer");

require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


exports.sendOtpEmail = async (email, otp) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP send',
      text: `Welcome! for reset password:\n\nEmail: ${email}\nOTP: ${otp}`
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Otp sent successfull ${otp}`);
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw new Error('Failed to send email');
    }
  };