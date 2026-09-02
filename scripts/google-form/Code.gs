/**
 * ADT landing page -> Google Form
 *
 * Deployed as a Web app, this script accepts the JSON lead posted by
 * /api/lead and submits it as a real response to a Google Form, so leads land
 * in the form's response summary and its linked spreadsheet.
 *
 * Setup
 *   1. Paste this file into a new Apps Script project (script.google.com).
 *   2. Run createLeadForm() once. It builds a form with the questions this
 *      script expects and logs the form ID + URLs. Skip this if you already
 *      have a form -- just make sure its question titles match ITEM_TITLES
 *      below (or edit ITEM_TITLES to match your form).
 *   3. Put the form ID in FORM_ID.
 *   4. Optional but recommended: set SHARED_SECRET to a long random string.
 *   5. Deploy > New deployment > Web app.
 *        Execute as:    Me
 *        Who has access: Anyone
 *      Copy the /exec URL -- that is the URL to post to.
 *
 * The web app URL is public, which is why SHARED_SECRET exists: with it set,
 * the caller must pass the same value as ?token=... on the URL or as a
 * "token" field in the JSON body.
 */

/** ID of the Google Form to submit into (from createLeadForm, or the form's edit URL). */
const FORM_ID = 'PASTE_FORM_ID_HERE';

/** Leave '' to accept any caller. Set a long random string to require ?token=<value>. */
const SHARED_SECRET = '';

/**
 * Lead field -> the exact title of the form question it fills.
 * Titles are matched case-insensitively and ignoring surrounding whitespace.
 * A field with no matching question is skipped, so you can delete questions
 * you don't want without touching this script.
 */
const ITEM_TITLES = {
  name: 'Full name',
  email: 'Email',
  phone: 'Phone',
  zip: 'ZIP code',
  homeowner: 'Are you a homeowner?',
  creditScore620: 'Do you have at least a 620 credit score?',
  readyToInstall48: 'Are you ready to install within 48 hours?',
  qualified: 'Qualified',
  source: 'Source',
  submittedAt: 'Submitted at',
};

/** Entry point for the POST from /api/lead. */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'Empty request body.' });
    }

    let lead;
    try {
      lead = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonOut({ ok: false, error: 'Body is not valid JSON.' });
    }

    if (SHARED_SECRET) {
      const token = (e.parameter && e.parameter.token) || lead.token || '';
      if (token !== SHARED_SECRET) {
        return jsonOut({ ok: false, error: 'Unauthorized.' });
      }
    }

    const result = submitLead(lead);
    return jsonOut(result);
  } catch (err) {
    // Never throw: a thrown error becomes an HTML error page, which is far
    // harder to debug on the calling side than a JSON payload.
    console.error('LEAD -> FORM FAILED', err, e && e.postData && e.postData.contents);
    return jsonOut({ ok: false, error: String(err) });
  }
}

/** Health check, so you can open the /exec URL in a browser and see it's live. */
function doGet() {
  return jsonOut({ ok: true, status: 'ready' });
}

/**
 * Turns one lead into a submitted form response.
 * Returns { ok, filled, skipped } so the caller can see what actually landed.
 */
function submitLead(lead) {
  const form = FormApp.openById(FORM_ID);

  const values = {
    name: asText(lead.name),
    email: asText(lead.email),
    phone: formatPhone(lead.phone),
    zip: asText(lead.zip),
    homeowner: yesNo(lead.homeowner),
    creditScore620: yesNo(lead.creditScore620),
    readyToInstall48: yesNo(lead.readyToInstall48),
    qualified: yesNo(lead.qualified),
    source: asText(lead.source),
    submittedAt: formatTimestamp(lead.submittedAt),
  };

  // Index the form's questions by normalized title so lookups are cheap and
  // tolerant of stray whitespace / capitalization drift in the form.
  const itemsByTitle = {};
  form.getItems().forEach(function (item) {
    itemsByTitle[normalizeTitle(item.getTitle())] = item;
  });

  const response = form.createResponse();
  const filled = [];
  const skipped = [];

  Object.keys(ITEM_TITLES).forEach(function (field) {
    const value = values[field];
    if (value === '' || value === null || value === undefined) {
      skipped.push(field + ' (no value)');
      return;
    }

    const item = itemsByTitle[normalizeTitle(ITEM_TITLES[field])];
    if (!item) {
      skipped.push(field + ' (no question titled "' + ITEM_TITLES[field] + '")');
      return;
    }

    const itemResponse = buildItemResponse(item, value);
    if (!itemResponse) {
      skipped.push(field + ' (unsupported question type or value)');
      return;
    }

    response.withItemResponse(itemResponse);
    filled.push(field);
  });

  response.submit();

  if (skipped.length) {
    console.warn('LEAD -> FORM submitted with skipped fields: ' + skipped.join(', '));
  }

  return { ok: true, filled: filled, skipped: skipped };
}

