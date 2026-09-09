import React, { useState } from 'react';
import { FileSpreadsheet, Download, RefreshCw, Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import {
  exportBalancesToCSV,
  exportExpensesToCSV,
  exportAttendanceToCSV,
  exportAuditLogsToCSV,
  syncWithGoogleSheetsWebhook,
} from '../services/sheetsExport';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ isOpen, onClose }) => {
  const { members, expenses, attendanceSessions, settlements, auditLogs, memberBalances } = useAppData();

  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('shuttleledger_sheets_webhook') || '';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleSaveAndSync = async () => {
    if (!webhookUrl.trim()) return;
    localStorage.setItem('shuttleledger_sheets_webhook', webhookUrl.trim());
    setIsSyncing(true);
    setSyncStatus('Dispatching sync payload...');

    const res = await syncWithGoogleSheetsWebhook(webhookUrl.trim(), {
      members,
      expenses,
      attendance: attendanceSessions,
      settlements,
      balances: memberBalances,
    });

    setIsSyncing(false);
    setSyncStatus(res.message);
  };

  const sampleAppsScriptCode = `// Google Apps Script code to paste into Extensions > Apps Script in your Google Sheet
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  
  // Log receipt timestamp
  var logSheet = sheet.getSheetByName("ShuttleLedger_Sync") || sheet.insertSheet("ShuttleLedger_Sync");
  logSheet.appendRow([new Date(), "Synced " + data.expenses.length + " expenses, " + data.members.length + " players"]);
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Google Sheets Integration & Exports</h3>
              <p className="text-xs text-slate-400">Download formatted sheets or sync real-time via Webhook</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        {/* Section 1: Instant CSV Exports */}
        <div className="mt-5 space-y-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            1-Click Google Sheets Compatible CSV Downloads
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => exportBalancesToCSV(memberBalances)}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 text-left transition"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Balances & Ledger</div>
                <div className="text-[10px] text-slate-400">Dues, advances, days played</div>
              </div>
            </button>

            <button
              onClick={() => exportExpensesToCSV(expenses)}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 text-left transition"
            >
              <Download className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Expenses & Splits</div>
                <div className="text-[10px] text-slate-400">Court fees & itemized splits</div>
              </div>
            </button>

            <button
              onClick={() => exportAttendanceToCSV(attendanceSessions, members)}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 text-left transition"
            >
              <Download className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Attendance Logs</div>
                <div className="text-[10px] text-slate-400">Sessions, attendees & guests</div>
              </div>
            </button>

            <button
              onClick={() => exportAuditLogsToCSV(auditLogs)}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 text-left transition"
            >
              <Download className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Full Audit Trail</div>
                <div className="text-[10px] text-slate-400">All timestamps & user edits</div>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Google Sheets Webhook Sync */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Real-time Google Apps Script Webhook
            </span>
            <button
              onClick={handleCopyScript}
              className="text-[11px] text-teal-300 hover:text-teal-200 flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied Script!' : 'Copy Apps Script'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Google Apps Script Web App Deployment URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveAndSync}
                disabled={isSyncing || !webhookUrl.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {syncStatus && (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              {syncStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-5 mt-5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
