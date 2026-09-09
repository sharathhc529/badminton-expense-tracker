import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  Check,
  Copy,
  ExternalLink,
  Lock,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import {
  exportBalancesToCSV,
  exportExpensesToCSV,
  exportAttendanceToCSV,
  exportAuditLogsToCSV,
  syncWithGoogleSheetsWebhook,
} from '../services/sheetsExport';
import { format, parseISO } from 'date-fns';
import { SPREADSHEET_DIRECT_URL, DEFAULT_SHEETS_WEBHOOK_URL } from '../config/sheetsSync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export { SPREADSHEET_DIRECT_URL };

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isAdmin } = useAuth();
  const { members, expenses, attendanceSessions, settlements, auditLogs, memberBalances, lastSyncedAt } = useAppData();

  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('shuttleledger_sheets_webhook') || DEFAULT_SHEETS_WEBHOOK_URL;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSaveAndSync = async () => {
    if (!webhookUrl.trim() || !isAdmin) return;
    localStorage.setItem('shuttleledger_sheets_webhook', webhookUrl.trim());
    setIsSyncing(true);
    setSyncStatus('Syncing changes to Google Sheet...');

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

  const formattedLastSync = lastSyncedAt
    ? format(parseISO(lastSyncedAt), 'dd MMM yyyy, hh:mm a')
    : 'Not synced yet';

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
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Google Sheets Sync</span>
                {isAdmin ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin View
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Member View
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Automated background sync to Google Drive</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        {/* Real-time Sync Status Card */}
        <div className="mt-5 bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time Sync Status:</span>
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Live Auto-Sync Active
            </span>
          </div>

          <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
            <span className="text-slate-400">Last Synced:</span>
            <strong className="text-white bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700">
              {formattedLastSync}
            </strong>
          </div>
        </div>

        {/* Non-Admin Privacy Notice */}
        {!isAdmin && (
          <div className="mt-4 bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <Lock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Restricted Admin Configuration</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Google Sheet webhooks, export credentials, and direct document access are managed exclusively by the group admin (<strong>{ADMIN_EMAIL}</strong>) for member privacy.
            </p>
          </div>
        )}

        {/* Admin Exclusive Controls (Visible ONLY to sharathhc529@gmail.com) */}
        {isAdmin && (
          <div className="mt-5 space-y-4">
            {/* Direct Sheet Launcher */}
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-300 block">Direct Spreadsheet Access</span>
                <span className="text-[11px] text-slate-400">Badminton ShuttleLedger in Google Drive</span>
              </div>
              <a
                href={SPREADSHEET_DIRECT_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Webhook Configuration & Manual Resync */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Google Apps Script Web App Deployment URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
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

              {syncStatus && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  {syncStatus}
                </div>
              )}
            </div>

            {/* CSV Backup Downloads */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Download Offline CSV Backups</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => exportBalancesToCSV(memberBalances)}
                  className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 p-2.5 rounded-xl border border-slate-700 text-xs text-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Balances CSV</span>
                </button>
                <button
                  onClick={() => exportExpensesToCSV(expenses)}
                  className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 p-2.5 rounded-xl border border-slate-700 text-xs text-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Expenses CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
