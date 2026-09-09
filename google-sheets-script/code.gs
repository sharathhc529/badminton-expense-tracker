/**
 * ShuttleLedger - Google Sheets Realtime Auto-Sync Script
 * 
 * 💡 SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet in Google Drive (or create a new one at https://sheets.new)
 * 2. Copy the Spreadsheet ID or full URL from your browser address bar:
 *    Example URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 *    The ID is the part between "/d/" and "/edit"
 * 3. Paste your SPREADSHEET_ID or URL below in SPREADSHEET_ID_OR_URL.
 * 4. Click "Save", then click "Deploy" > "New deployment" > "Web app"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into ShuttleLedger!
 */

// 👇 PASTE YOUR GOOGLE SPREADSHEET ID OR FULL GOOGLE SHEET URL HERE:
var SPREADSHEET_ID_OR_URL = ""; 

function getTargetSpreadsheet() {
  if (SPREADSHEET_ID_OR_URL && SPREADSHEET_ID_OR_URL.trim() !== "") {
    var raw = SPREADSHEET_ID_OR_URL.trim();
    if (raw.indexOf("docs.google.com/spreadsheets/d/") !== -1) {
      var matches = raw.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matches && matches[1]) {
        return SpreadsheetApp.openById(matches[1]);
      }
    }
    return SpreadsheetApp.openById(raw);
  }

  // Fallback if script was created via Extensions > Apps Script
  return SpreadsheetApp.getActiveSpreadsheet();
}

// GET endpoint to test if webhook is working in browser
function doGet(e) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      return HtmlService.createHtmlOutput(
        "<h3>⚠️ Webhook is active, but no Spreadsheet is linked yet!</h3>" +
        "<p>Please open <code>code.gs</code>, paste your Google Sheet ID or URL in <code>SPREADSHEET_ID_OR_URL</code>, and redeploy.</p>"
      );
    }
    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif;padding:20px;'>" +
      "<h2 style='color:#10b981;'>✅ ShuttleLedger Google Sheets Webhook is Online!</h2>" +
      "<p>Connected to Google Sheet: <strong>" + ss.getName() + "</strong></p>" +
      "<p>URL: <a href='" + ss.getUrl() + "' target='_blank'>" + ss.getUrl() + "</a></p>" +
      "<p>Any change made in ShuttleLedger will automatically sync to this spreadsheet.</p>" +
      "</div>"
    );
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3 style='color:red;'>Error connecting to spreadsheet: " + err.toString() + "</h3>");
  }
}

// POST endpoint called automatically by ShuttleLedger on every update
function doPost(e) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No spreadsheet found. Please set SPREADSHEET_ID_OR_URL in code.gs"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var timestamp = new Date();

    // 1. Sync Balances Sheet
    if (data.balances && data.balances.length > 0) {
      var balanceSheet = ss.getSheetByName("Balances") || ss.insertSheet("Balances");
      balanceSheet.clear();
      balanceSheet.appendRow([
        "Player Name", "Type", "Total Paid (₹)", "Share Owed (₹)", 
        "Settlements Paid (₹)", "Settlements Received (₹)", "Net Balance (₹)", 
        "Status", "Days Played (This Month)", "Total Days Played"
      ]);
      balanceSheet.getRange("A1:J1").setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");

      data.balances.forEach(function(b) {
        var status = b.netBalance > 0 ? "In Advance (Surplus)" : (b.netBalance < 0 ? "Pending Due (To Pay)" : "Cleared");
        balanceSheet.appendRow([
          b.memberName,
          b.isGuest ? "Guest" : "Regular",
          b.totalPaid,
          b.totalShare,
          b.settlementsPaid,
          b.settlementsReceived,
          b.netBalance,
          status,
          b.daysAttendedCurrentMonth,
          b.daysAttendedTotal
        ]);
      });
      balanceSheet.autoResizeColumns(1, 10);
    }

    // 2. Sync Expenses Sheet
    if (data.expenses && data.expenses.length > 0) {
      var expSheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
      expSheet.clear();
      expSheet.appendRow([
        "Date", "Title", "Category", "Amount (₹)", "Paid By", "Split Type", "Target Month", "Splits Breakdown", "Notes"
      ]);
      expSheet.getRange("A1:I1").setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");

      data.expenses.forEach(function(exp) {
        var splitsStr = (exp.splits || []).map(function(s) {
          return s.memberName + ": ₹" + s.amount + (s.daysAttended !== undefined ? " (" + s.daysAttended + "d)" : "");
        }).join("; ");

        expSheet.appendRow([
          exp.date,
          exp.title,
          exp.category,
          exp.amount,
          exp.paidByName,
          exp.splitType,
          exp.monthTarget || "",
          splitsStr,
          exp.notes || ""
        ]);
      });
      expSheet.autoResizeColumns(1, 9);
    }

    // 3. Sync Attendance Sheet
    if (data.attendance && data.attendance.length > 0) {
      var attSheet = ss.getSheetByName("Attendance") || ss.insertSheet("Attendance");
      attSheet.clear();
      attSheet.appendRow(["Date", "Time Slot", "Total Attendees", "Attendee IDs/Names", "Guest Players", "Notes", "Updated At"]);
      attSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");

      data.attendance.forEach(function(att) {
        var guests = (att.guestAttendees || []).map(function(g) { return g.name; }).join(", ");
        attSheet.appendRow([
          att.date,
          att.timeSlot,
          (att.attendeeIds ? att.attendeeIds.length : 0) + (att.guestAttendees ? att.guestAttendees.length : 0),
          (att.attendeeIds || []).join(", "),
          guests,
          att.notes || "",
          att.updatedAt || new Date().toISOString()
        ]);
      });
      attSheet.autoResizeColumns(1, 7);
    }

    // 4. Log Sync Event
    var syncLogSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");
    syncLogSheet.appendRow([timestamp, "Successful Auto-Sync", (data.expenses ? data.expenses.length : 0) + " Expenses, " + (data.balances ? data.balances.length : 0) + " Players"]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Google Sheet '" + ss.getName() + "' updated successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
