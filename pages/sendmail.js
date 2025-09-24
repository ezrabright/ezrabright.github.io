// pages/api/sendmail.js
import nodemailer from "nodemailer";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.EZRABRIGHTDB_MONGODB_URI);

async function connectDB() {
  if (!client.isConnected()) await client.connect();
  return client.db("EzraBrightdb_Prod"); 
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required." });
  }

  try {
    // --- 1. Save to MongoDB ---
    const db = await connectDB();
    const collection = db.collection("contacts");

    const dbResult = await collection.insertOne({
      name,
      email,
      subject: subject || "",
      message,
      createdAt: new Date(),
    });

    // --- 2. Send Email ---
    const transporter = nodemailer.createTransport({
      host: "mail.ezrabright.co.za",
      port: 465,
      secure: true, // true for port 465
      auth: {
        user: "leads@ezrabright.co.za",
        //pass: process.env.EMAIL_PASSWORD, // set in Vercel environment
          pass: "Innocent@2240", // ONLY for testing
      },
    });

    await transporter.sendMail({
      from: `"EzraBright Website" <leads@ezrabright.co.za>`,
      to: "leads@ezrabright.co.za", 
      subject: `New Contact Form Submission: ${subject || "No Subject"}`,
      html: `
        <h3>New Message from Website</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject || "No Subject"}</p>
        <p><b>Message:</b><br>${message}</p>
      `,
    });

    return res.status(200).json({ message: "Message sent and saved successfully!" });
  } catch (error) {
    console.error("Error in sendmail API:", error);
    return res.status(500).json({ message: "Error sending message or saving to DB", error: error.message });
  }
}

