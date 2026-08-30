export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const { name, email, phone, service, message, botcheck, website } = body;

    // Honeypot bot protection
    if (botcheck || website) {
      return res.status(200).json({ success: true, message: 'Message sent successfully.' });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const scriptSecret = process.env.GOOGLE_SCRIPT_SECRET;

    if (!scriptUrl) {
      console.error('Missing GOOGLE_SCRIPT_URL environment variable');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
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
      body: params.toString()
    });

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Contact API Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
}
