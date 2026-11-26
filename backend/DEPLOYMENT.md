# Deploying the Feedback API (Google Apps Script → Google Sheets)

About 10 minutes, done once. You need a Google account that should own the feedback data.

## 1. Create the sheet and the script

1. Open <https://sheets.new> and name the spreadsheet, e.g. **Fintness — Client Feedback**.
2. In the sheet: **Extensions → Apps Script**.
3. Delete the sample code in `Code.gs` and paste in the whole of [`backend/Code.gs`](Code.gs).
4. Optional but recommended: **Project Settings (⚙) → tick "Show appsscript.json"**, open it, and replace its contents with [`backend/appsscript.json`](appsscript.json). This sets the timezone to Asia/Kolkata and the V8 runtime.
5. Click **Save** (💾).

## 2. Build the sheet

1. In the function dropdown at the top, choose **`setup`** and click **Run**.
2. Google asks for permission. Choose your account, then **Advanced → Go to (project) (unsafe) → Allow**. The warning appears because this is your own private script, not a published app.
3. Go back to the spreadsheet. A **Feedback** tab now exists with:
   - columns **A–M** exactly as specified (Timestamp … Overall Submission Status)
   - a hidden column **N, Submission ID**, used only to block duplicate submissions
   - frozen header, colour-coded ratings (≤2 red, 3 amber, ≥4 blue) and status
4. Optional smoke test: choose **`testSubmission`** and click **Run**. A test row appears. Delete it afterwards.

> Using a standalone script instead (from script.google.com, not from a sheet)? `setup()` creates a new spreadsheet in your Drive and remembers it. The URL is printed in the execution log.

## 3. Deploy as a Web App

1. **Deploy → New deployment**.
2. Click the gear icon (⚙) next to "Select type" and choose **Web app**.
3. Settings:
   - **Description:** `Feedback API v1`
   - **Execute as:** **Me**. The script writes to your sheet, so clients never need access to it.
   - **Who has access:** **Anyone**. This is required because clients aren't signed in to Google.
4. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
5. Check it: open the URL in a browser. You should see:
   ```json
   {"ok":true,"status":"ready","service":"fintness-feedback","version":1}
   ```

## 4. Point the frontend at it

Create `app/.env.local` (or set the same variable in your hosting provider):

```bash
VITE_FEEDBACK_ENDPOINT=https://script.google.com/macros/s/AKfy…/exec
```

Then rebuild: `cd app && npm run build`. The URL is public by design and contains no credentials. Every check happens on the server.

## Updating the script later

Edit `Code.gs`, then go to **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
The `/exec` URL **stays the same**. Don't use "New deployment", which creates a new URL.

## What the backend guarantees

| Concern | How |
| --- | --- |
| Server-side timestamp | `new Date()` in Apps Script. The client never sends a time. |
| Ratings | Must be whole numbers 1–5 and are stored as numbers. |
| Reasons for ratings < 4 | Required. Each reason must come from the allowed list for its category. "Other" needs a comment. |
| Reasons for ratings ≥ 4 | Ignored even if sent, so the sheet stays clean. |
| Sanitising | Control and zero-width characters are removed, whitespace is collapsed, lengths are capped (name 80, comments 1000). Cells starting with `= + - @` are stored as text, which blocks formula injection. |
| Mobile | Optional. Indian numbers become `+91XXXXXXXXXX`. International numbers need a leading `+`. |
| Duplicates | Each journey sends a UUID. A script lock, a cache check and a lookup in the sheet mean a retried or double-tapped submission is written **once**. |
| Bots | A hidden honeypot field. Filled-in submissions are acknowledged but not stored. |
| Responses | Always JSON: `{ ok, status: "success" \| "error", code?, message, errors? }`. The UI only shows success when `ok: true` and `status: "success"`. |
| Overall Submission Status (M) | `Needs Follow-up` if any rating is below 4, otherwise `Positive`. |

## Troubleshooting

- **The browser shows a Google sign-in page instead of JSON:** access isn't set to **Anyone**. Edit the deployment.
- **"No spreadsheet configured":** run `setup()` once from the editor.
- **Changes don't seem live:** you need to publish a **New version** of the existing deployment (see above).
- **CORS errors:** the frontend deliberately posts as `text/plain`, because Apps Script can't answer CORS preflight requests. Keep it that way.
- **Logs:** Apps Script editor → **Executions**.
