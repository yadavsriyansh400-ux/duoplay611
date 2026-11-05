
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: {
      name: "DuoPlay611",
      address: process.env.SENDER_EMAIL,
    },
    to,
    subject,
    html,
  });
};

export default sendEmail;
