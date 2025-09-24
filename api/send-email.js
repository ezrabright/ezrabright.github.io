const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, errors: ['Method not allowed'] });
  }

  const { name, email, subject, message } = req.body;

  // Server-side validation
  const errors = [];
  if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email address');
  if (!subject || subject.length < 5) errors.push('Subject must be at least 5 characters');
  if (!message || message.length < 10) errors.push('Message must be at least 10 characters');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Create transporter with your SMTP settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `New Contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ success: false, errors: ['Failed to send email'] });
  }
}