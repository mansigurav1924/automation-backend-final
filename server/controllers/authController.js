const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sheets = require('../config/googleSheetsClient');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// ── Helpers ─────────────────────────────────────────────────────────

async function getUsers() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A:G',
  });
  const rows = response.data.values || [];
  if (rows.length <= 1) return { headers: rows[0], users: [] };
  
  const headers = rows[0];
  const users = rows.slice(1).map((row, index) => ({
    sheetRowIndex: index + 2, // data starts at row 2
    email: row[0],
    passwordHash: row[1],
    name: row[2],
    role: row[3],
    createdAt: row[4],
    resetToken: row[5],
    resetTokenExpires: row[6],
    department: row[7] || '',
  }));
  
  return { headers, users };
}

// ── Controllers ─────────────────────────────────────────────────────

const signup = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Determine role (default to 'hr', prevent public admin creation)
    const assignedRole = (role && role.toLowerCase() === 'admin') ? 'admin' : 'hr';

    const { users } = await getUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          email,
          passwordHash,
          name,
          assignedRole,
          new Date().toISOString(),
          '',
          '',
          assignedRole === 'hr' ? (department || '') : ''
        ]]
      }
    });

    const token = jwt.sign({ email, name, role: assignedRole, department: assignedRole === 'hr' ? department : undefined }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'User created', token, user: { name, email, role: assignedRole, department: assignedRole === 'hr' ? department : undefined } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { users } = await getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ email: user.email, name: user.name, role: user.role, department: user.department }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { users } = await getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      // Don't leak whether the email exists
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    // Save token in sheet (columns F and G)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!F${user.sheetRowIndex}:G${user.sheetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[resetToken, expires]] }
    });

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${email}`;

    await transporter.sendMail({
      from: `"OfferFlow System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}" style="padding:10px 20px; background:#5B2EFF; color:white; text-decoration:none; border-radius:8px;">Reset Password</a>
        <p>This link is valid for 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });

    res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    const { users } = await getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.resetToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (new Date() > new Date(user.resetTokenExpires)) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password (B), and clear tokens (F, G)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!B${user.sheetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[passwordHash]] }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!F${user.sheetRowIndex}:G${user.sheetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['', '']] }
    });

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };
