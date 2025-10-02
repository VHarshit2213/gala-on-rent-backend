
import nodemailer from "nodemailer";

export async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS 
    },
  });

  return transporter.sendMail({
    from: `"Gala On Rent Support" <${process.env.SMTP_USER }>`,
    to,
    subject,
    html,
  });
}
