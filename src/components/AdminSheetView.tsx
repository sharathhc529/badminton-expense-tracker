import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  Lock,
  RefreshCw,
  Clock,
  Download,
  LogIn,
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { format, parseISO } from 'date-fns';
import { SPREADSHEET_DIRECT_URL } from './GoogleSheetsModal';
import { syncWithGoogleSheetsWebhook, exportBalancesToCSV, exportExpensesToCSV } from '../services/sheetsExport';

export const AdminSheetView: React.FC = () => {
  const { currentUser, isAdmin, signInGoogle } = useAuth();
  const { members, expenses, attendanceSessions, settlements, memberBalances, lastSyncedAt } = useAppData();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const formattedLastSync = lastSyncedAt
    ? format(parseISO(lastSyncedAt), 'dd MMM yyyy, hh:mm a')
    : 'Not synced yet';

  const handleManualSync = async () => {
    const webhookUrl = localStorage.getItem('shuttleledger_sheets_webhook');
    if (!webhookUrl) return;

    setIsSyncing(true);
    setSyncStatus('Dispatching live sync...');

    const res = await syncWithGoogleSheetsWebhook(webhookUrl, {
      members,
      expenses,
      attendance: attendanceSessions,
      settlements,
      balances: memberBalances,
    });

    setIsSyncing(false);
    setSyncStatus(res.message);
  };

  // Unauthorized view for non-admin users
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          The central Google Drive spreadsheet link and script configuration are restricted for group privacy. Only{' '}
          <strong className="text-white">{ADMIN_EMAIL}</strong> has access to this view.
        </p>

        {currentUser ? (
          <div className="text-xs text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-800">
            Currently logged in as: <strong className="text-slate-300">{currentUser.email}</strong>
          </div>
        ) : (
          <button
            onClick={() => signInGoogle()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs shadow transition"
          >
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>Sign in as {ADMIN_EMAIL}</span>
          </button>
        )}
      </div>
    );
  }

  // Admin exclusive portal
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Private Sheet Portal</span>
          </span>
          <span className="text-xs text-slate-400">{currentUser?.email}</span>
        </div>

        <h1 className="text-2xl font-black text-white">Badminton ShuttleLedger Spreadsheet</h1>
        <p className="text-xs text-slate-300 leading-relaxed">
          This portal allows direct Google Drive access, real-time background sync checks, and manual spreadsheet dispatches.
        </p>

        <div className="pt-3 flex flex-wrap gap-3">
          <a
            href={SPREADSHEET_DIRECT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Open Google Sheet in Drive</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Force Resync Now</span>
          </button>
        </div>
      </div>

      {/* Sync Diagnostics & Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Real-time Sync Diagnostics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Last Auto-Sync Timestamp</span>
            <div className="text-base font-bold text-white mt-1">{formattedLastSync}</div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Sync Target Document</span>
            <div className="text-base font-bold text-emerald-400 mt-1 truncate">
              Badminton ShuttleLedger
            </div>
          </div>
        </div>

        {syncStatus && (
          <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            {syncStatus}
          </div>
        )}
      </div>

      {/* CSV Downloads for Backup */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Download Offline CSV Backups</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => exportBalancesToCSV(memberBalances)}
            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 text-xs font-semibold text-white transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Balances CSV</span>
          </button>
          <button
            onClick={() => exportExpensesToCSV(expenses)}
            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 text-xs font-semibold text-white transition"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Expenses CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
