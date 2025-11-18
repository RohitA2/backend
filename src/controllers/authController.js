// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const db = require("../config/database"); // Correct path to sequelize instance
const emailService = require("../services/emailServices");
const userService = require("../services/myServices"); // Refactored to use your services
const otpService = require("../services/otpServices");
const moment = require("moment-timezone");
const { use } = require("../routes/uploadRoutes");
const myServices = require("../services/myServices");
const Sequelize = require("sequelize");
const { Op } = Sequelize;



// Register new user
exports.register = async (req, res) => {
  try {
    const userData = req.body;
    const name = userData.name;

    // Check if email already exists
    const where = { email: userData.email };
    const existingUser = await userService.checkExist(db.models.User, where);

    if (existingUser.success) {
      const blockStatus = await otpService.checkBlockStatus(existingUser.data);
      if (blockStatus.isBlocked !== false) {
        return res.status(400).json({ data: blockStatus });
      }

      if (existingUser.data.is_verified !== true) {
        return res.status(400).json({
          success: false,
          isVerified: false,
          message:
            "Your account is not verified. Please check your email for the verification OTP.",
        });
      }

      return res.status(400).json({ message: "Email already exists" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    userData.password = hashedPassword;

    const newUser = await userService.create(db.models.User, userData);

    const response = await sendVerificationOtp(newUser, "registration");
    if (!response.success) {
      return res.status(400).json(response);
    }

    if (!newUser.success) {
      return res.status(400).json(newUser);
    }

    res.status(200).json({
      message: "User registered successfully",
      user: newUser.data, // Send actual user data
      otp: response.otp,
      isVerified: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.password = async (req, res) => {
  try {
    const { password, confirm_password, id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "please provide valid id" });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // const userId = req.user.id;
    // Assuming userService.update function updates a user's data by user ID
    const user = await userService.update(db.models.User, id, {
      password: hashedPassword,
    });
    // Check if the user update was successful
    if (!user) {
      return res.status(400).json({ message: "Failed to update password" });
    }
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Login logic
exports.login = async (req, res) => {
  const { email, password } = req.body;
  // console.log("email is", email);

  try {
    const user = await userService.checkExist(db.models.User, { email: email });
    if (!user.success) {
      return res.status(400).json({ message: "User not found" });
    }
    const blockStatus = await otpService.checkBlockStatus(user.data);
    if (blockStatus.isBlocked !== false) {
      return res.status(400).json({ data: blockStatus });
    }

    const isMatch = await bcrypt.compare(password, user.data.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.data.id, role: user.data.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      userId: user.data.id,
      user: user.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
};

exports.resetPasswordOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body; // Get email, OTP, and newPassword from request body
  try {
    // Verify OTP validity
    const response = await otpService.verifyOtp(db.models.User, email, otp);

    if (!response.success) {
      return res.status(400).json(response); // If OTP verification fails
    }

    // Update the user's password after successful OTP verification
    const update = await userService.updateByWhere(
      db.models.User,
      { email: email },
      { password: newPassword }
    );

    if (!update.success) {
      return res.status(400).json(update); // If password update fails
    }

    // Success response
    res.status(200).json({
      success: true,
      message:
        "Password has been changed successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message:
        "An error occurred while processing your reset password request. Please try again later.",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userService.checkExist(db.models.User, { email: email });

    if (!user.success) {
      return res.status(400).json({ message: "User not found" });
    }

    const blockStatus = await otpService.checkBlockStatus(user.data);

    if (blockStatus.isBlocked !== false) {
      return res.status(400).json({ data: blockStatus });
    }

    const response = await sendVerificationOtp(user, "forget");

    if (!response.success) {
      return res.status(400).json(response);
    }

    res.status(200).json({
      success: true,
      message:
        "A password reset OTP has been sent to your email. Please check your inbox to proceed.",
      response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Verify OTP via email
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log("===========", req.body);

  try {
    const response = await otpService.verifyOtp(db.models.User, email, otp);

    if (!response.success) {
      return res.status(400).json(response);
    }

    const token = jwt.sign(
      { id: response.id, role: response.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      message: "OTP verified successfully",
      token,
      response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Function to resend OTP
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userService.checkExist(db.models.User, { email: email });

    if (!user.success) {
      return res.status(400).json({ message: "User not found" });
    }

    const blockStatus = await otpService.checkBlockStatus(user.data);
    if (blockStatus.isBlocked !== false) {
      return res.status(400).json({ data: blockStatus });
    }

    const otpCooldown = await otpService.checkOtpCooldown(email);

    if (!otpCooldown.status) {
      return res.status(400).json({ message: otpCooldown.message });
    }

    const response = await sendVerificationOtp(user, "forget");

    if (!response.success) {
      return res.status(400).json(response);
    }

    res
      .status(200)
      .json({ message: "OTP has been sent successfully", response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error resending OTP", log: error });
  }
};

// Controller function to get user profile based on JWT token
exports.getUserProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const result = await userService.read(db.models.User, id, null, {});
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving user profile" });
  }
};

// Logout user (Delete token on client side)
exports.logout = (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const userData = req.body;
  // console.log("User Data:++++++++++++++++++++++++++++", userData);

  try {
    const user = await userService.checkExist(db.models.User, req.user.id);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // ✅ Hash the password if it exists in the request body
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const update = await userService.update(
      db.models.User,
      user.data.id,
      userData
    );

    if (!update.success) {
      return res.status(400).json(update);
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: update.data, // ✅ Send updated user data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await userService.checkExist(db.models.User, req.user.id);
    if (!user.success) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.data.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password and save it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    const update = await userService.update(db.models.User, user.data.id, {
      password: newPassword,
    });

    if (!update.success) {
      return res.status(400).json(update);
    }

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error changing password" });
  }
};

// Helper function to generate 4-digit OTP
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit number
};

// send df gdsf
const sendVerificationOtp = async (newUser, type) => {
  try {
    const otp = generateOtp(); // Generate a 4-digit OTP
    // const name = user.data.name;
    console.log(newUser);
    const email = newUser.email || newUser.data?.email;
    console.log(email);
    if (!email) {
      throw new Error("Email is required for OTP generation.");
    }
    console.log("Email found:", email);
    // Store OTP in userOtp table
    const result = {
      email, // Ensure emailId is properly referenced
      otp: otp.toString(),
    };

    const newOtp = await userService.create(db.models.UserOtp, result);

    if (!newOtp.success) {
      return { success: false, message: "Failed to store OTP" };
    }

    console.log("OTP stored successfully:", result); // Log the result for confirmation

    // Send OTP to user via email using emailService
    const subject =
      type === "registration"
        ? "OTP For Registration"
        : "OTP For Password Reset";
    const html =
      type === "registration"
        ? "welcome-email-otp.html"
        : "reset-password-email.html";
    const text = "This is the plain text content for OTP";
    const replacements = { otp }; // Corrected replacement variable

    await emailService.sendEmailOTP(email, subject, text, replacements, html);

    console.log("OTP email sent successfully.");

    return { success: true, otp }; // Return OTP in case you want to send it in response or email
  } catch (error) {
    console.error("Error generating OTP:", error);
    throw new Error("Error generating OTP");
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.models.User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    // Send Email
    await emailService.transporter.sendMail({
      from: `"SignLink Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your SignLink Password",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - SignLink</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }
            
            .email-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .logo {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                letter-spacing: -0.5px;
            }
            
            .email-title {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .email-subtitle {
                font-size: 16px;
                font-weight: 400;
                opacity: 0.9;
            }
            
            .email-body {
                padding: 40px 30px;
                color: #374151;
            }
            
            .greeting {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 24px;
                color: #6b7280;
            }
            
            .reset-instruction {
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 32px;
                color: #4b5563;
            }
            
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            .reset-link {
                word-break: break-all;
                background: #f8fafc;
                padding: 16px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                margin: 20px 0;
                line-height: 1.5;
            }
            
            .expiry-notice {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
                text-align: center;
            }
            
            .expiry-notice strong {
                color: #856404;
            }
            
            .security-tip {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                font-size: 14px;
                color: #0c5460;
            }
            
            .support-section {
                text-align: center;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
            }
            
            .support-text {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 8px;
            }
            
            .support-email {
                color: #667eea;
                font-weight: 600;
                text-decoration: none;
            }
            
            .email-footer {
                background: #f8fafc;
                padding: 24px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            
            .footer-text {
                color: #9ca3af;
                font-size: 12px;
                line-height: 1.5;
                margin-bottom: 8px;
            }
            
            .social-links {
                margin: 16px 0;
            }
            
            .social-link {
                color: #6b7280;
                text-decoration: none;
                margin: 0 8px;
                font-size: 12px;
            }
            
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    border-radius: 12px;
                }
                
                .email-header {
                    padding: 30px 20px;
                }
                
                .email-body {
                    padding: 30px 20px;
                }
                
                .reset-button {
                    display: block;
                    margin: 20px 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <div class="logo">SignLink</div>
                <h1 class="email-title">Password Reset</h1>
                <p class="email-subtitle">Secure your account</p>
            </div>
            
            <!-- Body -->
            <div class="email-body">
                <p class="greeting">Hello,</p>
                
                <p class="reset-instruction">
                    We received a request to reset your password for your SignLink account. 
                    Click the button below to create a new password:
                </p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="reset-button" target="_blank">
                        Reset Your Password
                    </a>
                </div>
                
                <div class="reset-link">
                    Or copy and paste this link in your browser:<br>
                    ${resetLink}
                </div>
                
                <div class="expiry-notice">
                    <strong>⚠️ This link will expire in 15 minutes</strong>
                </div>
                
                <div class="security-tip">
                    <strong>Security Tip:</strong> If you didn't request this password reset, 
                    please ignore this email or contact support if you have concerns about your account security.
                </div>
                
                <div class="support-section">
                    <p class="support-text">Need help? Contact our support team</p>
                    <a href="mailto:support@signlink.com" class="support-email">support@signlink.com</a>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <p class="footer-text">
                    © 2024 SignLink. All rights reserved.<br>
                    Transforming the way you manage signatures and documents.
                </p>
                <div class="social-links">
                    <a href="#" class="social-link">Website</a>
                    <a href="#" class="social-link">Privacy Policy</a>
                    <a href="#" class="social-link">Terms of Service</a>
                </div>
                <p class="footer-text">
                    This email was sent to ${user.email} because you requested a password reset for your SignLink account.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
    });

    res.json({
      success: true,
      message: "Password reset email sent successfully"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await db.models.User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Sequelize.Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Hash password
    const hashedPwd = await bcrypt.hash(newPassword, 10);

    user.password = hashedPwd;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    // Send password reset confirmation email
    await emailService.transporter.sendMail({
      from: `"SignLink Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Updated Successfully - SignLink",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Updated - SignLink</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                }
                
                .email-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    padding: 40px 30px;
                    text-align: center;
                    color: white;
                }
                
                .logo {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    letter-spacing: -0.5px;
                }
                
                .email-title {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                
                .email-subtitle {
                    font-size: 16px;
                    font-weight: 400;
                    opacity: 0.9;
                }
                
                .email-body {
                    padding: 40px 30px;
                    color: #374151;
                }
                
                .greeting {
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                    color: #6b7280;
                }
                
                .success-message {
                    background: #d1fae5;
                    border: 1px solid #a7f3d0;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }
                
                .success-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .success-text {
                    color: #065f46;
                    font-weight: 600;
                    font-size: 18px;
                    margin-bottom: 8px;
                }
                
                .info-box {
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 20px 0;
                }
                
                .info-title {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                }
                
                .security-tips {
                    background: #fef3c7;
                    border: 1px solid #fcd34d;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 24px 0;
                }
                
                .security-title {
                    color: #92400e;
                    font-weight: 600;
                    margin-bottom: 12px;
                    font-size: 16px;
                }
                
                .tip-list {
                    color: #92400e;
                    font-size: 14px;
                    line-height: 1.6;
                }
                
                .tip-list li {
                    margin-bottom: 8px;
                }
                
                .action-required {
                    background: #fee2e2;
                    border: 1px solid #fca5a5;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 20px 0;
                    text-align: center;
                }
                
                .action-text {
                    color: #dc2626;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                
                .support-section {
                    text-align: center;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .support-text {
                    color: #6b7280;
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                
                .support-email {
                    color: #10b981;
                    font-weight: 600;
                    text-decoration: none;
                }
                
                .email-footer {
                    background: #f8fafc;
                    padding: 24px 30px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }
                
                .footer-text {
                    color: #9ca3af;
                    font-size: 12px;
                    line-height: 1.5;
                    margin-bottom: 8px;
                }
                
                .social-links {
                    margin: 16px 0;
                }
                
                .social-link {
                    color: #6b7280;
                    text-decoration: none;
                    margin: 0 8px;
                    font-size: 12px;
                }
                
                @media only screen and (max-width: 600px) {
                    .email-container {
                        margin: 10px;
                        border-radius: 12px;
                    }
                    
                    .email-header {
                        padding: 30px 20px;
                    }
                    
                    .email-body {
                        padding: 30px 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <!-- Header -->
                <div class="email-header">
                    <div class="logo">SignLink</div>
                    <h1 class="email-title">Password Updated</h1>
                    <p class="email-subtitle">Your account is now secure</p>
                </div>
                
                <!-- Body -->
                <div class="email-body">
                    <p class="greeting">Hello ${user.firstName || 'there'},</p>
                    
                    <div class="success-message">
                        <div class="success-icon">✅</div>
                        <div class="success-text">Password Updated Successfully!</div>
                        <p style="color: #065f46; margin: 0;">Your SignLink account password has been reset successfully.</p>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-title">📅 Update Details:</div>
                        <p style="color: #6b7280; margin: 8px 0 0 0;">
                            • Password changed: ${new Date().toLocaleString()}<br>
                            • Account: ${user.email}<br>
                            • IP Address: ${req.ip || req.connection.remoteAddress}
                        </p>
                    </div>
                    
                    <div class="security-tips">
                        <div class="security-title">🔒 Security Tips:</div>
                        <ul class="tip-list">
                            <li>Use a strong, unique password that you don't use elsewhere</li>
                            <li>Enable two-factor authentication for extra security</li>
                            <li>Never share your password with anyone</li>
                            <li>Log out from shared devices after use</li>
                        </ul>
                    </div>
                    
                    <div class="action-required">
                        <div class="action-text">⚠️ Didn't make this change?</div>
                        <p style="color: #dc2626; margin: 8px 0 0 0; font-size: 14px;">
                            If you didn't reset your password, please contact our support team immediately 
                            and consider changing your password again.
                        </p>
                    </div>
                    
                    <div class="support-section">
                        <p class="support-text">Need help or have questions?</p>
                        <a href="mailto:support@signlink.com" class="support-email">support@signlink.com</a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="email-footer">
                    <p class="footer-text">
                        © 2024 SignLink. All rights reserved.<br>
                        Secure signature management for modern businesses.
                    </p>
                    <div class="social-links">
                        <a href="#" class="social-link">Website</a>
                        <a href="#" class="social-link">Privacy Policy</a>
                        <a href="#" class="social-link">Terms of Service</a>
                    </div>
                    <p class="footer-text">
                        This is a security notification for your SignLink account.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    });

    res.json({ success: true, message: "Password reset successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



