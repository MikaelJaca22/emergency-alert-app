const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL || 'https://api.infobip.com';
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY || '';
const INFOBIP_SENDER = process.env.INFOBIP_SENDER || 'EmergencyAlert';

// Helper to create Supabase client headers
const getSupabaseHeaders = (token = '') => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, full_name, role, contact_number, address } = req.body;
    
    const generatedUsername = username || email.split('@')[0];
    const generatedFullName = full_name || email.split('@')[0];
    const userRole = role || 'user';
    
    // Register with Supabase Auth
    const authResponse = await axios.post(
      `${SUPABASE_URL}/auth/v1/signup`,
      { email, password, options: { data: { username: generatedUsername, full_name: generatedFullName } } },
      { headers: getSupabaseHeaders() }
    );

    const user = authResponse.data.user;
    const access_token = authResponse.data.session?.access_token;

    // Create user profile
    const profileData = { 
      id: user.id, 
      email, 
      username: generatedUsername || email.split('@')[0], 
      full_name: generatedFullName || email.split('@')[0],
      contact_number: contact_number || '',
      address: address || '',
      role: userRole 
    };

    try {
      await axios.post(
        `${SUPABASE_URL}/rest/v1/users`,
        profileData,
        { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=minimal' } }
      );
    } catch (profileError) {
      console.error('Profile creation error:', profileError.response?.data);
    }

    // Auto-create resident for regular users (not admins)
    if (userRole !== 'admin') {
      try {
        await axios.post(
          `${SUPABASE_URL}/rest/v1/residents`,
          {
            user_id: user.id,
            full_name: generatedFullName || email.split('@')[0],
            contact_number: contact_number || '',
            address: address || '',
            status: 'no_response'
          },
          { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=minimal' } }
        );
      } catch (residentError) {
        console.error('Resident creation error:', residentError.response?.data);
      }
    }

    res.json({ 
      user: { 
        id: user.id, 
        email, 
        username: generatedUsername || email.split('@')[0], 
        full_name: generatedFullName || email.split('@')[0],
        contact_number: contact_number || '',
        address: address || '', 
        role: userRole 
      }, 
      access_token 
    });
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message);
    res.status(400).json({ message: error.response?.data?.msg || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const authResponse = await axios.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: getSupabaseHeaders() }
    );

    const user = authResponse.data.user;
    const access_token = authResponse.data.access_token;

    // Get user profile
    const profileResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}&select=*`,
      { headers: getSupabaseHeaders(access_token) }
    );

    const profile = profileResponse.data[0];

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        username: profile?.username || email.split('@')[0], 
        full_name: profile?.full_name || email.split('@')[0],
        contact_number: profile?.contact_number || '',
        address: profile?.address || '',
        role: profile?.role || 'user'
      }, 
      access_token 
    });
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await axios.post(
        `${SUPABASE_URL}/auth/v1/logout`,
        {},
        { headers: getSupabaseHeaders(token) }
      );
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.json({ message: 'Logged out successfully' });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const userResponse = await axios.get(
      `${SUPABASE_URL}/auth/v1/user`,
      { headers: getSupabaseHeaders(token) }
    );

    const user = userResponse.data;
    const profileResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}&select=*`,
      { headers: getSupabaseHeaders(token) }
    );

    const profile = profileResponse.data[0];
    res.json({ 
      id: user.id, 
      email: user.email, 
      username: profile?.username || user.email.split('@')[0], 
      full_name: profile?.full_name || user.email.split('@')[0],
      role: profile?.role || 'user'
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ============ RESIDENTS ROUTES ============

// Get all residents
app.get('/api/residents', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?order=created_at.desc`,
      { headers: getSupabaseHeaders(token) }
    );
    res.json(response.data || []);
  } catch (error) {
    console.error('Get residents error:', error.response?.data || error.message);
    res.json([]);
  }
});

// Get resident stats
app.get('/api/residents/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?select=status`,
      { headers: getSupabaseHeaders(token) }
    );
    
    const residents = response.data || [];
    res.json({
      total: residents.length,
      safe: residents.filter(r => r.status === 'safe').length,
      needs_help: residents.filter(r => r.status === 'needs_help').length,
      no_response: residents.filter(r => r.status === 'no_response').length
    });
  } catch (error) {
    res.json({ total: 0, safe: 0, needs_help: 0, no_response: 0 });
  }
});

// Get single resident
app.get('/api/residents/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?id=eq.${req.params.id}&select=*`,
      { headers: getSupabaseHeaders(token) }
    );
    
    if (response.data?.length === 0) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    res.json(response.data[0]);
  } catch (error) {
    res.status(404).json({ message: 'Resident not found' });
  }
});

