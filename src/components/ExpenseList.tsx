import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Receipt,
  Search,
  Filter,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Plus,
  ArrowUpDown,
  Tag,
  Calendar,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { Expense, ExpenseCategory } from '../types';
import { formatCurrency } from '../services/calculation';
import { exportExpensesToCSV } from '../services/sheetsExport';

interface ExpenseListProps {
  onOpenExpenseModal: () => void;
  onEditExpense: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ onOpenExpenseModal, onEditExpense }) => {
  const { expenses, deleteExpense } = useAppData();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Available months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => {
      if (e.date) months.add(e.date.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.paidByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || exp.category === selectedCategory;
      const matchesMonth = selectedMonth === 'all' || exp.date.startsWith(selectedMonth);

      return matchesSearch && matchesCat && matchesMonth;
    });
  }, [expenses, searchQuery, selectedCategory, selectedMonth]);

  // Category summary totals
  const summaryStats = useMemo(() => {
    let total = 0;
    let courtTotal = 0;
    let shuttlesTotal = 0;

    filteredExpenses.forEach(e => {
      total += e.amount;
      if (e.category === 'court_monthly' || e.category === 'court_hourly') {
        courtTotal += e.amount;
      }
      if (e.category === 'shuttles') {
        shuttlesTotal += e.amount;
      }
    });

    return { total, courtTotal, shuttlesTotal };
  }, [filteredExpenses]);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      await deleteExpense(id);
      showToast({ type: 'success', title: 'Expense Deleted', description: `"${title}" was removed.` });
    }
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'court_monthly':
        return '🏸 Monthly Court';
      case 'court_hourly':
        return '⏱ Hourly Court';
      case 'shuttles':
        return '📦 Shuttles';
      case 'equipment':
        return '🎾 Equipment';
      case 'snacks':
        return '🥤 Snacks/Drinks';
      case 'tournament':
        return '🏆 Tournament';
      default:
        return '📝 Other';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-400" />
              <span>Group Expenses</span>
              <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {filteredExpenses.length} Records
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Track court bookings, shuttles, and custom split distributions</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportExpensesToCSV(expenses)}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-medium border border-slate-700 transition"
              title="Export all expenses to CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenExpenseModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Expenses</span>
            <div className="text-xl font-bold text-white mt-0.5">{formatCurrency(summaryStats.total)}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-teal-400 uppercase font-semibold">Court Booking Share</span>
            <div className="text-xl font-bold text-teal-300 mt-0.5">{formatCurrency(summaryStats.courtTotal)}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold">Shuttlecocks / Other</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{formatCurrency(summaryStats.shuttlesTotal)}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, paid by, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="court_monthly">Monthly Court</option>
            <option value="court_hourly">Hourly Court</option>
            <option value="shuttles">Shuttles</option>
            <option value="equipment">Equipment</option>
            <option value="snacks">Snacks/Drinks</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Month Filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Items List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Expenses Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No matching expense records. Click "Add Expense" to log court bookings, shuttle purchases, or group items.
            </p>
          </div>
        ) : (
          filteredExpenses.map(exp => (
            <div
              key={exp.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition shadow-lg space-y-3"
            >
              {/* Top Row: Title, Amount, Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white">{exp.title}</h3>
                    <span className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                      {getCategoryLabel(exp.category)}
                    </span>
                    {exp.splitType === 'monthly_attendance_weighted' && (
                      <span className="text-[11px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-medium">
                        By Attendance ({exp.monthTarget})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>
                      Date: <strong className="text-slate-300">{format(parseISO(exp.date), 'dd MMM yyyy')}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Paid by: <strong className="text-emerald-400">{exp.paidByName}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{formatCurrency(exp.amount)}</div>
                    <div className="text-[10px] text-slate-500">
                      {exp.splits.length} {exp.splits.length === 1 ? 'person' : 'people'} split
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                      title="Edit Expense"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id, exp.title)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Splits Breakdown Pills */}
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Split Breakdown:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {exp.splits.map((s, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center space-x-1.5"
                    >
                      <span className="text-slate-300 font-medium">{s.memberName}:</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(s.amount)}</span>
                      {s.daysAttended !== undefined && (
                        <span className="text-[10px] text-teal-400">({s.daysAttended}d)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Footer Info */}
              {exp.notes && <p className="text-xs text-slate-400 italic">"{exp.notes}"</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
