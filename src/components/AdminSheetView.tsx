import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  Lock,
  RefreshCw,
  Download,
  LogIn,
  UploadCloud,
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { SPREADSHEET_DIRECT_URL, DEFAULT_SHEETS_WEBHOOK_URL } from '../config/sheetsSync';
import { syncWithGoogleSheetsWebhook, exportBalancesToCSV, exportExpensesToCSV } from '../services/sheetsExport';

export const AdminSheetView: React.FC = () => {
  const { currentUser, isAdmin, signInGoogle } = useAuth();
  const { members, expenses, attendanceSessions, settlements, memberBalances, pushLocalDataToCloud } = useAppData();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isPushingToCloud, setIsPushingToCloud] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const handlePushToCloud = async () => {
    const confirmed = window.confirm(
      'This writes everything currently shown in this browser (members, expenses, attendance, settlements, audit logs) into the shared Firestore database, overwriting any matching documents already there. Continue?'
    );
    if (!confirmed) return;

    setIsPushingToCloud(true);
    setPushStatus('Pushing local data to Firestore...');
    const res = await pushLocalDataToCloud();
    setIsPushingToCloud(false);
    setPushStatus(res.message);
  };

  const handleManualSync = async () => {
    const webhookUrl = localStorage.getItem('shuttleledger_sheets_webhook') || DEFAULT_SHEETS_WEBHOOK_URL;

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
            onClick={() => signInGoogle().catch(err => console.warn('Sign-in failed or cancelled', err))}
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

        {syncStatus && (
          <div className="text-xs text-emerald-300 bg-black/20 p-3 rounded-xl border border-emerald-500/20">
            {syncStatus}
          </div>
        )}
      </div>

      {/* Push local data to Firestore */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-emerald-400" />
          <span>Cloud Database</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Writes everything currently shown in this browser into the shared Firestore database, so every signed-in
          member sees the same data instead of their own browser's local copy. Only needed once, or after a bulk
          local change you want everyone to see.
        </p>
        <button
          onClick={handlePushToCloud}
          disabled={isPushingToCloud}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition disabled:opacity-50"
        >
          <UploadCloud className={`w-3.5 h-3.5 text-emerald-400 ${isPushingToCloud ? 'animate-pulse' : ''}`} />
          <span>Push Local Data to Firestore</span>
        </button>
        {pushStatus && (
          <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            {pushStatus}
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
