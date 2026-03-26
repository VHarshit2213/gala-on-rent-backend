import nodemailer from "nodemailer";

// Send an email using SMTP credentials from environment variables
export async function sendMail({ to, subject, html }) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465; // 465 = SSL, 587 = STARTTLS

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromName = process.env.SMTP_FROM_NAME || "Gala On Rent Support";

  return transporter.sendMail({
    from: `${fromName} <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
