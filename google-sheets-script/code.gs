/**
 * ShuttleLedger - Google Sheets Realtime Auto-Sync Script
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

function doGet(e) {
  try {
    var ss = getTargetSpreadsheet();
    var logSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");
    logSheet.appendRow([new Date(), "Browser GET Test", "Connected successfully"]);
    
    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif;padding:24px;background:#0f172a;color:#f8fafc;border-radius:12px;max-width:600px;margin:30px auto;'>" +
      "<h2 style='color:#10b981;margin-top:0;'>✅ ShuttleLedger Webhook is Connected!</h2>" +
      "<p>Connected Spreadsheet: <strong>" + ss.getName() + "</strong></p>" +
      "<p>Spreadsheet URL: <a style='color:#38bdf8;' href='" + ss.getUrl() + "' target='_blank'>" + ss.getUrl() + "</a></p>" +
      "</div>"
    );
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3 style='color:red;'>Error: " + err.toString() + "</h3>");
  }
}

function doPost(e) {
  var ss = getTargetSpreadsheet();
  var logSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");

  try {
    var raw = "";
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      raw = e.parameter.data;
    } else if (e && e.parameters && e.parameters.data) {
      raw = e.parameters.data[0];
    }

    logSheet.appendRow([new Date(), "doPost Received", "Payload Length: " + (raw ? raw.length : 0)]);

    if (!raw) {
      logSheet.appendRow([new Date(), "Warning", "Empty payload received"]);
      return ContentService.createTextOutput("Empty payload").setMimeType(ContentService.MimeType.TEXT);
    }

    var data = JSON.parse(raw);

    // Extract arrays with fallbacks
    var balances = data.balances || (data.data && data.data.balances) || [];
    var expenses = data.expenses || (data.data && data.data.expenses) || [];
    var attendance = data.attendance || (data.data && data.data.attendance) || [];

    // 1. Sync Balances Sheet
    if (balances && balances.length > 0) {
      var balanceSheet = ss.getSheetByName("Balances") || ss.insertSheet("Balances");
      balanceSheet.clear();
      balanceSheet.appendRow([
        "Player Name", "Type", "Total Paid (₹)", "Share Owed (₹)", 
        "Settlements Paid (₹)", "Settlements Received (₹)", "Net Balance (₹)", 
        "Status", "Days Played (This Month)", "Total Days Played"
      ]);
      balanceSheet.getRange("A1:J1").setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");

      balances.forEach(function(b) {
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
    if (expenses && expenses.length > 0) {
      var expSheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
      expSheet.clear();
      expSheet.appendRow([
        "Date", "Title", "Category", "Amount (₹)", "Paid By", "Split Type", "Target Month", "Splits Breakdown", "Notes"
      ]);
      expSheet.getRange("A1:I1").setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");

      expenses.forEach(function(exp) {
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
    if (attendance && attendance.length > 0) {
      var attSheet = ss.getSheetByName("Attendance") || ss.insertSheet("Attendance");
      attSheet.clear();
      attSheet.appendRow(["Date", "Time Slot", "Total Attendees", "Attendee IDs/Names", "Guest Players", "Notes", "Updated At"]);
      attSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");

      attendance.forEach(function(att) {
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

    logSheet.appendRow([
      new Date(), 
      "Sync Success", 
      balances.length + " Balances, " + expenses.length + " Expenses, " + attendance.length + " Attendance sessions written."
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logSheet.appendRow([new Date(), "Error in doPost", err.toString()]);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
