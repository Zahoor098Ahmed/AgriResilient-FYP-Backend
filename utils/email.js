import nodemailer from 'nodemailer';

const isSmtpConfigured = () =>
  !!(process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `AgriResilient <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  });
};

export const sendVerificationEmail = async (email, token) => {
  const message = `Your password reset code is: ${token}. It is valid for 10 minutes.`;

  console.log('--- PASSWORD RESET OTP ---');
  console.log(`To: ${email} | Code: ${token}`);
  console.log('--------------------------');

  if (!isSmtpConfigured()) {
    console.warn('[Email] SMTP not configured (SMTP_HOST/SMTP_EMAIL/SMTP_PASSWORD) — code was only logged above, not actually emailed.');
    return false;
  }

  try {
    await sendEmail({ email, subject: 'Password Reset OTP', message });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
};

export const sendSignupOtpEmail = async (email, otp) => {
  const message = `Your AgriResilient email verification code is: ${otp}. It is valid for 10 minutes. Enter it to finish creating your account.`;

  console.log('--- SIGNUP VERIFICATION CODE ---');
  console.log(`To: ${email} | Code: ${otp}`);
  console.log('---------------------------------');

  if (!isSmtpConfigured()) {
    console.warn('[Email] SMTP not configured (SMTP_HOST/SMTP_EMAIL/SMTP_PASSWORD) — code was only logged above, not actually emailed.');
    return false;
  }

  try {
    await sendEmail({ email, subject: 'Verify your AgriResilient account', message });
    return true;
  } catch (err) {
    console.error('Signup OTP email send error:', err);
    return false;
  }
};

export const sendAdminOtpEmail = async (email, otp) => {
  const message = `Your AgriResilient Admin verification code is: ${otp}. It is valid for 10 minutes. If you did not request this, secure your account immediately.`;

  console.log('--- ADMIN LOGIN VERIFICATION CODE ---');
  console.log(`To: ${email} | Code: ${otp}`);
  console.log('--------------------------------------');

  if (!isSmtpConfigured()) {
    console.warn('[Email] SMTP not configured (SMTP_HOST/SMTP_EMAIL/SMTP_PASSWORD) — code was only logged above, not actually emailed.');
    return false;
  }

  try {
    await sendEmail({ email, subject: 'AgriResilient Admin Verification Code', message });
    return true;
  } catch (err) {
    console.error('Admin OTP email send error:', err);
    return false;
  }
};