/** Builds the right ItemResponse for the question's type, or null if it can't. */
function buildItemResponse(item, value) {
  try {
    switch (item.getType()) {
      case FormApp.ItemType.TEXT:
        return item.asTextItem().createResponse(value);
      case FormApp.ItemType.PARAGRAPH_TEXT:
        return item.asParagraphTextItem().createResponse(value);
      case FormApp.ItemType.MULTIPLE_CHOICE: {
        const mc = item.asMultipleChoiceItem();
        return mc.createResponse(matchChoice(mc.getChoices(), value));
      }
      case FormApp.ItemType.LIST: {
        const list = item.asListItem();
        return list.createResponse(matchChoice(list.getChoices(), value));
      }
      case FormApp.ItemType.CHECKBOX: {
        const cb = item.asCheckboxItem();
        return cb.createResponse([matchChoice(cb.getChoices(), value)]);
      }
      default:
        return null;
    }
  } catch (err) {
    console.warn('Could not answer "' + item.getTitle() + '" with "' + value + '": ' + err);
    return null;
  }
}

/**
 * Choice questions reject any value that isn't one of their options, so match
 * the option case-insensitively and hand back its exact text.
 */
function matchChoice(choices, value) {
  const wanted = String(value).trim().toLowerCase();
  for (let i = 0; i < choices.length; i++) {
    if (choices[i].getValue().trim().toLowerCase() === wanted) {
      return choices[i].getValue();
    }
  }
  return value; // Let createResponse throw; buildItemResponse logs and skips it.
}

function normalizeTitle(title) {
  return String(title || '').trim().toLowerCase();
}

function asText(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

/** Booleans arrive as true/false; strings pass through so "yes"/"no" also work. */
function yesNo(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  const text = asText(value).toLowerCase();
  if (text === 'yes' || text === 'true') return 'Yes';
  if (text === 'no' || text === 'false') return 'No';
  return '';
}

/** 5551234567 -> (555) 123-4567; anything else is passed through as typed. */
function formatPhone(value) {
  const digits = asText(value).replace(/\D/g, '');
  if (digits.length !== 10) return asText(value);
  return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
}

/** ISO timestamp -> readable local time in the script's timezone. */
function formatTimestamp(value) {
  const text = asText(value);
  if (!text) return '';
  const date = new Date(text);
  if (isNaN(date.getTime())) return text;
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss z');
}

function jsonOut(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Run once from the editor to build a form with the questions this script
 * expects. Logs the form ID to paste into FORM_ID.
 */
function createLeadForm() {
  const form = FormApp.create('ADT Landing Page Leads');
  form.setDescription('Leads captured by the ADT landing page. Submitted automatically.');
  form.setCollectEmail(false);

  form.addTextItem().setTitle(ITEM_TITLES.name);
  form.addTextItem().setTitle(ITEM_TITLES.email);
  form.addTextItem().setTitle(ITEM_TITLES.phone);
  form.addTextItem().setTitle(ITEM_TITLES.zip);

  [ITEM_TITLES.homeowner, ITEM_TITLES.creditScore620, ITEM_TITLES.readyToInstall48,
   ITEM_TITLES.qualified].forEach(function (title) {
    form.addMultipleChoiceItem().setTitle(title).setChoiceValues(['Yes', 'No']);
  });

  form.addTextItem().setTitle(ITEM_TITLES.source);
  form.addTextItem().setTitle(ITEM_TITLES.submittedAt);

  console.log('Form ID (paste into FORM_ID): ' + form.getId());
  console.log('Edit:      ' + form.getEditUrl());
  console.log('Responses: ' + form.getPublishedUrl());
  return form.getId();
}

/** Run from the editor to push one fake lead through and confirm the wiring. */
function testSubmit() {
  const result = submitLead({
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '5551234567',
    zip: '30301',
    homeowner: true,
    creditScore620: true,
    readyToInstall48: false,
    qualified: false,
    source: 'adt-landing-page',
    submittedAt: new Date().toISOString(),
  });
  console.log(JSON.stringify(result, null, 2));
}
