import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, errors: ['Method not allowed'] });
  }

  const { name, email, subject, message } = req.body;

  // Validation
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email address');
  if (!subject || subject.trim().length < 5) errors.push('Subject must be at least 5 characters');
  if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false, // helps on cPanel/hosting
    }
});


  try {
    const info = await transporter.sendMail({
      from: `"${name} via EzraBright Contact" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `New Contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="padding:10px; border-left:3px solid #007bff;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      `,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email error:', error);

    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') errorMessage = 'SMTP authentication failed';
    if (error.code === 'ECONNECTION') errorMessage = 'Could not connect to mail server';
    if (error.code === 'ETIMEDOUT') errorMessage = 'Mail server timed out';

    return res.status(500).json({ success: false, errors: [errorMessage] });
  }
}
