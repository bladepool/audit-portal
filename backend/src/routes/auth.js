const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register (for initial setup)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      name,
      role: 'admin'
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get security questions for password reset
router.post('/security-questions', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(404).json({ error: 'User not found or no security questions set' });
    }
    
    // Return only the questions, not the answers
    const questions = user.securityQuestions.map((sq, index) => ({
      index,
      question: sq.question
    }));
    
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password with security questions
router.post('/reset-password', async (req, res) => {
  try {
    const { email, answers, newPassword } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify all security answers
    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: 'Security answers required' });
    }
    
    let allCorrect = true;
    for (const { index, answer } of answers) {
      if (!user.verifySecurityAnswer(index, answer)) {
        allCorrect = false;
        break;
      }
    }
    
    if (!allCorrect) {
      return res.status(401).json({ error: 'Incorrect security answers' });
    }
    
    // Reset password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password (requires current password)
router.post('/change-password', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { currentPassword, newPassword, securityQuestions } = req.body;
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    
    // Update security questions if provided
    if (securityQuestions && securityQuestions.length > 0) {
      user.securityQuestions = securityQuestions;
    }
    
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
