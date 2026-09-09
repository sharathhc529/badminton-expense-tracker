/**
 * ShuttleLedger - Robust Google Sheets Realtime Auto-Sync Script
 * 
 * 💡 SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet in Google Drive:
 *    https://docs.google.com/spreadsheets/d/1Fn3TQNSse4Uh1oa1CoWjQGVbLxQv08Fcvx9A-ExBP60/edit
 * 2. Ensure SPREADSHEET_ID_OR_URL below is set.
 * 3. In Apps Script, click "Save" (💾).
 * 4. IMPORTANT: Click "Deploy" > "Manage deployments" > Click "Pencil (Edit)"
 *    -> Change Version to "New version" -> Click "Deploy"
 */

var SPREADSHEET_ID_OR_URL = "https://docs.google.com/spreadsheets/d/1Fn3TQNSse4Uh1oa1CoWjQGVbLxQv08Fcvx9A-ExBP60/edit";

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
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Test in browser by opening Web App URL
function doGet(e) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      return HtmlService.createHtmlOutput("<h3 style='color:red;'>⚠️ Spreadsheet not found! Check SPREADSHEET_ID_OR_URL.</h3>");
    }

    // Write a test row into Sync_Log to verify write permissions
    var logSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");
    logSheet.appendRow([new Date(), "Browser Test Visit (doGet)", "Connected to " + ss.getName()]);

    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif;padding:24px;background:#0f172a;color:#f8fafc;border-radius:12px;max-width:600px;margin:30px auto;'>" +
      "<h2 style='color:#10b981;margin-top:0;'>✅ ShuttleLedger Webhook is Connected!</h2>" +
      "<p>Connected Spreadsheet: <strong>" + ss.getName() + "</strong></p>" +
      "<p>Spreadsheet URL: <a style='color:#38bdf8;' href='" + ss.getUrl() + "' target='_blank'>" + ss.getUrl() + "</a></p>" +
      "<p style='color:#94a3b8;font-size:13px;'>A test entry was just written to the 'Sync_Log' tab of your spreadsheet to confirm write permissions.</p>" +
      "</div>"
    );
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3 style='color:red;'>Error: " + err.toString() + "</h3>");
  }
}

// Main POST webhook
function doPost(e) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Spreadsheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Parse payload from raw body or post data
    var rawContents = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    if (!rawContents && e && e.parameter && e.parameter.data) {
      rawContents = e.parameter.data;
    }

    var data = {};
    if (rawContents) {
      try {
        data = JSON.parse(rawContents);
      } catch (parseErr) {
        // Log parse error to sheet
        var debugSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");
        debugSheet.appendRow([new Date(), "Parse Error", parseErr.toString(), rawContents.substring(0, 150)]);
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "JSON Parse error" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    var timestamp = new Date();

    // 1. Balances Tab
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

    // 2. Expenses Tab
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

    // 3. Attendance Tab
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

    // 4. Log successful sync event
    var syncLogSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");
    syncLogSheet.appendRow([
      timestamp, 
      "Automatic Sync Success", 
      (data.expenses ? data.expenses.length : 0) + " Expenses, " + 
      (data.balances ? data.balances.length : 0) + " Balances, " + 
      (data.attendance ? data.attendance.length : 0) + " Attendance Sessions"
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Synced to " + ss.getName()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errorLogSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");
    errorLogSheet.appendRow([new Date(), "Error", err.toString()]);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
