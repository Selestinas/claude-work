const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendVerificationCode } = require('../utils/email');

const router = express.Router();

// Send verification code
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({ verificationCode: code, codeExpiresAt });
    } else {
      user = await User.create({ email, verificationCode: code, codeExpiresAt });
    }

    await sendVerificationCode(email, code);
    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify code and login
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    if (new Date() > user.codeExpiresAt) {
      return res.status(400).json({ error: 'Code expired' });
    }

    await user.update({ verificationCode: null, codeExpiresAt: null });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
