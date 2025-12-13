// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create Transporter (Connection to Email Service)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Use the Host defined in Render
    port: process.env.SMTP_PORT, // Use the Port defined in Render
    secure: true, // For port 465, secure must be true
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