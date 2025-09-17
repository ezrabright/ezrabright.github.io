import nodemailer from 'nodemailer';

const rateLimitStore = new Map(); function checkRateLimit(ip) { const now = Date.now(); const windowMs = 15 * 60 * 1000; // 15 minutes 
const maxRequests = 5; 
if (!rateLimitStore.has(ip)) 
    { rateLimitStore.set(ip, []); } 
const requests = rateLimitStore.get(ip); 
// Remove old requests 
const validRequests = requests.filter(time => now - time < windowMs); 

if (validRequests.length >= maxRequests) { return false; } 

validRequests.push(now); rateLimitStore.set(ip, validRequests); return true; } 

function validateInput(data) { const errors = []; if (!data.name || data.name.trim().length < 2) 
    { errors.push('Name must be at least 2 characters long'); } 
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) 
        { errors.push('Please provide a valid email address'); } 
    if (!data.subject || data.subject.trim().length < 5) 
        { errors.push('Subject must be at least 5 characters long'); } 
    if (!data.message || data.message.trim().length < 10) 
        { errors.push('Message must be at least 10 characters long'); } 
    return errors; }

function sanitizeHtml(text) { return text .replace(/&/g, '&amp;') .replace(/</g, '&lt;') .replace(/>/g, '&gt;') .replace(/"/g, '&quot;') .replace(/'/g, '&#39;'); }

export default async function handler(req, res) {
    
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before sending another message.'
      });
    }

    const { name, email, subject, message } = req.body;
    const errors = validateInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const sanitizedData = {
      name: sanitizeHtml(name.trim()),
      email: email.trim(),
      subject: sanitizeHtml(subject.trim()),
      message: sanitizeHtml(message.trim())
    };

    // ✅ correct nodemailer init
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="font-weight: bold; padding: 8px 0; color: #555;">Name:</td>
              <td style="padding: 8px 0;">${sanitizedData.name}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 8px 0; color: #555;">Email:</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${sanitizedData.email}" style="color: #007bff; text-decoration: none;">
                  ${sanitizedData.email}
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 8px 0; color: #555;">Subject:</td>
              <td style="padding: 8px 0;">${sanitizedData.subject}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 8px 0; color: #555; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; line-height: 1.6;">${sanitizedData.message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
          <p>This message was sent via the contact form on ezrabright.co.za</p>
          <p>Received: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${sanitizedData.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      replyTo: sanitizedData.email,
      subject: `Contact Form: ${sanitizedData.subject}`,
      html: emailHtml,
      text: `Name: ${sanitizedData.name}\nEmail: ${sanitizedData.email}\nSubject: ${sanitizedData.subject}\n\nMessage:\n${sanitizedData.message}`
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send message. Please try again later.' });
  }
}
