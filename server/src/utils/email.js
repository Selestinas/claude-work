const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.GMAIL_CLIENT_ID) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
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
    console.log(`Verification code sent to ${email}`);
  } else {
    console.log('Email not configured, printing code to console only');
  }

  // Always log to console in development
  console.log(`\n===== VERIFICATION CODE =====`);
  console.log(`Email: ${email}`);
  console.log(`Code:  ${code}`);
  console.log(`=============================\n`);
}

module.exports = { sendVerificationCode };
