const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

const frontendUrl = process.env.FRONTEND_URL || 'https://emergency-alert-frontend.onrender.com';

const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  frontendUrl,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY || '';
const SEMAPHORE_SENDER = process.env.SEMAPHORE_SENDER || 'EmergencyAlert';

// Helper to create Supabase client headers
const getSupabaseHeaders = (token = '') => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// ============ LOGGING HELPERS ============

const LogLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

const ActionType = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  ALERT_CREATE: 'alert_create',
  ALERT_RESOLVE: 'alert_resolve',
  ALERT_CANCEL: 'alert_cancel',
  ALERT_BULK_RESOLVE: 'alert_bulk_resolve',
  ALERT_BULK_CANCEL: 'alert_bulk_cancel',
  RESIDENT_CREATE: 'resident_create',
  RESIDENT_UPDATE: 'resident_update',
  RESIDENT_DELETE: 'resident_delete',
  RESIDENT_STATUS_UPDATE: 'resident_status_update',
  SYSTEM_RESET: 'system_reset',
  SMS_SENT: 'sms_sent',
  SMS_FAILED: 'sms_failed',
};

async function createLog(action, level, description, adminId, adminEmail, entityType, entityId, metadata) {
  try {
    const { error } = await axios.post(
      `${SUPABASE_URL}/rest/v1/system_logs`,
      {
        action,
        level,
        description,
        admin_id: adminId || null,
        admin_email: adminEmail || null,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date().toISOString(),
      },
      { headers: getSupabaseHeaders() }
    );
    
    if (error) {
      console.error('Failed to create log:', error);
    }
  } catch (err) {
    console.error('Failed to create log:', err.message);
  }
}

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, full_name, role, contact_number, address } = req.body;
    
    const generatedUsername = username || email.split('@')[0];
    const generatedFullName = full_name || email.split('@')[0];
    const userRole = role || 'user';
    
    // Check if email already exists in users table
    try {
      const existingUser = await axios.get(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`,
        { headers: getSupabaseHeaders() }
      );
      
      if (existingUser.data && existingUser.data.length > 0) {
        return res.status(400).json({ message: 'Email already registered. Please login instead.' });
      }
    } catch (checkError) {
      // Continue with registration if check fails
    }

    // Register with Supabase Auth
    const authResponse = await axios.post(
      `${SUPABASE_URL}/auth/v1/signup`,
      { email, password, options: { data: { username: generatedUsername, full_name: generatedFullName } } },
      { headers: getSupabaseHeaders() }
    );

    // Check if auth signup returned an error (user already exists)
    if (authResponse.data?.user === null) {
      return res.status(400).json({ message: 'Email already registered. Please login instead.' });
    }

    const user = authResponse.data.user;
    const access_token = authResponse.data.session?.access_token;

    // Create user profile with upsert (insert or update if exists)
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
        { headers: { ...getSupabaseHeaders(), 'Prefer': 'resolution=merge-duplicates' } }
      );
    } catch (profileError) {
      console.error('Profile creation error:', profileError.response?.data);
    }

    // Auto-create resident for regular users (not admins) with upsert
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
          { headers: { ...getSupabaseHeaders(), 'Prefer': 'resolution=merge-duplicates' } }
        );
      } catch (residentError) {
        console.error('Resident creation error:', residentError.response?.data);
      }
    }

    // Log registration
    await createLog(ActionType.REGISTER, LogLevel.INFO, `New user registered: ${email} (${userRole})`, user.id, email, 'user', user.id);

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

    // Log login
    await createLog(ActionType.LOGIN, LogLevel.INFO, `User logged in: ${email}`, user.id, email, 'user', user.id);

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
    let userId = null;
    let userEmail = null;
    
    // Get user info before logout for logging
    if (token) {
      try {
        const userResponse = await axios.get(
          `${SUPABASE_URL}/auth/v1/user`,
          { headers: getSupabaseHeaders(token) }
        );
        userId = userResponse.data?.id;
        userEmail = userResponse.data?.email;
      } catch (e) {
        // Ignore errors getting user info
      }
      
      await axios.post(
        `${SUPABASE_URL}/auth/v1/logout`,
        {},
        { headers: getSupabaseHeaders(token) }
      );
    }
    
    // Log logout
    if (userEmail) {
      await createLog(ActionType.LOGOUT, LogLevel.INFO, `User logged out: ${userEmail}`, userId, userEmail, 'user', userId);
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
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?order=created_at.desc`,
      { headers: getSupabaseHeaders() }
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
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?select=status`,
      { headers: getSupabaseHeaders() }
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
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?id=eq.${req.params.id}&select=*`,
      { headers: getSupabaseHeaders() }
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
    const { status } = req.body;
    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/residents?id=eq.${req.params.id}`,
      { status, last_updated: new Date().toISOString() },
      { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
    );
    res.json(response.data[0]);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update status' });
  }
});

// Reset all statuses
app.post('/api/residents/reset', async (req, res) => {
  try {
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/residents`,
      { status: 'no_response', last_updated: new Date().toISOString() },
      { headers: getSupabaseHeaders() }
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
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/alerts?order=created_at.desc`,
      { headers: getSupabaseHeaders() }
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
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/alerts?status=eq.active&order=created_at.desc`,
      { headers: getSupabaseHeaders() }
    );
    res.json(response.data || []);
  } catch (error) {
    res.json([]);
  }
});

