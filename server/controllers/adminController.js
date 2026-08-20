const sheets = require('../config/googleSheetsClient');
const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { jobStatus: expiryStatus } = require('../jobs/expiryJob');
const { jobStatus: reminderStatus } = require('../jobs/reminderJob');
const { appendUserToSheet } = require('../utils/sheetsSync');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const getAdminUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users from database' });
    }

    res.status(200).json(data || []);
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getAdminOffers = async (req, res) => {
  try {
    // Fetch all offers from Supabase directly
    const { data, error } = await supabase
      .from('offers')
      .select('*, users!generated_by(email, name), rejections(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
      
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching admin offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { email } = req.params;
    const { role } = req.body;

    if (!['hr', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('email', email);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update user role' });
    }

    // Sheets sync skipped — Google Sheets integration currently unavailable
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { email } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    // Sheets sync skipped — Google Sheets integration currently unavailable
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (role === 'manager' && !department) {
      return res.status(400).json({ error: 'Department is required for managers' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password_hash: passwordHash,
        role,
        department: role === 'manager' ? department : null
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // Async sync to Google Sheets
    appendUserToSheet(newUser).catch(err => console.error('Failed to append user to sheet:', err));

    res.status(201).json({ message: 'User created successfully', user: { id: newUser.id, email, name, role } });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    // Check Google Sheets
    let sheetsConnected = false;
    try {
      await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      sheetsConnected = true;
    } catch (err) {
      console.error('Sheets health check failed:', err.message);
    }

    // Check SMTP
    let smtpConnected = false;
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: process.env.GMAIL_CLIENT_ID ? {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        } : {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.verify();
      smtpConnected = true;
    } catch (err) {
      console.error('SMTP health check failed:', err.message);
    }

    res.status(200).json({
      googleSheets: sheetsConnected ? 'ok' : 'error',
      smtp: smtpConnected ? 'ok' : 'error',
      cronExpiry: expiryStatus.lastRun,
      cronReminder: reminderStatus.lastRun
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
};

module.exports = {
  getAdminUsers,
  getAdminOffers,
  updateUserRole,
  deleteUser,
  createUser,
  getSystemHealth
};
