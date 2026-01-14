// const nodemailer = require('nodemailer');
// const fs = require('fs');
// const path = require('path');
// const dotenv = require('dotenv');

// dotenv.config();

// // Create a transporter using your email credentials
// const transporter = nodemailer.createTransport({
//   service: 'gmail',  // You can change this to any service you want
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Function to send a welcome email with OTP
// const sendEmailOTP = async (to, subject, text, replacements, html) => {

//   console.log(__dirname);
//   // Generate the correct path to the template file
//   const templatePath = path.join(__dirname, '../../templates/', html);
//   let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

//   let projectName = process.env.PROJECT_NAME;
//   let companyAddress = process.env.COMPANY_ADDRESS;

//   // Replace placeholders with actual values
//   htmlTemplate = htmlTemplate.replace('{{name}}', replacements.name);
//   htmlTemplate = htmlTemplate.replace('{{otp}}', replacements.otp);
//   htmlTemplate = htmlTemplate.replace('{{projectName}}', projectName);
//   htmlTemplate = htmlTemplate.replace('{{companyAddress}}', companyAddress);

//   const mailOptions = {
//     from: `"SignLink Support" <${process.env.EMAIL_USER}>`, // Customize From field
//     to,
//     subject,
//     text,
//     html: htmlTemplate, // Use the updated HTML content with replacements
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     return info; // Optionally return the email information for logging or debugging
//   } catch (error) {
//     throw new Error('Error sending email: ' + error.message);
//   }
// };

// // Function to send an email with HTML content and optional attachments
// const sendResetEmailOTP = async (to, subject, text, replacements, html) => {
//   // Read the HTML template file
//   const templatePath = path.join(__dirname, '../templates/reset-password-email.html');
//   let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

//   let projectName = process.env.PROJECT_NAME;
//   let companyAddress = process.env.COMPANY_ADDRESS;

//   // Replace placeholders with actual values
//   htmlTemplate = htmlTemplate.replace('{{name}}', replacements.name);
//   htmlTemplate = htmlTemplate.replace('{{otp}}', replacements.otp);
//   htmlTemplate = htmlTemplate.replace('{{projectName}}', projectName);
//   htmlTemplate = htmlTemplate.replace('{{companyAddress}}', companyAddress);

//   const mailOptions = {
//     from: `"${process.env.PROJECT_NAME}" <${process.env.EMAIL_USER}>`, // Customize From field
//     to,
//     subject,
//     text,
//     html: htmlTemplate, // Use the updated HTML content with replacements
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     return info; // Optionally return the email information for logging or debugging
//   } catch (error) {
//     throw new Error('Error sending email: ' + error.message);
//   }
// };


// // **New Function for Sending Newsletter Emails**
// const sendNewsletterEmail = async (subscribers, subject, content) => {
//   const mailOptions = {
//     from: `"${process.env.PROJECT_NAME}" <${process.env.EMAIL_USER}>`, // Customize From field
//     subject,
//     text: content,  // Newsletter content
//     // Optionally, use HTML email
//     html: content,  // You can include HTML content for richer formatting
//   };

//   try {
//     // Sending email to each subscriber in the list
//     const emailPromises = subscribers.map(subscriber =>
//       transporter.sendMail({ ...mailOptions, to: subscriber.email })
//     );

//     const results = await Promise.all(emailPromises);  // Send emails concurrently
//     return { message: 'Newsletter sent successfully', results };  // Return success message and results
//   } catch (error) {
//     throw new Error('Error sending newsletter: ' + error.message);
//   }
// };




// module.exports = {
//   sendResetEmailOTP,
//   sendEmailOTP,
//   sendNewsletterEmail,  // Export the new sendNewsletterEmail function
//   transporter
// };


/**
 * Email Service using SendGrid (CommonJS safe)
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

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

/**
 * Send OTP Email (Signup / Verify)
 */
const sendEmailOTP = async (to, subject, text, replacements, htmlFile) => {
  const templatePath = path.join(__dirname, "../../templates/", htmlFile);
  let htmlTemplate = fs.readFileSync(templatePath, "utf-8");

  htmlTemplate = htmlTemplate
    .replace("{{name}}", replacements.name)
    .replace("{{otp}}", replacements.otp)
    .replace("{{projectName}}", process.env.PROJECT_NAME)
    .replace("{{companyAddress}}", process.env.COMPANY_ADDRESS);

  const mailer = await getSendGrid();

  return mailer.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: "SignLink Support",
    },
    subject,
    text,
    html: htmlTemplate,
  });
};

/**
 * Send Reset Password OTP Email
 */
const sendResetEmailOTP = async (to, subject, text, replacements) => {
  const templatePath = path.join(
    __dirname,
    "../templates/reset-password-email.html"
  );

  let htmlTemplate = fs.readFileSync(templatePath, "utf-8");

  htmlTemplate = htmlTemplate
    .replace("{{name}}", replacements.name)
    .replace("{{otp}}", replacements.otp)
    .replace("{{projectName}}", process.env.PROJECT_NAME)
    .replace("{{companyAddress}}", process.env.COMPANY_ADDRESS);

  const mailer = await getSendGrid();

  return mailer.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.PROJECT_NAME,
    },
    subject,
    text,
    html: htmlTemplate,
  });
};

/**
 * Send Newsletter Emails (Bulk)
 */
const sendNewsletterEmail = async (subscribers, subject, content) => {
  const mailer = await getSendGrid();

  const messages = subscribers.map((subscriber) => ({
    to: subscriber.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.PROJECT_NAME,
    },
    subject,
    text: content,
    html: content,
  }));

  // Send in batch
  await mailer.send(messages);

  return { message: "Newsletter sent successfully" };
};

module.exports = {
  sendEmailOTP,
  sendResetEmailOTP,
  sendNewsletterEmail,
};
