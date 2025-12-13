// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create Transporter (Connection to Email Service)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT, 
    secure: false, // <-- Change to false for Port 587
    requireTLS: true, // <-- Add this for STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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