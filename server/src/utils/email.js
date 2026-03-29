const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
}

async function sendVerificationCode(email, code) {
  const t = await getTransporter();

  if (t) {
    await t.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'BookShelf - Verification Code',
      html: `
        <h2>Your verification code</h2>
        <p style="font-size: 24px; font-weight: bold; color: #4A90D9;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  }

  // Always log to console in development
  console.log(`\n===== VERIFICATION CODE =====`);
  console.log(`Email: ${email}`);
  console.log(`Code:  ${code}`);
  console.log(`=============================\n`);
}

module.exports = { sendVerificationCode };
