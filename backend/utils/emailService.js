const nodemailer = require('nodemailer');

// Create transporter ONCE
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Base email sender
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"SwapSkillz" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Email could not be sent');
  }
};

// ================== EMAIL FLOWS ==================

// Welcome email
exports.sendWelcomeEmail = (email, name) =>
  sendEmail({
    to: email,
    subject: 'Welcome to SwapSkillz! 🎉',
    html: `
      <h2>Welcome ${name}! 🚀</h2>
      <p>Complete your profile and start swapping skills.</p>
      <a href="${process.env.CLIENT_URL}/dashboard">Go to Dashboard</a>
    `,
  });

// Exchange request
exports.sendExchangeRequestEmail = (email, requester, offer, want) =>
  sendEmail({
    to: email,
    subject: '🤝 New Skill Exchange Request',
    html: `
      <h2>${requester} wants to exchange skills</h2>
      <p><b>Offers:</b> ${offer}</p>
      <p><b>Wants:</b> ${want}</p>
      <a href="${process.env.CLIENT_URL}/exchanges">View Request</a>
    `,
  });

// Exchange accepted
exports.sendExchangeAcceptedEmail = (email, name, skill) =>
  sendEmail({
    to: email,
    subject: '✅ Exchange Accepted',
    html: `
      <h2>${name} accepted your request 🎉</h2>
      <p>You will learn: <b>${skill}</b></p>
      <a href="${process.env.CLIENT_URL}/messages">Start Chat</a>
    `,
  });

// Booking reminder
exports.sendBookingReminderEmail = (email, name, time, partner) =>
  sendEmail({
    to: email,
    subject: '⏰ Skill Session Reminder',
    html: `
      <h2>Hello ${name}</h2>
      <p>Your session with <b>${partner}</b> is scheduled at:</p>
      <h3>${time}</h3>
      <a href="${process.env.CLIENT_URL}/bookings">View Booking</a>
    `,
  });

// Password reset
exports.sendPasswordResetEmail = (email, token) =>
  sendEmail({
    to: email,
    subject: '🔒 Reset Your Password',
    html: `
      <p>Click below to reset your password:</p>
      <a href="${process.env.CLIENT_URL}/reset-password/${token}">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
    `,
  });

// New review
exports.sendNewReviewEmail = (email, name, reviewer, rating) =>
  sendEmail({
    to: email,
    subject: '⭐ New Review Received',
    html: `
      <h2>Hi ${name}</h2>
      <p>${reviewer} left you a review:</p>
      <h3>${'⭐'.repeat(rating)} (${rating}/5)</h3>
      <a href="${process.env.CLIENT_URL}/profile">View Profile</a>
    `,
  });
