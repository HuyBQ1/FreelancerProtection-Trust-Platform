import nodemailer from 'nodemailer';

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendRegistrationOtpEmail({ email, otp }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@fptp.local';
  const subject = 'Mã OTP đăng ký tài khoản FPTP';
  const text = `Mã OTP đăng ký tài khoản của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2>Mã OTP đăng ký tài khoản</h2>
      <p>Mã xác minh của bạn là:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
      <p>Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.</p>
    </div>
  `;

  if (!hasSmtpConfig()) {
    console.log(`[DEV OTP] ${email}: ${otp}`);
    return { delivered: false, devMode: true };
  }

  const transporter = createTransporter();
  await transporter.sendMail({ from, to: email, subject, text, html });
  return { delivered: true, devMode: false };
}
