// /api/sendmail.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body;

  try {
    let transporter = nodemailer.createTransport({
      host: "mail.ezrabright.co.za",
      port: 465,
      secure: true, // true for port 465, false for 587
      auth: {
        user: "leads@ezrabright.co.za",
        pass: process.env.EMAIL_PASSWORD, // store password in Vercel env
      },
    });

    await transporter.sendMail({
      from: `"EzraBright Website" <leads@ezrabright.co.za>`,
      to: "leads@ezrabright.co.za",
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h3>New Message from Website</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br>${message}</p>
      `,
    });

    return res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ message: "Error sending email", error });
  }
}