// Update resident status
app.put('/api/residents/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { status } = req.body;
    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/residents?id=eq.${req.params.id}`,
      { status, last_updated: new Date().toISOString() },
      { headers: { ...getSupabaseHeaders(token), 'Prefer': 'return=representation' } }
    );
    res.json(response.data[0]);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update status' });
  }
});

// Reset all statuses
app.post('/api/residents/reset', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/residents`,
      { status: 'no_response', last_updated: new Date().toISOString() },
      { headers: getSupabaseHeaders(token) }
    );
    res.json({ message: 'All statuses reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to reset statuses' });
  }
});

// ============ ALERTS ROUTES ============

// Get all alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/alerts?order=created_at.desc`,
      { headers: getSupabaseHeaders(token) }
    );
    res.json(response.data || []);
  } catch (error) {
    console.error('Get alerts error:', error.response?.data || error.message);
    res.json([]);
  }
});

// Get active alerts
app.get('/api/alerts/active', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/alerts?status=eq.active&order=created_at.desc`,
      { headers: getSupabaseHeaders(token) }
    );
    res.json(response.data || []);
  } catch (error) {
    res.json([]);
  }
});

// Create alert
app.post('/api/alerts', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const alertData = {
      ...req.body,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/alerts`,
      alertData,
      { headers: { ...getSupabaseHeaders(token), 'Prefer': 'return=representation' } }
    );

    // Send SMS to all residents
    try {
      const residentsResponse = await axios.get(
        `${SUPABASE_URL}/rest/v1/residents?select=contact_number`,
        { headers: getSupabaseHeaders(token) }
      );
      
      const phoneNumbers = residentsResponse.data?.map(r => r.contact_number).filter(Boolean) || [];
      if (phoneNumbers.length > 0) {
        await sendBulkSMS(phoneNumbers, formatAlertMessage(req.body));
      }
    } catch (smsError) {
      console.error('SMS sending error:', smsError.message);
    }

    res.status(201).json(response.data[0]);
  } catch (error) {
    console.error('Create alert error:', error.response?.data || error.message);
    res.status(400).json({ message: 'Failed to create alert' });
  }
});

// Resolve alert
app.put('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/alerts?id=eq.${req.params.id}`,
      { status: 'resolved', resolved_at: new Date().toISOString() },
      { headers: { ...getSupabaseHeaders(token), 'Prefer': 'return=representation' } }
    );
    res.json(response.data[0]);
  } catch (error) {
    res.status(400).json({ message: 'Failed to resolve alert' });
  }
});

// Cancel alert
app.put('/api/alerts/:id/cancel', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/alerts?id=eq.${req.params.id}`,
      { status: 'cancelled', resolved_at: new Date().toISOString() },
      { headers: { ...getSupabaseHeaders(token), 'Prefer': 'return=representation' } }
    );
    res.json(response.data[0]);
  } catch (error) {
    res.status(400).json({ message: 'Failed to cancel alert' });
  }
});

// Reset system
app.post('/api/alerts/reset', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Cancel all active alerts
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/alerts?status=eq.active`,
      { status: 'cancelled', resolved_at: new Date().toISOString() },
      { headers: getSupabaseHeaders(token) }
    );

    // Reset all resident statuses
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/residents`,
      { status: 'no_response', last_updated: new Date().toISOString() },
      { headers: getSupabaseHeaders(token) }
    );

    res.json({ message: 'System reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to reset system' });
  }
});

// Simulate SMS response
app.post('/api/alerts/simulate-response', async (req, res) => {
  const { phone, keyword } = req.body;
  const normalizedKeyword = keyword.toUpperCase().trim();
  
  if (normalizedKeyword.includes('SAFE')) {
    res.json({
      status: 'safe',
      response: 'Thank you for confirming you are safe. Stay alert for further updates.'
    });
  } else if (normalizedKeyword.includes('HELP')) {
    res.json({
      status: 'needs_help',
      response: 'Help request received. Emergency services have been notified.'
    });
  } else {
    res.json({
      status: 'unknown',
      response: 'Unrecognized response. Please reply with SAFE or HELP.'
    });
  }
});

// Test SMS
app.post('/api/alerts/test-sms', async (req, res) => {
  const { phone, message } = req.body;
  const result = await sendSMS(phone, message);
  res.json(result);
});

// ============ SMS ROUTES ============

// Send SMS to individual
app.post('/api/sms/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ message: 'Phone and message are required' });
    }
    
    const result = await sendSMS(phone, message);
    res.json({ success: true, message: 'SMS sent successfully', data: result });
  } catch (error) {
    console.error('Send SMS error:', error.message);
    res.status(500).json({ message: 'Failed to send SMS' });
  }
});

// Broadcast SMS to all residents
app.post('/api/sms/broadcast', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get all residents with contact numbers
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?select=contact_number&contact_number=not.is.null`,
      { headers: getSupabaseHeaders(token) }
    );

    const residents = response.data || [];
    const phoneNumbers = residents.map(r => r.contact_number).filter(Boolean);

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ message: 'No residents with contact numbers found' });
    }

    const result = await sendBulkSMS(phoneNumbers, message);
    res.json({ success: true, message: `SMS sent to ${phoneNumbers.length} residents`, count: phoneNumbers.length });
  } catch (error) {
    console.error('Broadcast SMS error:', error.message);
    res.status(500).json({ message: 'Failed to broadcast SMS' });
  }
});

