import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1) Create a transporter
  // Using Mailtrap for development/testing if credentials are not provided
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER || '8008a0d0d86927', // Default Mailtrap test account
      pass: process.env.EMAIL_PASS || '875224e2f69e98'
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Recycle Vision <hello@recyclevision.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

// For now, let's make a dummy sender that logs to console but also tries to send
export const sendVerificationEmail = async (email, token) => {
  const message = `Your password reset code is: ${token}. It is valid for 10 minutes.`;
  
  console.log('--- EMAIL SIMULATION ---');
  console.log(`To: ${email}`);
  console.log(`Subject: Password Reset OTP`);
  console.log(`Body: ${message}`);
  console.log('------------------------');

  try {
    // If you have real SMTP, uncomment this:
    // await sendEmail({
    //   email: email,
    //   subject: 'Password Reset OTP',
    //   message: message
    // });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
};
