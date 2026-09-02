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
4. Optional: set `SHARED_SECRET` to a long random string, and append
   `?token=THAT_VALUE` to the URL in `app/api/lead/route.ts`. The deployed URL
   has to be world-accessible for the site to post to it, so without a secret
   anyone who has the URL can file responses. The current deployment runs
   without one.
5. **Deploy → New deployment → Web app**, with:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the `/exec` URL. Run `testSubmit()` from the editor to confirm a row
   lands in the form.

## Pointing the site at it

The live deployment URL is hardcoded as `GOOGLE_FORM_WEBHOOK` in
`app/api/lead/route.ts`. Nothing to configure.

`app/api/lead/route.ts` posts each lead there *after* the existing CRM webhook
succeeds. If the Form call fails it is logged (`GOOGLE FORM REJECTED` /
`GOOGLE FORM FAILED`) and the visitor still sees a successful submit — the CRM
already has the lead, so a Form outage must never turn one away.

If you ever replace the deployment (**Deploy → New deployment**, rather than a
new version of the existing one), the URL changes and that constant needs
updating to match.

## Notes

- Apps Script always answers HTTP 200, so the `ok` field in its JSON body is
  the real result; the route checks that field.
- Redeploy (**Deploy → Manage deployments → Edit → New version**) after every
  edit to `Code.gs`, or the live URL keeps running the old code.
