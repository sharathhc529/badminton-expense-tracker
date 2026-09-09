import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { History, Search, Filter, FileSpreadsheet, User, ShieldAlert, Tag, Lock, LogIn } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { AuditLog, AuditActionType } from '../types';
import { exportAuditLogsToCSV } from '../services/sheetsExport';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useAppData();
  const { currentUser, isAdmin, signInGoogle } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch =
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = selectedAction === 'all' || log.action === selectedAction;

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchQuery, selectedAction]);

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE_EXPENSE':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Expense Added</span>;
      case 'UPDATE_EXPENSE':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Expense Updated</span>;
      case 'DELETE_EXPENSE':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Expense Deleted</span>;
      case 'UPDATE_ATTENDANCE':
        return <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Attendance Logged</span>;
      case 'POLL_VOTE':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Poll RSVP</span>;
      case 'RECORD_SETTLEMENT':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Settlement Recorded</span>;
      case 'ADD_MEMBER':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Player Added</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">System</span>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          The audit trail is restricted for group privacy. Only <strong className="text-white">{ADMIN_EMAIL}</strong>{' '}
          has access to this view.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Audit & Activity Trail</span>
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {auditLogs.length} Events Logged
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent immutable audit log tracking every user action, expense change, and attendance update
          </p>
        </div>

        <button
          onClick={() => exportAuditLogsToCSV(auditLogs)}
          className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-medium border border-slate-700 transition"
          title="Export Audit Logs to CSV"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by description or user..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Event Types</option>
            <option value="CREATE_EXPENSE">Expenses Created</option>
            <option value="UPDATE_EXPENSE">Expenses Updated</option>
            <option value="UPDATE_ATTENDANCE">Attendance Updates</option>
            <option value="RECORD_SETTLEMENT">Settlement Records</option>
            <option value="POLL_VOTE">Daily Poll RSVPs</option>
            <option value="ADD_MEMBER">Player Additions</option>
          </select>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No audit records match the selected filter.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="p-4 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start space-x-3">
                <img
                  src={log.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${log.user.name}`}
                  alt={log.user.name}
                  className="w-7 h-7 rounded-full border border-slate-700 shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white">{log.user.name}</span>
                    <span className="text-[11px] text-slate-500">({log.user.email || 'No email'})</span>
                    {getActionBadge(log.action)}
                  </div>
                  <p className="text-slate-300 font-medium">{log.description}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 shrink-0 text-right sm:pl-4">
                {format(parseISO(log.timestamp), 'dd MMM yyyy, hh:mm a')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
