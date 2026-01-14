// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// async function sendMail({ to, subject, html }) {
//   return transporter.sendMail({
//     from: `"SignLink Support" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     html,
//   });
// }

// module.exports = { sendMail };


/**
 * SendGrid Mail Utility (CommonJS compatible)
 * Works with Node.js 20+ and ESM-only SendGrid package
 */

let sgMail;

/**
 * Lazy-load SendGrid to avoid ESM require issues
 */
async function getSendGrid() {
  if (!sgMail) {
    const module = await import("@sendgrid/mail");
    sgMail = module.default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return sgMail;
}

/**
 * Send email
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.html
 */
async function sendMail({ to, subject, html }) {
  const mailer = await getSendGrid();

  return mailer.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: "SignLink Support",
    },
    subject,
    html,
  });
}

module.exports = { sendMail };