// ============ SMS HELPER FUNCTIONS ============

async function sendSMS(phoneNumber, message) {
  if (!INFOBIP_API_KEY) {
    console.log('[SMS SIMULATION] Would send to:', phoneNumber);
    console.log('[SMS SIMULATION] Message:', message);
    return { simulated: true, phone: phoneNumber, message };
  }

  try {
    const response = await axios.post(
      `${INFOBIP_BASE_URL}/sms/2/text/advanced`,
      { messages: [{ from: INFOBIP_SENDER, to: phoneNumber, text: message }] },
      { headers: { 'Authorization': `App ${INFOBIP_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Infobip error:', error.response?.data || error.message);
    throw new Error('Failed to send SMS');
  }
}

async function sendBulkSMS(phoneNumbers, message) {
  if (!INFOBIP_API_KEY) {
    console.log('[SMS SIMULATION] Would send to', phoneNumbers.length, 'recipients');
    return { simulated: true, count: phoneNumbers.length };
  }

  try {
    const messages = phoneNumbers.map(phone => ({ from: INFOBIP_SENDER, to: phone, text: message }));
    const response = await axios.post(
      `${INFOBIP_BASE_URL}/sms/2/text/advanced`,
      { messages },
      { headers: { 'Authorization': `App ${INFOBIP_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Bulk SMS error:', error.message);
    throw new Error('Failed to send bulk SMS');
  }
}

function formatAlertMessage(alert) {
  const emojis = { low: '⚠️', medium: '🔶', high: '🔴', critical: '🚨' };
  return `${emojis[alert.alert_level]} EMERGENCY ALERT: ${alert.emergency_type.toUpperCase()} at ${alert.location}. Level: ${alert.alert_level.toUpperCase()}. ${alert.instructions}. Reply HELP if you need assistance or SAFE if you are safe.`;
}

// ============ EMERGENCY REPORTS ROUTES (for residents) ============

// Create emergency report
app.post('/api/emergency-reports', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    // Get user from token
    const userResponse = await axios.get(
      `${SUPABASE_URL}/auth/v1/user`,
      { headers: getSupabaseHeaders(token) }
    );

    const user = userResponse.data;

    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/emergency_reports`,
      {
        user_id: user.id,
        emergency_type: req.body.emergency_type,
        description: req.body.description,
        location: req.body.location,
        status: 'pending'
      },
      { headers: { ...getSupabaseHeaders(token), 'Prefer': 'return=representation' } }
    );

    res.status(201).json(response.data[0]);
  } catch (error) {
    console.error('Create emergency report error:', error.response?.data || error.message);
    res.status(400).json({ message: 'Failed to create emergency report' });
  }
});

// Get all emergency reports (admin only)
app.get('/api/emergency-reports', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/emergency_reports?order=created_at.desc`,
      { headers: getSupabaseHeaders(token) }
    );

    res.json(response.data || []);
  } catch (error) {
    console.error('Get emergency reports error:', error.response?.data || error.message);
    res.json([]);
  }
});

// Update emergency report status
app.put('/api/emergency-reports/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/emergency_reports?id=eq.${req.params.id}`,
      { 
        status: req.body.status,
        updated_at: new Date().toISOString()
      },
      { headers: { ...getSupabaseHeaders(token), 'Prefer': 'return=representation' } }
    );

    res.json(response.data[0]);
  } catch (error) {
    console.error('Update emergency report error:', error.response?.data || error.message);
    res.status(400).json({ message: 'Failed to update emergency report' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('⚠️  Supabase credentials not configured. Please create a .env file.');
  }
});
