import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { formatCurrency } from '../services/calculation';
import { exportBalancesToCSV } from '../services/sheetsExport';
import { SettlementModal } from './SettlementModal';

export const BalancesLedger: React.FC = () => {
  const { memberBalances, settlements, deleteSettlement, members } = useAppData();

  const [settlementModalOpen, setSettlementModalOpen] = useState<boolean>(false);
  const [selectedMemberForSettlement, setSelectedMemberForSettlement] = useState<{
    fromId: string;
    toId?: string;
    amount?: number;
  } | null>(null);

  // Overall ledger totals
  const summaryTotals = useMemo(() => {
    let totalDues = 0;
    let totalAdvances = 0;

    memberBalances.forEach(b => {
      if (b.netBalance > 0) {
        totalAdvances += b.netBalance;
      } else if (b.netBalance < 0) {
        totalDues += Math.abs(b.netBalance);
      }
    });

    return { totalDues, totalAdvances };
  }, [memberBalances]);

  const handleOpenSettle = (memberId: string, currentBalance: number) => {
    if (currentBalance < 0) {
      // Member owes money -> Payer is this member
      setSelectedMemberForSettlement({
        fromId: memberId,
        amount: Math.abs(currentBalance),
      });
    } else {
      // Member is in advance -> Payer could be someone else settling to this member
      setSelectedMemberForSettlement({
        fromId: members.find(m => m.id !== memberId)?.id || memberId,
        toId: memberId,
        amount: currentBalance,
      });
    }
    setSettlementModalOpen(true);
  };

  const handleDeleteSettlement = async (id: string) => {
    if (window.confirm('Delete this settlement payment record?')) {
      await deleteSettlement(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-emerald-400" />
              <span>Player Balances & Advances</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ledger tracking total expenses paid, split shares, and cleared dues for all players
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportBalancesToCSV(memberBalances)}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-medium border border-slate-700 transition"
              title="Export Balances to CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setSelectedMemberForSettlement(null);
                setSettlementModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Settlement</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-400 uppercase font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Total Pending Dues</span>
              </span>
              <div className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(summaryTotals.totalDues)}</div>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-400 uppercase font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Total Pool Advances</span>
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {formatCurrency(summaryTotals.totalAdvances)}
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Member Balances Table & Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Player Ledger Status</h2>
          <span className="text-xs text-slate-400">{memberBalances.length} Registered Players</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-3">Total Paid</th>
                <th className="py-3.5 px-3">Share Owed</th>
                <th className="py-3.5 px-3">Settled</th>
                <th className="py-3.5 px-3">Days Played</th>
                <th className="py-3.5 px-4 text-right">Net Balance</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {memberBalances.map(item => {
                const member = members.find(m => m.id === item.memberId);
                const isAdvance = item.netBalance > 0;
                const isDue = item.netBalance < 0;
                const isCleared = item.netBalance === 0;

                return (
                  <tr key={item.memberId} className="hover:bg-slate-800/40 transition">
                    {/* Player Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={member?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.memberName}`}
                          alt={item.memberName}
                          className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {item.memberName}
                            {item.isGuest && (
                              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-normal">
                                Guest
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{member?.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Total Paid */}
                    <td className="py-3.5 px-3 font-semibold text-slate-200">{formatCurrency(item.totalPaid)}</td>

                    {/* Share Owed */}
                    <td className="py-3.5 px-3 text-slate-400">{formatCurrency(item.totalShare)}</td>

                    {/* Settled */}
                    <td className="py-3.5 px-3 text-slate-300">
                      {item.settlementsPaid > 0 ? (
                        <span className="text-emerald-400">+{formatCurrency(item.settlementsPaid)}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Days Played */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[11px] font-medium text-teal-300">
                        {item.daysAttendedCurrentMonth}d this mo ({item.daysAttendedTotal} total)
                      </span>
                    </td>

                    {/* Net Balance Status Badge */}
                    <td className="py-3.5 px-4 text-right">
                      {isAdvance && (
                        <div className="inline-flex flex-col items-end">
                          <span className="font-bold text-sm text-emerald-400">+{formatCurrency(item.netBalance)}</span>
                          <span className="text-[10px] text-emerald-500 font-medium">In Advance (Surplus)</span>
                        </div>
                      )}
                      {isDue && (
                        <div className="inline-flex flex-col items-end">
                          <span className="font-bold text-sm text-rose-400">-{formatCurrency(Math.abs(item.netBalance))}</span>
                          <span className="text-[10px] text-rose-400 font-medium">Pending Due (To Pay)</span>
                        </div>
                      )}
                      {isCleared && (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium bg-slate-800 px-2 py-1 rounded-full text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>All Cleared</span>
                        </span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenSettle(item.memberId, item.netBalance)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                          isDue
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isDue ? 'Clear Dues' : 'Settle'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Settlements History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-400" />
          <span>Settlement & Payment Log</span>
        </h2>

        {settlements.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 italic">No settlement transactions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {settlements.map(settle => (
              <div
                key={settle.id}
                className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      <span className="text-rose-300">{settle.fromMemberName}</span> paid{' '}
                      <strong className="text-emerald-400">{formatCurrency(settle.amount)}</strong> to{' '}
                      <span className="text-teal-300">{settle.toMemberName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{format(parseISO(settle.date), 'dd MMM yyyy')}</span>
                      <span>•</span>
                      <span className="bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 font-medium">
                        {settle.paymentMethod}
                      </span>
                      {settle.notes && <span>• "{settle.notes}"</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSettlement(settle.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title="Delete Settlement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settlement Modal Dialog */}
      <SettlementModal
        isOpen={settlementModalOpen}
        onClose={() => {
          setSettlementModalOpen(false);
          setSelectedMemberForSettlement(null);
        }}
        defaultFromMemberId={selectedMemberForSettlement?.fromId}
        defaultToMemberId={selectedMemberForSettlement?.toId}
        defaultAmount={selectedMemberForSettlement?.amount}
      />
    </div>
  );
};
