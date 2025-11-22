const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const html = `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
  `;
  return sendEmail(to, 'Password Reset Request', html);
};

const sendOrderConfirmationEmail = async (to, orderData) => {
  const html = `
    <h2>Order Confirmation</h2>
    <p>Thank you for your order!</p>
    <p><strong>Order ID:</strong> ${orderData.orderId}</p>
    <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
    <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
    <p>We'll notify you when your order is shipped.</p>
  `;
  return sendEmail(to, 'Order Confirmation', html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};