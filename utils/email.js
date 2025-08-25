const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const sendEmail = async (option) => {
  try {
    // 1. Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Verify connection (optional for debugging)
    await transporter.verify();
    console.log("Mailtrap server is ready to send emails");

    // 3. Define email options
    const mailOptions = {
      from: `FarmTrack Team<${process.env.EMAIL_USER}>`,
      to: option.email,
      subject: option.subject,
      text: option.message,
    };

    // 4. Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId, info.response);

    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
    throw new Error("Email delivery failed");
  }
};

module.exports = { sendEmail };
