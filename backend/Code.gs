/**
 * Fintness Finserv — Client Feedback API
 * Google Apps Script Web App → Google Sheets
 *
 *   POST (text/plain JSON) → validate → de-duplicate → append row → JSON response
 *   GET                    → health check
 *
 * Run `setup()` once from the editor before deploying (see DEPLOYMENT.md).
 */

var CONFIG = {
  SHEET_NAME: 'Feedback',
  SPREADSHEET_TITLE: 'Fintness Finserv — Client Feedback',
  TIMEZONE: 'Asia/Kolkata',
  MAX_BODY_BYTES: 20000,
  MAX_NAME: 80,
  MAX_COMMENT: 1000,
  REASON_THRESHOLD: 4, // ratings below this require at least one reason
  OTHER: 'Other',
  DEDUPE_CACHE_SECONDS: 21600, // 6h fast-path; the sheet itself is the source of truth
  HEADERS: [
    'Timestamp',
    'Client Name',
    'Mobile Number',
    'Advisory Rating',
    'Advisory Reason',
    'Advisory Comments',
    'Services & Communication Rating',
    'Services Reason',
    'Services Comments',
    'Product Suitability Rating',
    'Product Reason',
    'Product Comments',
    'Overall Submission Status',
    'Submission ID',
  ],
  STATUS_POSITIVE: 'Positive',
  STATUS_FOLLOW_UP: 'Needs Follow-up',
  // Must match the options shown in the frontend (app/src/data/feedback.ts).
  REASONS: {
    advisory: [
      'Advice was not clear enough',
      'Financial goals were not properly understood',
      'Recommendations did not meet my expectations',
      'Insufficient follow-up',
      'Other',
    ],
    services: [
      'Delayed responses',
      'Communication could be clearer',
      'Issues were not resolved effectively',
      'Follow-ups were insufficient',
      'Service experience could be better',
      'Other',
    ],
    product: [
      'Products did not match my financial goals',
      'Recommendations were not explained clearly',
      'I felt the recommendations were unsuitable',
      'I felt there was potential bias in product recommendations',
      'I wanted more product options',
      'Other',
    ],
  },
};

var CATEGORY_IDS = ['advisory', 'services', 'product'];
var CATEGORY_NAMES = { advisory: 'Advisory', services: 'Services & Communication', product: 'Product Suitability' };
var SUBMISSION_ID_COL = 14; // column N (hidden)

/* ───────────────────────────── HTTP entry points ───────────────────────────── */

function doGet() {
  return json_({ ok: true, status: 'ready', service: 'fintness-feedback', version: 1 });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw) return error_('EMPTY_BODY', 'No feedback was received.');
    if (raw.length > CONFIG.MAX_BODY_BYTES) return error_('TOO_LARGE', 'Your feedback is too long. Please shorten it and try again.');

    var body;
    try {
      body = JSON.parse(raw);
    } catch (parseErr) {
      return error_('BAD_JSON', 'We could not read your submission. Please try again.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return error_('BAD_JSON', 'We could not read your submission. Please try again.');
    }

    // Honeypot: real people never see this field. Acknowledge, but write nothing.
    if (body.meta && typeof body.meta.hp === 'string' && body.meta.hp.trim() !== '') {
      return json_({ ok: true, status: 'success', message: 'Thank you.' });
    }

    var result = validatePayload_(body);
    if (!result.ok) {
      return json_({
        ok: false,
        status: 'error',
        code: 'VALIDATION_FAILED',
        message: result.errors[0],
        errors: result.errors,
      });
    }
    var data = result.data;

    // Serialise writes so concurrent submissions can't race the duplicate check.
    if (!lock.tryLock(15000)) {
      return error_('BUSY', 'We are receiving a lot of feedback right now. Please try again in a moment.');
    }

    var cache = CacheService.getScriptCache();
    var cacheKey = 'sid:' + data.submissionId;
    var sheet = getFeedbackSheet_();

    if (cache.get(cacheKey) || submissionExists_(sheet, data.submissionId)) {
      return json_({
        ok: true,
        status: 'success',
        duplicate: true,
        message: 'Your feedback was already received.',
        submissionId: data.submissionId,
      });
    }

    var row = buildRow_(data);
    var nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    cache.put(cacheKey, '1', CONFIG.DEDUPE_CACHE_SECONDS);

    return json_({
      ok: true,
      status: 'success',
      message: 'Feedback recorded.',
      submissionId: data.submissionId,
    });
  } catch (err) {
    console.error('doPost failed', err && err.stack ? err.stack : err);
    return error_('SERVER_ERROR', 'Something went wrong on our side. Please try again.');
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}

