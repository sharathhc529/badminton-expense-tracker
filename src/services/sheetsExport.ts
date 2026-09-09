import { Member, Expense, AttendanceSession, Settlement, AuditLog, MemberBalanceSummary } from '../types';
import { formatCurrency } from './calculation';

/**
 * Convert an array of objects to CSV string
 */
function arrayToCSV(rows: (string | number)[][]): string {
  return rows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Trigger file download in browser
 */
function downloadCSVFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Balances & Settlement Summary to Google Sheets CSV format
 */
export function exportBalancesToCSV(balances: MemberBalanceSummary[]): void {
  const headers = [
    'Player Name',
    'Type',
    'Total Paid (₹)',
    'Total Share Owed (₹)',
    'Settlements Paid (₹)',
    'Settlements Received (₹)',
    'Net Balance (₹)',
    'Status',
    'Sessions Attended (This Month)',
    'Sessions Attended (Total)',
  ];

  const rows = balances.map(b => [
    b.memberName,
    b.isGuest ? 'Guest' : 'Member',
    b.totalPaid,
    b.totalShare,
    b.settlementsPaid,
    b.settlementsReceived,
    b.netBalance,
    b.netBalance > 0 ? 'In Advance (To Receive)' : b.netBalance < 0 ? 'Pending Dues' : 'Cleared',
    b.daysAttendedCurrentMonth,
    b.daysAttendedTotal,
  ]);

  const csv = arrayToCSV([headers, ...rows]);
  downloadCSVFile(csv, `Badminton_Balances_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export All Expenses to Google Sheets CSV
 */
export function exportExpensesToCSV(expenses: Expense[]): void {
  const headers = [
    'Date',
    'Title',
    'Category',
    'Total Amount (₹)',
    'Paid By',
    'Split Type',
    'Target Month',
    'Splits Breakdown',
    'Notes',
    'Created By',
  ];

  const rows = expenses.map(e => [
    e.date,
    e.title,
    e.category,
    e.amount,
    e.paidByName,
    e.splitType,
    e.monthTarget || '',
    e.splits.map(s => `${s.memberName}: ₹${s.amount}${s.daysAttended ? ` (${s.daysAttended} days)` : ''}`).join('; '),
    e.notes || '',
    e.createdBy?.name || '',
  ]);

  const csv = arrayToCSV([headers, ...rows]);
  downloadCSVFile(csv, `Badminton_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export Attendance Records to CSV
 */
export function exportAttendanceToCSV(sessions: AttendanceSession[], members: Member[]): void {
  const memberMap = new Map(members.map(m => [m.id, m.name]));

  const headers = [
    'Date',
    'Time Slot',
    'Total Attendees',
    'Attendee Names',
    'Guest Attendees',
    'Notes',
    'Last Updated By',
  ];

  const rows = sessions.map(s => [
    s.date,
    s.timeSlot,
    s.attendeeIds.length + (s.guestAttendees?.length || 0),
    s.attendeeIds.map(id => memberMap.get(id) || id).join('; '),
    s.guestAttendees?.map(g => g.name).join('; ') || '',
    s.notes || '',
    s.updatedBy?.name || '',
  ]);

  const csv = arrayToCSV([headers, ...rows]);
  downloadCSVFile(csv, `Badminton_Attendance_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export Audit Logs to CSV
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): void {
  const headers = ['Timestamp', 'Action', 'Target', 'User Name', 'User Email', 'Description'];

  const rows = logs.map(l => [
    new Date(l.timestamp).toLocaleString(),
    l.action,
    l.targetType,
    l.user.name,
    l.user.email,
    l.description,
  ]);

  const csv = arrayToCSV([headers, ...rows]);
  downloadCSVFile(csv, `Badminton_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Webhook Sync with Google Sheets (via Google Apps Script Web App URL)
 */
export async function syncWithGoogleSheetsWebhook(
  webhookUrl: string,
  payload: {
    members: Member[];
    expenses: Expense[];
    attendance: AttendanceSession[];
    settlements: Settlement[];
    balances: MemberBalanceSummary[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      mode: 'no-cors', // Google Apps Script web app endpoint requirement
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });

    return {
      success: true,
      message: 'Sync payload dispatched to Google Sheets Webhook successfully!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to sync to Google Sheets webhook',
    };
  }
}
