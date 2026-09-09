import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  TrendingUp,
  Receipt,
  Users,
  Calendar,
  Wallet,
  ArrowRight,
  Sparkles,
  Plus,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../services/calculation';

interface DashboardOverviewProps {
  onNavigateTab: (tab: 'dashboard' | 'calendar' | 'expenses' | 'balances' | 'members' | 'audit' | 'poll') => void;
  onOpenExpenseModal: () => void;
  onOpenSettlementModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  onOpenExpenseModal,
  onOpenSettlementModal,
}) => {
  const { currentUser } = useAuth();
  const { expenses, attendanceSessions, memberBalances, members } = useAppData();

  const currentMonthStr = format(new Date(), 'yyyy-MM');

  // Stats
  const metrics = useMemo(() => {
    let monthlySpend = 0;
    let totalSpend = 0;

    expenses.forEach(e => {
      totalSpend += e.amount;
      if (e.date.startsWith(currentMonthStr)) {
        monthlySpend += e.amount;
      }
    });

    let currentMonthSessions = 0;
    attendanceSessions.forEach(s => {
      if (s.date.startsWith(currentMonthStr)) {
        currentMonthSessions += 1;
      }
    });

    // Find current user's balance
    const myBalance = memberBalances.find(
      b => b.memberName.toLowerCase() === currentUser?.name.toLowerCase() || b.memberId === currentUser?.linkedMemberId
    );

    return {
      monthlySpend,
      totalSpend,
      currentMonthSessions,
      totalSessions: attendanceSessions.length,
      myNetBalance: myBalance ? myBalance.netBalance : 0,
      myDaysThisMonth: myBalance ? myBalance.daysAttendedCurrentMonth : 0,
    };
  }, [expenses, attendanceSessions, memberBalances, currentMonthStr, currentUser]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Fast Actions */}
      <div className="bg-gradient-to-r from-emerald-900/50 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            🏸 Badminton Club Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Hello, {currentUser?.name.split(' ')[0] || 'Player'}!
          </h1>
          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
            Welcome to ShuttleLedger. Mark your attendance for tomorrow's 6-7 AM session below, log court booking shares, and keep balances crystal clear.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={onOpenExpenseModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Court / Shuttle Expense</span>
            </button>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>View Attendance Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Poll & RSVP teaser -> full experience lives at /poll */}
      <button
        onClick={() => onNavigateTab('poll')}
        className="w-full flex items-center justify-between bg-gradient-to-r from-emerald-900/50 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg hover:border-emerald-500/60 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div>
            <div className="text-sm font-bold text-white">🏸 Daily RSVP Poll</div>
            <div className="text-xs text-slate-400">Mark your attendance for today's 6-7 AM session</div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
      </button>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Spend */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition shadow-lg space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold text-slate-400">This Month's Spend</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(metrics.monthlySpend)}</div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Total: {formatCurrency(metrics.totalSpend)}</span>
            <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition">View &rarr;</span>
          </p>
        </div>

        {/* Card 2: Attendance Sessions */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition shadow-lg space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold text-slate-400">Monthly Sessions</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{metrics.currentMonthSessions} Sessions</div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{metrics.totalSessions} Total Sessions Held</span>
            <span className="text-teal-400 font-medium group-hover:translate-x-0.5 transition">Open &rarr;</span>
          </p>
        </div>

        {/* Card 3: Active Registered Players */}
        <div
          onClick={() => onNavigateTab('members')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition shadow-lg space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold text-slate-400">Active Players</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{members.filter(m => m.isActive).length} Players</div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{members.filter(m => m.isGuest).length} Outside Guests</span>
            <span className="text-cyan-400 font-medium group-hover:translate-x-0.5 transition">Manage &rarr;</span>
          </p>
        </div>

        {/* Card 4: Your Personal Ledger Balance */}
        <div
          onClick={() => onNavigateTab('balances')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition shadow-lg space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold text-slate-400">Your Net Balance</span>
            <div
              className={`p-2 rounded-xl group-hover:scale-110 transition ${
                metrics.myNetBalance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black ${
              metrics.myNetBalance > 0
                ? 'text-emerald-400'
                : metrics.myNetBalance < 0
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {metrics.myNetBalance > 0 ? `+${formatCurrency(metrics.myNetBalance)}` : formatCurrency(metrics.myNetBalance)}
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {metrics.myNetBalance > 0
                ? 'In Advance'
                : metrics.myNetBalance < 0
                ? 'Pending Due'
                : 'All Settled'}
            </span>
            <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition">Ledger &rarr;</span>
          </p>
        </div>
      </div>

      {/* Two Column Section: Recent Expenses & Member Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Recent Expenses</span>
            </h2>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              View All ({expenses.length})
            </button>
          </div>

          <div className="space-y-2">
            {expenses.slice(0, 4).map(exp => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{exp.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Paid by <span className="text-emerald-400 font-medium">{exp.paidByName}</span> on{' '}
                    {format(parseISO(exp.date), 'dd MMM')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">{formatCurrency(exp.amount)}</div>
                  <div className="text-[10px] text-slate-500">
                    {exp.splitType === 'monthly_attendance_weighted' ? 'By Attendance' : 'Equal Split'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Player Standings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-teal-400" />
              <span>Current Balances</span>
            </h2>
            <button
              onClick={() => onNavigateTab('balances')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
            >
              Open Ledger &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {memberBalances.slice(0, 4).map(item => (
              <div
                key={item.memberId}
                className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="font-bold text-white">{item.memberName}</div>
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded">
                    {item.daysAttendedCurrentMonth}d played
                  </span>
                </div>
                <div className="text-right">
                  {item.netBalance > 0 ? (
                    <span className="font-bold text-emerald-400">+{formatCurrency(item.netBalance)}</span>
                  ) : item.netBalance < 0 ? (
                    <span className="font-bold text-rose-400">-{formatCurrency(Math.abs(item.netBalance))}</span>
                  ) : (
                    <span className="text-slate-400">Cleared (₹0)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
