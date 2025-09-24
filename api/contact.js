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
    // Send email
        const info = await transporter.sendMail({
            from: `"${name.trim()}" <${process.env.SMTP_USER}>`,
            to: process.env.CONTACT_EMAIL,
            replyTo: email.trim(),
            subject: `Contact Form: ${subject.trim()}`,
            text: `
            Contact Form Submission

            Name: ${name.trim()}
            Email: ${email.trim()}
            Subject: ${subject.trim()}

            Message:
            ${message.trim()}

            --
            Sent from EzraBright contact form
            `,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                        New Contact Form Submission
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>Name:</strong> ${name.trim()}</p>
                        <p style="margin: 10px 0;"><strong>Email:</strong> 
                            <a href="mailto:${email.trim()}" style="color: #007bff;">${email.trim()}</a>
                        </p>
                        <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject.trim()}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #333;">Message:</h3>
                        <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                            ${message.trim().replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        Sent from EzraBright contact form
                    </p>
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
