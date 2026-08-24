/**
 * Contact form mailer for JSB Mobile Truck and Trailer Repair.
 *
 * Browser forms POST as application/x-www-form-urlencoded (hidden iframe — avoids CORS)
 * or as JSON.
 *
 * In Google Apps Script (script.google.com):
 * 1. Paste this code into your Apps Script project.
 * 2. Click "Deploy" -> "Manage deployments" -> edit or "New version" -> "Deploy".
 */

const CONFIG = {
  RECIPIENT_EMAIL: 'rehmatroadservice@gmail.com',
  /** Must match data-gs-secret on contact.html */
  SECRET_TOKEN: 'vN0leiJCcXjqr0erK842T0iVXpBTZgPf9ivDVy6il8o',
  SUBJECT_PREFIX: 'Website Contact — JSB Truck Repair — ',
};

function doPost(e) {
  const out = function (obj) {
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  };

  try {
    var body = parsePostBody(e);
    if (!body) {
      return out({ success: false, message: 'No data' });
    }

    if (body.token !== CONFIG.SECRET_TOKEN) {
      return out({ success: false, message: 'Unauthorized' });
    }

    var name = String(body.name || '').trim();
    var email = String(body.email || '').trim();
    var phone = String(body.phone || '').trim();
    var service = String(body.service || '').trim();
    var message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return out({ success: false, message: 'Missing required fields' });
    }

    var subject = CONFIG.SUBJECT_PREFIX + service;
    var html =
      '<table style="font-family:sans-serif;font-size:14px;max-width:560px;">' +
      '<tr><td style="font-weight:bold;padding:4px 8px 4px 0;">Name</td><td>' + esc(name) + '</td></tr>' +
      '<tr><td style="font-weight:bold;padding:4px 8px 4px 0;">Email</td><td>' + esc(email) + '</td></tr>' +
      '<tr><td style="font-weight:bold;padding:4px 8px 4px 0;">Phone</td><td>' + esc(phone) + '</td></tr>' +
      '<tr><td style="font-weight:bold;padding:4px 8px 4px 0;">Service</td><td>' + esc(service) + '</td></tr>' +
      '</table>' +
      '<p style="font-family:sans-serif;font-size:14px;font-weight:bold;">Message</p>' +
      '<p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">' + esc(message) + '</p>';

    MailApp.sendEmail({
      to: CONFIG.RECIPIENT_EMAIL,
      replyTo: email,
      subject: subject,
      htmlBody: html,
    });

    return out({ success: true });
  } catch (err) {
    return out({ success: false, message: String(err && err.message ? err.message : err) });
  }
}

/** Normalize form / JSON body from doPost(e). Handles e.parameters and raw postData. */
function parsePostBody(e) {
  function first(val) {
    if (val == null) return '';
    if (Array.isArray(val)) return val.length ? String(val[0]) : '';
    return String(val);
  }

  function fromMap(map) {
    if (!map || !map.token) return null;
    return {
      token: first(map.token),
      name: first(map.name),
      email: first(map.email),
      phone: first(map.phone),
      service: first(map.service),
      message: first(map.message),
    };
  }

  function parseUrlEncoded(contents) {
    var parsed = {};
    String(contents).split('&').forEach(function (pair) {
      var idx = pair.indexOf('=');
      if (idx === -1) return;
      var k = decodeURIComponent(pair.substring(0, idx).replace(/\+/g, ' '));
      var v = decodeURIComponent(pair.substring(idx + 1).replace(/\+/g, ' '));
      parsed[k] = v;
    });
    return parsed;
  }

  if (e.parameters && Object.keys(e.parameters).length) {
    var flat = {};
    for (var key in e.parameters) {
      if (Object.prototype.hasOwnProperty.call(e.parameters, key)) {
        flat[key] = first(e.parameters[key]);
      }
    }
    var fromParams = fromMap(flat);
    if (fromParams) return fromParams;
  }

  if (e.parameter && e.parameter.token) {
    var fromLegacy = fromMap(e.parameter);
    if (fromLegacy) return fromLegacy;
  }

  if (!e.postData || e.postData.contents === undefined || e.postData.contents === '') {
    return null;
  }

  var raw = String(e.postData.contents);
  var type = String(e.postData.type || '').toLowerCase();

  if (type.indexOf('x-www-form-urlencoded') >= 0) {
    return fromMap(parseUrlEncoded(raw)) || null;
  }

  if (raw.trim().charAt(0) === '{') {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  if (raw.indexOf('=') >= 0) {
    var guess = fromMap(parseUrlEncoded(raw));
    if (guess) return guess;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Contact form endpoint is running. Use POST from the website form.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
