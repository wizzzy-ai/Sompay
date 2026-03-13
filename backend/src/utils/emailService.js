import nodemailer from 'nodemailer';
import winston from 'winston';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'email.log', level: 'info' }),
    new winston.transports.File({ filename: 'email-error.log', level: 'error' }),
  ],
});

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

export const sendVerificationEmail = async (to, otp, companyName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'PSP Platform'}" <${process.env.EMAIL_FROM || 'noreply@yourdomain.com'}>`,
      to: to,
      subject: 'Verify Your Company Account - PSP Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to PSP Platform!</h1>
            <p>Account Verification Required</p>
          </div>

          <div class="content">
            <h2>Hello ${companyName}!</h2>
            <p>Thank you for registering your company with PSP Platform. To complete your registration and start using our services, please verify your email address.</p>

            <p>Your verification code is:</p>

            <div class="otp-box">
              ${otp}
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> This code will expire in 24 hours. Please use it promptly to verify your account.
            </div>

            <p>If you didn't request this registration, please ignore this email. Your account will not be activated without verification.</p>

            <p>For security reasons, please do not share this code with anyone.</p>

            <div class="footer">
              <p>Best regards,<br><strong>PSP Platform Team</strong></p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent successfully to ${to} for company ${companyName}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error(`Failed to send verification email to ${to}: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (to, resetToken, userName) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'PSP Platform'}" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Password Reset Request - PSP Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Password Reset</h1>
            <p>Secure your account</p>
          </div>

          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>You have requested to reset your password for your PSP Platform account.</p>

            <p>Please click the button below to reset your password:</p>

            <a href="${resetUrl}" class="button">Reset Password</a>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${resetUrl}</p>

            <div class="footer">
              <p>Best regards,<br><strong>PSP Platform Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent successfully to ${to}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email service connection successful');
    return { success: true, message: 'Email service is working correctly' };
  } catch (error) {
    logger.error(`Email service connection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailConnection
};
