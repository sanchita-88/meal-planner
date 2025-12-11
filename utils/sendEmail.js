// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create Transporter (Connection to Email Service)
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'hotmail', 'yahoo' etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your APP PASSWORD (not login password)
    }
  });

  // 2. Define Email Options
  const mailOptions = {
    from: `"Smart Meal Planner" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
    // html: options.html (optional)
  };

  // 3. Send
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;