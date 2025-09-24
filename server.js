const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (your HTML, CSS, JS files)
app.use(express.static(path.join(__dirname, 'public')));

// Validation function
function validateContactForm(data) {
    const errors = [];
    const { name, email, subject, message } = data;

    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.push('Invalid email address');
    }
    if (!subject || subject.trim().length < 5) {
        errors.push('Subject must be at least 5 characters');
    }
    if (!message || message.trim().length < 10) {
        errors.push('Message must be at least 10 characters');
    }

    return errors;
}

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    console.log('Contact form submission received:', new Date().toISOString());
    console.log('Request body:', req.body);

    const { name, email, subject, message } = req.body;

    // Validate input
    const validationErrors = validateContactForm(req.body);
    if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
        return res.status(400).json({ 
            success: false, 
            errors: validationErrors 
        });
    }

    // Check environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_EMAIL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
        console.error('Missing environment variables:', missingEnvVars);
        return res.status(500).json({ 
            success: false, 
            errors: ['Server configuration error. Please contact administrator.'] 
        });
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
        // Verify transporter
        await transporter.verify();
        console.log('SMTP connection verified');

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

        console.log('Email sent successfully:', info.messageId);
        res.json({ 
            success: true, 
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Email sending error:', error);
        
        let errorMessage = 'Failed to send email';
        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Failed to connect to email server';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Email server timeout';
        }

        res.status(500).json({ 
            success: false, 
            errors: [errorMessage]
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        errors: ['Internal server error'] 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        errors: ['Endpoint not found'] 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Contact API available at http://localhost:${PORT}/api/contact`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
    
    // Log environment status
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_EMAIL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length === 0) {
        console.log('✅ All environment variables are configured');
    } else {
        console.log('❌ Missing environment variables:', missingEnvVars);
        console.log('   Please check your .env file');
    }
});

module.exports = app;