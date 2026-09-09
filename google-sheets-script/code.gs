/**
 * ShuttleLedger - Google Sheets Realtime Auto-Sync Script
 * 
 * Instructions:
 * 1. Open Google Sheets at https://sheets.new and name it "Badminton ShuttleLedger"
 * 2. Click Extensions > Apps Script
 * 3. Replace all code with this script and click "Save"
 * 4. Click "Deploy" > "New deployment"
 * 5. Select type: "Web app"
 *    - Description: ShuttleLedger Sync
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click "Deploy", authorize access, and copy the "Web app URL"
 * 7. In ShuttleLedger app, click the Sheets icon at the top and paste your Web App URL!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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

    // Log sync event
    var syncLogSheet = ss.getSheetByName("Sync_Log") || ss.insertSheet("Sync_Log");
    syncLogSheet.appendRow([timestamp, "Successful Sync", (data.expenses ? data.expenses.length : 0) + " Expenses, " + (data.balances ? data.balances.length : 0) + " Players"]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Google Sheet updated successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
