import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Wallet, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../services/calculation';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromMemberId?: string;
  defaultToMemberId?: string;
  defaultAmount?: number;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  defaultFromMemberId,
  defaultToMemberId,
  defaultAmount,
}) => {
  const { members, recordSettlement } = useAppData();
  const { showToast } = useToast();

  const [fromMemberId, setFromMemberId] = useState<string>('');
  const [toMemberId, setToMemberId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Other'>('UPI');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (defaultFromMemberId) {
        setFromMemberId(defaultFromMemberId);
      } else {
        const first = members.find(m => m.isActive);
        setFromMemberId(first ? first.id : '');
      }

      if (defaultToMemberId) {
        setToMemberId(defaultToMemberId);
      } else {
        const second = members.find(m => m.isActive && m.id !== defaultFromMemberId);
        setToMemberId(second ? second.id : 'group_pool');
      }

      if (defaultAmount && defaultAmount > 0) {
        setAmount(defaultAmount.toString());
      } else {
        setAmount('');
      }

      setDate(format(new Date(), 'yyyy-MM-dd'));
      setPaymentMethod('UPI');
      setNotes('Settlement payment');
    }
  }, [isOpen, defaultFromMemberId, defaultToMemberId, defaultAmount, members]);

  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromMemberId || !toMemberId || parsedAmount <= 0) return;

    const fromMember = members.find(m => m.id === fromMemberId);
    const toMember = toMemberId === 'group_pool' ? { name: 'Group Pool' } : members.find(m => m.id === toMemberId);

    const toName = toMember ? toMember.name : 'Group Pool';
    const fromName = fromMember ? fromMember.name : 'Unknown';

    await recordSettlement({
      date,
      fromMemberId,
      fromMemberName: fromName,
      toMemberId,
      toMemberName: toName,
      amount: parsedAmount,
      paymentMethod,
      notes: notes.trim(),
    });

    showToast({
      type: 'success',
      title: 'Settlement Recorded',
      description: `${fromName} paid ${formatCurrency(parsedAmount)} to ${toName} via ${paymentMethod}.`,
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Record Settlement</h3>
              <p className="text-xs text-slate-400">Clear balance or settle dues between players</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* From & To Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payer (Who Paid) *</label>
              <select
                value={fromMemberId}
                onChange={e => setFromMemberId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Receiver (Who Received) *</label>
              <select
                value={toMemberId}
                onChange={e => setToMemberId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="group_pool">🏦 Group Pool / Treasury</option>
                {members
                  .filter(m => m.id !== fromMemberId)
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Cleared (₹) *</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="₹ 1000"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(['UPI', 'Cash', 'Bank Transfer', 'Other'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition ${
                    paymentMethod === method
                      ? 'bg-emerald-500 text-white border-emerald-400 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Transaction Reference</label>
            <input
              type="text"
              placeholder="e.g. GPay UPI Ref 389271..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
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
              disabled={parsedAmount <= 0}
              className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Clear</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
