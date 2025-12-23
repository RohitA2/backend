const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",       // e.g. smtp.gmail.com
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,     // your email
        pass: process.env.EMAIL_PASS,     // app password
    },
});

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

    await transporter.sendMail({
        from: `" SignLink Support" <${process.env.MAIL_USER}>`,
        to,
        subject: "Your Account Credentials",
        html,
    });
};