/* ───────────────────────────── Validation ───────────────────────────── */

function validatePayload_(body) {
  var errors = [];
  var data = {};

  // Submission ID (client-generated UUID, used for idempotency)
  var sid = typeof body.submissionId === 'string' ? body.submissionId.trim() : '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(sid)) errors.push('Missing or invalid submission reference.');
  data.submissionId = sid;

  // Name — required
  var name = cleanLine_(body.clientName);
  if (!name) errors.push('Please provide your name.');
  else if (name.length < 2) errors.push('Please provide your full name.');
  else if (name.length > CONFIG.MAX_NAME) errors.push('Name must be under ' + CONFIG.MAX_NAME + ' characters.');
  else if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(name)) errors.push('Name may contain letters, spaces, dots and hyphens only.');
  data.clientName = name;

  // Mobile — optional
  var mobile = normalizeMobile_(body.mobile);
  if (mobile === null) errors.push('Mobile number is not valid.');
  data.mobile = mobile || '';

  // Categories
  CATEGORY_IDS.forEach(function (id) {
    var c = body[id];
    var label = CATEGORY_NAMES[id];
    if (!c || typeof c !== 'object') {
      errors.push(label + ': rating is required.');
      return;
    }
    var rating = c.rating;
    if (typeof rating !== 'number' || rating % 1 !== 0 || rating < 1 || rating > 5) {
      errors.push(label + ': rating must be a whole number from 1 to 5.');
      return;
    }

    var comment = cleanMultiline_(c.comment);
    if (comment.length > CONFIG.MAX_COMMENT) errors.push(label + ': comments must be under ' + CONFIG.MAX_COMMENT + ' characters.');

    var reasons = [];
    if (rating < CONFIG.REASON_THRESHOLD) {
      var allowed = CONFIG.REASONS[id];
      var given = Array.isArray(c.reasons) ? c.reasons : [];
      given.forEach(function (r) {
        var v = cleanLine_(r);
        if (allowed.indexOf(v) !== -1 && reasons.indexOf(v) === -1) reasons.push(v);
      });
      if (given.length !== reasons.length) errors.push(label + ': one or more reasons are not recognised.');
      else if (!reasons.length) errors.push(label + ': please select a reason for this rating.');
      else if (reasons.indexOf(CONFIG.OTHER) !== -1 && comment.length < 3) errors.push(label + ': please describe the "Other" reason.');
      // Keep the canonical order from CONFIG for tidy sheet values
      reasons.sort(function (a, b) {
        return allowed.indexOf(a) - allowed.indexOf(b);
      });
    }

    data[id] = { rating: rating, reasons: reasons, comment: comment };
  });

  return { ok: errors.length === 0, errors: errors, data: data };
}

/** Returns normalised number, '' for empty, or null if invalid. */
function normalizeMobile_(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  var compact = value.replace(/[\s\-().]/g, '');
  if (!compact) return '';
  var indian = compact.match(/^(?:\+91|0091|91|0)?([6-9]\d{9})$/);
  if (indian) return '+91' + indian[1];
  if (/^\+[1-9]\d{7,14}$/.test(compact) && compact.indexOf('+91') !== 0) return compact;
  return null;
}