// Create alert
app.post('/api/alerts', async (req, res) => {
  try {
    const alertData = {
      ...req.body,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/alerts`,
      alertData,
      { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
    );

    const newAlert = response.data[0];

    // Send SMS to all residents
    try {
      const residentsResponse = await axios.get(
        `${SUPABASE_URL}/rest/v1/residents?select=contact_number`,
        { headers: getSupabaseHeaders() }
      );
      
      const phoneNumbers = residentsResponse.data?.map(r => r.contact_number).filter(Boolean) || [];
      if (phoneNumbers.length > 0) {
        await sendBulkSMS(phoneNumbers, formatAlertMessage(req.body));
      }
    } catch (smsError) {
      console.error('SMS sending error:', smsError.message);
    }

    // Log alert creation
    const logLevel = (req.body.alert_level === 'critical' || req.body.alert_level === 'high') ? LogLevel.ERROR : LogLevel.WARNING;
    await createLog(ActionType.ALERT_CREATE, logLevel, `Created ${req.body.alert_level?.toUpperCase() || 'UNKNOWN'} alert: ${req.body.emergency_type} at ${req.body.location}`, null, null, 'alert', newAlert.id, req.body);

    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Create alert error:', error.response?.data || error.message);
    res.status(400).json({ message: 'Failed to create alert' });
  }
});

// Resolve alert
app.put('/api/alerts/:id/resolve', async (req, res) => {
  try {
    // Get alert info first for logging
    const alertResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/alerts?id=eq.${req.params.id}&select=*`,
      { headers: getSupabaseHeaders() }
    );
    const alert = alertResponse.data?.[0];
    
    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/alerts?id=eq.${req.params.id}`,
      { status: 'resolved', resolved_at: new Date().toISOString() },
      { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
    );
    
    // Log alert resolution
    if (alert) {
      await createLog(ActionType.ALERT_RESOLVE, LogLevel.INFO, `Resolved alert: ${alert.emergency_type} at ${alert.location}`, null, null, 'alert', req.params.id);
    }
    
    res.json(response.data[0]);
  } catch (error) {
    res.status(400).json({ message: 'Failed to resolve alert' });
  }
});

// Cancel alert
app.put('/api/alerts/:id/cancel', async (req, res) => {
  try {
    // Get alert info first for logging
    const alertResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/alerts?id=eq.${req.params.id}&select=*`,
      { headers: getSupabaseHeaders() }
    );
    const alert = alertResponse.data?.[0];
    
    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/alerts?id=eq.${req.params.id}`,
      { status: 'cancelled', resolved_at: new Date().toISOString() },
      { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
    );
    
    // Log alert cancellation
    if (alert) {
      await createLog(ActionType.ALERT_CANCEL, LogLevel.INFO, `Cancelled alert: ${alert.emergency_type} at ${alert.location}`, null, null, 'alert', req.params.id);
    }
    
    res.json(response.data[0]);
  } catch (error) {
    res.status(400).json({ message: 'Failed to cancel alert' });
  }
});

// Bulk resolve alerts
app.post('/api/alerts/bulk-resolve', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No alert IDs provided' });
    }
    
    const results = [];
    for (const id of ids) {
      try {
        const response = await axios.patch(
          `${SUPABASE_URL}/rest/v1/alerts?id=eq.${id}`,
          { status: 'resolved', resolved_at: new Date().toISOString() },
          { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
        );
        if (response.data?.[0]) results.push(response.data[0]);
      } catch (e) {
        console.error(`Failed to resolve alert ${id}:`, e.message);
      }
    }
    
    // Log bulk resolve
    await createLog(ActionType.ALERT_BULK_RESOLVE, LogLevel.INFO, `Bulk resolved ${results.length} alerts`, null, null, 'alert', null, { ids, resolved: results.length });
    
    res.json({ message: `Resolved ${results.length} alerts`, results });
  } catch (error) {
    res.status(400).json({ message: 'Failed to bulk resolve alerts' });
  }
});

// Bulk cancel alerts
app.post('/api/alerts/bulk-cancel', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No alert IDs provided' });
    }
    
    const results = [];
    for (const id of ids) {
      try {
        const response = await axios.patch(
          `${SUPABASE_URL}/rest/v1/alerts?id=eq.${id}`,
          { status: 'cancelled', resolved_at: new Date().toISOString() },
          { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
        );
        if (response.data?.[0]) results.push(response.data[0]);
      } catch (e) {
        console.error(`Failed to cancel alert ${id}:`, e.message);
      }
    }
    
    // Log bulk cancel
    await createLog(ActionType.ALERT_BULK_CANCEL, LogLevel.WARNING, `Bulk cancelled ${results.length} alerts`, null, null, 'alert', null, { ids, cancelled: results.length });
    
    res.json({ message: `Cancelled ${results.length} alerts`, results });
  } catch (error) {
    res.status(400).json({ message: 'Failed to bulk cancel alerts' });
  }
});

// Reset system
app.post('/api/alerts/reset', async (req, res) => {
  try {
    // Cancel all active alerts
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/alerts?status=eq.active`,
      { status: 'cancelled', resolved_at: new Date().toISOString() },
      { headers: getSupabaseHeaders() }
    );

    // Reset all resident statuses
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/residents`,
      { status: 'no_response', last_updated: new Date().toISOString() },
      { headers: getSupabaseHeaders() }
    );

    // Log system reset
    await createLog(ActionType.SYSTEM_RESET, LogLevel.WARNING, 'System reset - all alerts cancelled and resident statuses reset', null, null, 'system', null);

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
    const { phone, message, residentId } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ message: 'Phone and message are required' });
    }
    
    const result = await sendSMS(phone, message);
    
    // Update resident status to 'no_response' when SMS is sent
    if (residentId) {
      await axios.patch(
        `${SUPABASE_URL}/rest/v1/residents?id=eq.${residentId}`,
        { status: 'no_response' },
        { headers: getSupabaseHeaders() }
      );
    }
    
    res.json({ success: true, message: 'SMS sent successfully', data: result });
  } catch (error) {
    console.error('Send SMS error:', error.message);
    res.status(500).json({ message: 'Failed to send SMS' });
  }
});

// Broadcast SMS to all residents
app.post('/api/sms/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get all residents with contact numbers
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/residents?select=id,contact_number&contact_number=not.is.null`,
      { headers: getSupabaseHeaders() }
    );

    const residents = response.data || [];
    const phoneNumbers = residents.map(r => r.contact_number).filter(Boolean);

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ message: 'No residents with contact numbers found' });
    }

    const result = await sendBulkSMS(phoneNumbers, message);
    
    // Update all residents' status to 'no_response' when broadcast is sent
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/residents?contact_number=not.is.null`,
      { status: 'no_response' },
      { headers: getSupabaseHeaders() }
    );
    
    res.json({ success: true, message: `SMS sent to ${phoneNumbers.length} residents`, count: phoneNumbers.length });
  } catch (error) {
    console.error('Broadcast SMS error:', error.message);
    res.status(500).json({ message: 'Failed to broadcast SMS' });
  }
});

// ============ SMS HELPER FUNCTIONS (Semaphore) ============

function formatPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('63')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return cleaned;
  }
  return cleaned;
}

async function sendSMS(phoneNumber, message) {
  if (!SEMAPHORE_API_KEY) {
    console.log('[SEMAPHORE SIMULATION] Would send to:', phoneNumber);
    console.log('[SEMAPHORE SIMULATION] Message:', message);
    return { simulated: true, phone: phoneNumber, message };
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  console.log('[SEMAPHORE] Sending to:', formattedPhone);

  try {
    const response = await axios.post(
      'https://semaphore.co/api/v4/messages',
      {
        api_key: SEMAPHORE_API_KEY,
        number: formattedPhone,
        message: message,
        sendername: SEMAPHORE_SENDER
      }
    );
    return response.data;
  } catch (error) {
    console.error('Semaphore error:', error.response?.data || error.message);
    throw new Error('Failed to send SMS');
  }
}

async function sendBulkSMS(phoneNumbers, message) {
  if (!SEMAPHORE_API_KEY) {
    console.log('[SEMAPHORE SIMULATION] Would send to', phoneNumbers.length, 'recipients');
    return { simulated: true, count: phoneNumbers.length };
  }

  const formattedPhones = phoneNumbers.map(p => formatPhoneNumber(p)).filter(Boolean);
  console.log('[SEMAPHORE] Bulk sending to:', formattedPhones.length, 'recipients');

  const results = [];
  for (const phone of formattedPhones) {
    try {
      const response = await axios.post(
        'https://semaphore.co/api/v4/messages',
        {
          api_key: SEMAPHORE_API_KEY,
          number: phone,
          message: message,
          sendername: SEMAPHORE_SENDER
        }
      );
      results.push(response.data);
    } catch (error) {
      console.error(`Semaphore error for ${phone}:`, error.response?.data || error.message);
    }
  }
  return { sent: results.length, failed: formattedPhones.length - results.length, results };
}

// Check SMS delivery status
app.get('/api/sms/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const response = await axios.get(
      `${INFOBIP_BASE_URL}/sms/3/text/query`,
      { 
        params: { messageId },
        headers: { 'Authorization': `App ${INFOBIP_API_KEY}` } 
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('SMS status error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to get SMS status' });
  }
});

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
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` } }
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
      { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
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
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/emergency_reports?order=created_at.desc`,
      { headers: getSupabaseHeaders() }
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
    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/emergency_reports?id=eq.${req.params.id}`,
      { 
        status: req.body.status,
        updated_at: new Date().toISOString()
      },
      { headers: { ...getSupabaseHeaders(), 'Prefer': 'return=representation' } }
    );
    res.json(response.data[0]);
  } catch (error) {
    console.error('Update emergency report error:', error.response?.data || error.message);
    res.status(400).json({ message: 'Failed to update emergency report' });
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

// ============ LOGS ROUTES ============

// Get all logs with filters
app.get('/api/logs', async (req, res) => {
  try {
    const { action, level, admin_id, start_date, end_date, search, limit = 50, offset = 0 } = req.query;
    
    let query = `${SUPABASE_URL}/rest/v1/system_logs?select=*`;
    
    if (action) query += `&action=eq.${action}`;
    if (level) query += `&level=eq.${level}`;
    if (admin_id) query += `&admin_id=eq.${admin_id}`;
    if (start_date) query += `&created_at=gte.${start_date}`;
    if (end_date) query += `&created_at=lte.${end_date}`;
    if (search) query += `&description=ilike.%${encodeURIComponent(search)}%`;
    
    query += `&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    const response = await axios.get(query, { headers: getSupabaseHeaders() });
    
    // Get total count
    let countQuery = `${SUPABASE_URL}/rest/v1/system_logs?select=id`;
    if (action) countQuery += `&action=eq.${action}`;
    if (level) countQuery += `&level=eq.${level}`;
    if (admin_id) countQuery += `&admin_id=eq.${admin_id}`;
    if (start_date) countQuery += `&created_at=gte.${start_date}`;
    if (end_date) countQuery += `&created_at=lte.${end_date}`;
    
    const countResponse = await axios.get(countQuery, { headers: { ...getSupabaseHeaders(), 'Prefer': 'count=exact' } });
    const total = countResponse.headers['content-range'] ? parseInt(countResponse.headers['content-range'].split('/')[1]) : response.data.length;
    
    res.json({ logs: response.data || [], total });
  } catch (error) {
    console.error('Get logs error:', error.response?.data || error.message);
    res.json({ logs: [], total: 0 });
  }
});

// Get log statistics
app.get('/api/logs/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalResponse, todayResponse, levelResponse, actionResponse] = await Promise.all([
      axios.get(`${SUPABASE_URL}/rest/v1/system_logs?select=id`, { headers: { ...getSupabaseHeaders(), 'Prefer': 'count=exact' } }),
      axios.get(`${SUPABASE_URL}/rest/v1/system_logs?created_at=gte.${today.toISOString()}&select=id`, { headers: { ...getSupabaseHeaders(), 'Prefer': 'count=exact' } }),
      axios.get(`${SUPABASE_URL}/rest/v1/system_logs?select=level`, { headers: getSupabaseHeaders() }),
      axios.get(`${SUPABASE_URL}/rest/v1/system_logs?select=action`, { headers: getSupabaseHeaders() }),
    ]);
    
    const byLevel = {};
    const byAction = {};
    
    if (levelResponse.data) {
      levelResponse.data.forEach(log => {
        byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      });
    }
    
    if (actionResponse.data) {
      actionResponse.data.forEach(log => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
      });
    }
    
    res.json({
      total: totalResponse.headers['content-range'] ? parseInt(totalResponse.headers['content-range'].split('/')[1]) : 0,
      today: todayResponse.headers['content-range'] ? parseInt(todayResponse.headers['content-range'].split('/')[1]) : 0,
      byLevel,
      byAction,
    });
  } catch (error) {
    console.error('Get log stats error:', error.response?.data || error.message);
    res.json({ total: 0, today: 0, byLevel: {}, byAction: {} });
  }
});

// Export logs as JSON
app.get('/api/logs/export', async (req, res) => {
  try {
    const { action, level, start_date, end_date } = req.query;
    
    let query = `${SUPABASE_URL}/rest/v1/system_logs?select=*&order=created_at.desc&limit=1000`;
    
    if (action) query += `&action=eq.${action}`;
    if (level) query += `&level=eq.${level}`;
    if (start_date) query += `&created_at=gte.${start_date}`;
    if (end_date) query += `&created_at=lte.${end_date}`;
    
    const response = await axios.get(query, { headers: getSupabaseHeaders() });
    res.json(response.data || []);
  } catch (error) {
    console.error('Export logs error:', error.response?.data || error.message);
    res.json([]);
  }
});

// Get logs by entity
app.get('/api/logs/entity/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/system_logs?entity_type=eq.${type}&entity_id=eq.${id}&order=created_at.desc&limit=20`,
      { headers: getSupabaseHeaders() }
    );
    res.json(response.data || []);
  } catch (error) {
    console.error('Get entity logs error:', error.response?.data || error.message);
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('⚠️  Supabase credentials not configured. Please set environment variables.');
  }
});

module.exports = app;
