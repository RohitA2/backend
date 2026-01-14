// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",       // e.g. smtp.gmail.com
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER,     // your email
//         pass: process.env.EMAIL_PASS,     // app password
//     },
// });

// exports.sendUserCredentialsMail = async ({
//     to,
//     name,
//     email,
//     password,
//     companyName,
// }) => {
//     const html = `
//     <div style="font-family: Arial, sans-serif;">
//       <h2>Welcome ${name || ""}</h2>
//       <p>Your account has been created successfully.</p>

//       <p><b>Company:</b> ${companyName || "N/A"}</p>

//       <h3>Login Credentials</h3>
//       <p><b>Email:</b> ${email}</p>
//       <p><b>Password:</b> ${password}</p>

//       <p>Please change your password after first login.</p>

//       <br/>
//       <p>Regards,<br/>Team</p>
//     </div>
//   `;

//     await transporter.sendMail({
//         from: `" SignLink Support" <${process.env.MAIL_USER}>`,
//         to,
//         subject: "Your Account Credentials",
//         html,
//     });
// };


/**
 * Send user credentials email using SendGrid
 * Forced CommonJS (.cjs) to avoid ESM errors
 */

let sgMail;

/**
 * Lazy-load SendGrid (ESM-safe inside CommonJS)
 */
async function getSendGrid() {
  if (!sgMail) {
    const module = await import("@sendgrid/mail");
    sgMail = module.default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return sgMail;
}

exports.sendUserCredentialsMail = async ({
  to,
  name,
  email,
  password,
  companyName,
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome ${name || ""}</h2>
      <p>Your account has been created successfully.</p>

      <p><b>Company:</b> ${companyName || "N/A"}</p>

      <h3>Login Credentials</h3>
      <p><b>Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>

      <p>Please change your password after first login.</p>

      <br/>
      <p>Regards,<br/>Team</p>
    </div>
  `;

  const mailer = await getSendGrid();

  await mailer.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: "SignLink Support",
    },
    subject: "Your Account Credentials",
    html,
  });
};