/** Single-line text: strip control chars, collapse whitespace, trim. */
function cleanLine_(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Multi-line text: keep newlines (max 2 in a row), strip other control chars. */
function cleanMultiline_(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Prevents spreadsheet formula injection (=, +, -, @ …) by forcing text. */
function safeCell_(value) {
  var s = String(value == null ? '' : value);
  return /^[=+\-@\t\r|]/.test(s) ? "'" + s : s;
}

/* ───────────────────────────── Sheet I/O ───────────────────────────── */

function buildRow_(d) {
  var low = CATEGORY_IDS.some(function (id) {
    return d[id].rating < CONFIG.REASON_THRESHOLD;
  });
  var row = [new Date(), safeCell_(d.clientName), safeCell_(d.mobile)];
  CATEGORY_IDS.forEach(function (id) {
    row.push(d[id].rating, safeCell_(d[id].reasons.join('; ')), safeCell_(d[id].comment));
  });
  row.push(low ? CONFIG.STATUS_FOLLOW_UP : CONFIG.STATUS_POSITIVE);
  row.push(d.submissionId);
  return row;
}

function submissionExists_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  return !!sheet
    .getRange(2, SUBMISSION_ID_COL, last - 1, 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext();
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActiveSpreadsheet(); // container-bound script
  if (active) return active;
  throw new Error('No spreadsheet configured. Run setup() from the Apps Script editor first.');
}

function getFeedbackSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = formatSheet_(ss.insertSheet(CONFIG.SHEET_NAME));
  return sheet;
}

/* ───────────────────────────── Setup (run once) ───────────────────────────── */

/**
 * Creates (or tidies) the feedback sheet.
 * - Bound script (Extensions → Apps Script from a Sheet): uses that spreadsheet.
 * - Standalone script: creates a new spreadsheet in your Drive and remembers its ID.
 */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var ss = null;
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) ss = SpreadsheetApp.openById(id);
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_TITLE);
  }
  props.setProperty('SPREADSHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    var first = ss.getSheets()[0];
    var isBlank = ss.getSheets().length === 1 && first.getLastRow() === 0;
    sheet = isBlank ? first.setName(CONFIG.SHEET_NAME) : ss.insertSheet(CONFIG.SHEET_NAME);
  }
  formatSheet_(sheet);
  console.log('Feedback sheet ready: ' + ss.getUrl());
  return ss.getUrl();
}

function formatSheet_(sheet) {
  var n = CONFIG.HEADERS.length;
  sheet.getRange(1, 1, 1, n).setValues([CONFIG.HEADERS]);
  sheet
    .getRange(1, 1, 1, n)
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#15355C')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(1, 42);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  var widths = [170, 180, 140, 90, 260, 280, 120, 260, 280, 120, 260, 280, 150, 240];
  widths.forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });

  var maxRows = sheet.getMaxRows();
  sheet.getRange(2, 1, maxRows - 1, 1).setNumberFormat('dd mmm yyyy, hh:mm am/pm');
  [4, 7, 10].forEach(function (col) {
    sheet.getRange(2, col, maxRows - 1, 1).setNumberFormat('0').setHorizontalAlignment('center');
  });
  [5, 6, 8, 9, 11, 12].forEach(function (col) {
    sheet.getRange(2, col, maxRows - 1, 1).setWrap(true).setVerticalAlignment('top');
  });

  // Conditional colours for ratings and status
  var rules = [];
  [4, 7, 10].forEach(function (col) {
    var r = sheet.getRange(2, col, maxRows - 1, 1);
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberLessThanOrEqualTo(2).setBackground('#FDE8E8').setFontColor('#B42318').setRanges([r]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(3).setBackground('#FEF4E2').setFontColor('#93610B').setRanges([r]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(4).setBackground('#E6F0FF').setFontColor('#0052CC').setRanges([r]).build());
  });
  var status = sheet.getRange(2, 13, maxRows - 1, 1);
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(CONFIG.STATUS_FOLLOW_UP).setBackground('#FDE8E8').setFontColor('#B42318').setRanges([status]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(CONFIG.STATUS_POSITIVE).setBackground('#E7F6EC').setFontColor('#067647').setRanges([status]).build());
  sheet.setConditionalFormatRules(rules);

  // System column used for de-duplication — kept out of the way.
  sheet.hideColumns(SUBMISSION_ID_COL);
  return sheet;
}

/* ───────────────────────────── Helpers ───────────────────────────── */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function error_(code, message) {
  return json_({ ok: false, status: 'error', code: code, message: message });
}

/** Editor smoke test: Run → testSubmission, then check the sheet and the execution log. */
function testSubmission() {
  var payload = {
    submissionId: 'test-' + Utilities.getUuid(),
    clientName: 'Test Client',
    mobile: '98765 43210',
    advisory: { rating: 5, reasons: [], comment: 'Great guidance' },
    services: { rating: 3, reasons: ['Delayed responses'], comment: '' },
    product: { rating: 2, reasons: ['Other'], comment: 'Wanted more debt fund options' },
    meta: { hp: '', elapsedMs: 42000, client: 'editor-test' },
  };
  var res = doPost({ postData: { contents: JSON.stringify(payload) } });
  console.log(res.getContent());
}
