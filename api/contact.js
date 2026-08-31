export default async function handler(req, res) {
  // Allow CORS if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const { name, email, phone, service, message, _hp_check } = body;

    // Honeypot spam check
    if (_hp_check) {
      return res.status(200).json({ success: true, message: 'Message received.' });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields (Name, Email, Message).' });
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const scriptSecret = process.env.GOOGLE_SCRIPT_SECRET;

    if (!scriptUrl) {
      console.error('Missing GOOGLE_SCRIPT_URL environment variable');
      return res.status(500).json({ success: false, message: 'Server configuration error: Contact endpoint not configured.' });
    }

    const params = new URLSearchParams({
      token: scriptSecret || '',
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone || '').trim(),
      service: String(service || 'General Inquiry').trim(),
      message: String(message).trim()
    });

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      redirect: 'follow'
    });

    const textResponse = await response.text();
    let result = { success: true };
    try {
      result = JSON.parse(textResponse);
    } catch (parseErr) {
      if (response.ok) {
        result = { success: true };
      } else {
        result = { success: false, message: textResponse || 'Error from mail service.' };
      }
    }

    if (result && result.success === false) {
      console.error('Google Script returned error:', result);
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Contact API Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message: ' + (error.message || error) });
  }
}
