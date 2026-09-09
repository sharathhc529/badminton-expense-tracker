/**
 * Google Sheets sync configuration.
 *
 * These defaults let the app auto-sync out of the box on any device/browser
 * without requiring the admin to manually paste the webhook URL into
 * localStorage first. The admin can still override the webhook URL via the
 * Google Sheets Sync modal, which takes precedence when set.
 */
export const SPREADSHEET_DIRECT_URL =
  'https://docs.google.com/spreadsheets/d/1Fn3TQNSse4Uh1oa1CoWjQGVbLxQv08Fcvx9A-ExBP60/edit';

export const DEFAULT_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwLWwWHPFPFoeTWvbODW9kZsIXy0_de0jN--FqMSyrePDwqOVtsv3oII23j2oaKlSO2hw/exec';

/**
 * Sent with every sync payload and checked by doPost in the deployed Apps
 * Script. This is NOT real security — it ships in the public JS bundle like
 * everything else here, so anyone who inspects this site's network requests
 * can read it. Its only purpose is to reject generic/automated requests from
 * bots that scan public GitHub repos for exposed script.google.com webhook
 * URLs and blast payloads at them without also inspecting the app's bundle.
 * The deployed Apps Script's copy of this value is set directly in the
 * script.google.com editor and intentionally does NOT match the placeholder
 * committed in google-sheets-script/code.gs.
 */
export const SHEETS_SYNC_TOKEN = 'e0380bc87e461c19a01a045bb52c7848e59e1d205069d2e3';
