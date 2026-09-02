# Leads → Google Form

`Code.gs` is a Google Apps Script web app that takes the JSON lead posted by
`/api/lead` and submits it as a real Google Form response, so every lead shows
up in the form's response summary and its linked spreadsheet.

## Payload it expects

Exactly what `app/api/lead/route.ts` sends:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "5551234567",
  "zip": "30301",
  "homeowner": true,
  "creditScore620": true,
  "readyToInstall48": false,
  "qualified": false,
  "source": "adt-landing-page",
  "submittedAt": "2026-09-02T15:04:05.000Z"
}
```

Booleans are written to the form as `Yes` / `No`, the phone is formatted as
`(555) 123-4567`, and `submittedAt` is converted to the script's local timezone.

## Setup

1. Go to <https://script.google.com>, create a new project, and paste in
   `Code.gs`.
2. Run `createLeadForm()` once. It creates a form with the questions the script
   expects and logs the form ID. (Already have a form? Skip this and instead
   make its question titles match the `ITEM_TITLES` map — or edit `ITEM_TITLES`
   to match your form. Any field with no matching question is skipped, not an
   error.)
3. Paste the form ID into `FORM_ID`.
4. Set `SHARED_SECRET` to a long random string. Recommended — the deployed URL
   is public, and without a secret anyone who has it can file responses.
5. **Deploy → New deployment → Web app**, with:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the `/exec` URL. Run `testSubmit()` from the editor to confirm a row
   lands in the form.

## Pointing the site at it

Set one environment variable in the deployment (Vercel → Settings → Environment
Variables):

```
GOOGLE_FORM_WEBHOOK_URL=https://script.google.com/macros/s/AKfy.../exec?token=YOUR_SHARED_SECRET
```

`app/api/lead/route.ts` posts each lead there *after* the existing CRM webhook
succeeds. If the Form call fails it is logged (`GOOGLE FORM REJECTED` /
`GOOGLE FORM FAILED`) and the visitor still sees a successful submit — the CRM
already has the lead, so a Form outage must never turn one away.

Leave `GOOGLE_FORM_WEBHOOK_URL` unset and nothing changes.

## Notes

- Apps Script always answers HTTP 200, so the `ok` field in its JSON body is
  the real result; the route checks that field.
- Redeploy (**Deploy → Manage deployments → Edit → New version**) after every
  edit to `Code.gs`, or the live URL keeps running the old code.
