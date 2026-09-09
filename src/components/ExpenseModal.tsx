import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt, Users, Calculator, Info, Check } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Expense, ExpenseCategory, SplitType } from '../types';
import { calculateSplits, formatCurrency, getMonthlyAttendanceCounts } from '../services/calculation';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, editingExpense }) => {
  const { members, attendanceSessions, addExpense, updateExpense } = useAppData();

  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState<ExpenseCategory>('shuttles');
  const [paidById, setPaidById] = useState<string>('');
  const [splitType, setSplitType] = useState<SplitType>('all');
  const [monthTarget, setMonthTarget] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');

  // Hydrate on open / edit
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setDate(editingExpense.date);
      setCategory(editingExpense.category);
      setPaidById(editingExpense.paidById);
      setSplitType(editingExpense.splitType);
      setMonthTarget(editingExpense.monthTarget || editingExpense.date.slice(0, 7));
      setSelectedMemberIds(editingExpense.splits.map(s => s.memberId));
      setNotes(editingExpense.notes || '');
    } else {
      // Default state
      setTitle('');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setCategory('shuttles');
      const firstActive = members.find(m => m.isActive);
      setPaidById(firstActive ? firstActive.id : '');
      setSplitType('all');
      setMonthTarget(format(new Date(), 'yyyy-MM'));
      setSelectedMemberIds(members.filter(m => m.isActive).map(m => m.id));
      setCustomWeights({});
      setNotes('');
    }
  }, [editingExpense, isOpen, members]);

  // Adjust default splitType when category is court_monthly
  const handleCategoryChange = (newCat: ExpenseCategory) => {
    setCategory(newCat);
    if (newCat === 'court_monthly') {
      setSplitType('monthly_attendance_weighted');
      if (!title) setTitle(`Monthly Court Booking (${format(new Date(), 'MMMM')})`);
    } else if (newCat === 'shuttles' && !title) {
      setTitle('Yonex Shuttles Box');
    }
  };

  const parsedAmount = parseFloat(amount) || 0;

  // Live computed splits
  const computedSplits = useMemo(() => {
    return calculateSplits({
      amount: parsedAmount,
      splitType,
      allMembers: members,
      selectedMemberIds,
      monthTarget,
      attendanceSessions,
      customWeights,
    });
  }, [parsedAmount, splitType, members, selectedMemberIds, monthTarget, attendanceSessions, customWeights]);

  // Attendance counts for targeted month
  const monthlyAttendance = useMemo(() => {
    return getMonthlyAttendanceCounts(attendanceSessions, monthTarget);
  }, [attendanceSessions, monthTarget]);

  const totalMonthlyPlayerDays = useMemo(() => {
    return Object.values(monthlyAttendance).reduce((a, b) => a + b, 0);
  }, [monthlyAttendance]);

  const handleToggleMember = (id: string) => {
    setSelectedMemberIds(prev => (prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || parsedAmount <= 0 || !paidById) return;

    const paidByMember = members.find(m => m.id === paidById);

    const expensePayload = {
      title: title.trim(),
      amount: parsedAmount,
      date,
      category,
      paidById,
      paidByName: paidByMember ? paidByMember.name : 'Unknown',
      splitType,
      monthTarget: splitType.startsWith('monthly_attendance') ? monthTarget : undefined,
      splits: computedSplits,
      notes: notes.trim(),
    };

    if (editingExpense) {
      await updateExpense(editingExpense.id, expensePayload);
    } else {
      await addExpense(expensePayload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingExpense ? 'Edit Expense' : 'Add Badminton Expense'}
              </h3>
              <p className="text-xs text-slate-400">Record expense and configure smart distribution</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Quick presets & Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title *</label>
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1.5">
              {['Monthly Court Booking', 'Yonex Shuttles Box', 'Court Rent', 'Electrolytes & Drinks', 'Grip Tape'].map(
                preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTitle(preset);
                      if (preset === 'Monthly Court Booking') handleCategoryChange('court_monthly');
                      if (preset === 'Yonex Shuttles Box') handleCategoryChange('shuttles');
                    }}
                    className="shrink-0 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                  >
                    + {preset}
                  </button>
                )
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. September Court Booking at Smash Arena"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Amount, Date, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="₹ 5000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="court_monthly">🏸 Court (Monthly Booking)</option>
                <option value="court_hourly">⏱ Court (Hourly Slot)</option>
                <option value="shuttles">📦 Shuttlecocks</option>
                <option value="equipment">🎾 Equipment / Nets / Grips</option>
                <option value="snacks">🥤 Drinks & Snacks</option>
                <option value="tournament">🏆 Tournament / League</option>
                <option value="other">📝 Other</option>
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Who Paid the Amount? *</label>
            <select
              value={paidById}
              onChange={e => setPaidById(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.isGuest ? '(Guest)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split Rule Selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>How Should This Money Be Split?</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Split to All */}
              <button
                type="button"
                onClick={() => setSplitType('all')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  splitType === 'all'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Split to All</span>
                  {splitType === 'all' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">Equal split among all active group members</p>
              </button>

              {/* Option 2: Split to Specific */}
              <button
                type="button"
                onClick={() => setSplitType('specific')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  splitType === 'specific'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Specific Players</span>
                  {splitType === 'specific' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">Select specific individuals who participated</p>
              </button>

              {/* Option 3: Monthly Court Attendance Weighted */}
              <button
                type="button"
                onClick={() => setSplitType('monthly_attendance_weighted')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  splitType === 'monthly_attendance_weighted'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-teal-300">By Monthly Attendance</span>
                  {splitType === 'monthly_attendance_weighted' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Weighted by days played (e.g. 2 days vs 3 days share)
                </p>
              </button>
            </div>
          </div>

          {/* Conditional Options: Specific Members Checklist */}
          {splitType === 'specific' && (
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Select Members to Share:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {members.map(m => {
                  const checked = selectedMemberIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMember(m.id)}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border text-xs ${
                        checked
                          ? 'bg-emerald-950/80 border-emerald-500 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="rounded text-emerald-500" />
                      <span className="truncate">{m.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conditional Options: Monthly Attendance Month Target & Explanation */}
          {splitType.startsWith('monthly_attendance') && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Target Month for Attendance:</span>
                </span>
                <input
                  type="month"
                  value={monthTarget}
                  onChange={e => setMonthTarget(e.target.value)}
                  className="bg-slate-800 text-xs text-white px-2 py-1 rounded border border-emerald-500/40"
                />
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Total attendance in <strong>{monthTarget}</strong>: <strong>{totalMonthlyPlayerDays} player-days</strong>.{' '}
                {totalMonthlyPlayerDays > 0 ? (
                  <span>
                    Cost per session ={' '}
                    <strong className="text-emerald-400">{formatCurrency(parsedAmount / totalMonthlyPlayerDays)}</strong>
                    . Each member pays proportional to the days they played!
                  </span>
                ) : (
                  <span className="text-amber-300">
                    No attendance records found yet for {monthTarget}. Will fallback to equal split until attendance is logged.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Real-time Calculation Breakdown Preview */}
          {parsedAmount > 0 && computedSplits.length > 0 && (
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <span>Split Calculation Preview</span>
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Total: {formatCurrency(computedSplits.reduce((s, i) => s + i.amount, 0))}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {computedSplits.map(split => (
                  <div
                    key={split.memberId}
                    className="flex items-center justify-between text-xs bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-300 font-medium">{split.memberName}</span>
                      {split.daysAttended !== undefined && (
                        <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded-full">
                          {split.daysAttended} {split.daysAttended === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-emerald-400">{formatCurrency(split.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Receipt details (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI to court manager"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedAmount <= 0 || !title.trim()}
              className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-500/25"
            >
              {editingExpense ? 'Update Expense' : 'Save Expense & Split'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
