import { Member, Expense, AttendanceSession, Settlement, MemberBalanceSummary, ExpenseSplit } from '../types';

/**
 * Format currency nicely (defaults to Indian Rupee ₹ with locale formatting)
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Calculate attendance days for members in a given month (format: YYYY-MM)
 */
export function getMonthlyAttendanceCounts(
  sessions: AttendanceSession[],
  monthStr: string // "YYYY-MM"
): Record<string, number> {
  const counts: Record<string, number> = {};

  sessions.forEach(session => {
    if (session.date.startsWith(monthStr)) {
      session.attendeeIds.forEach(memberId => {
        counts[memberId] = (counts[memberId] || 0) + 1;
      });
    }
  });

  return counts;
}

/**
 * Calculate dynamic expense splits
 */
export function calculateSplits({
  amount,
  splitType,
  allMembers,
  selectedMemberIds = [],
  monthTarget = new Date().toISOString().slice(0, 7),
  attendanceSessions = [],
  customWeights,
}: {
  amount: number;
  splitType: 'all' | 'specific' | 'monthly_attendance_weighted' | 'monthly_attendance_equal';
  allMembers: Member[];
  selectedMemberIds?: string[];
  monthTarget?: string;
  attendanceSessions?: AttendanceSession[];
  customWeights?: Record<string, number>;
}): ExpenseSplit[] {
  if (amount <= 0) return [];

  const activeMembers = allMembers.filter(m => m.isActive);

  if (splitType === 'all') {
    if (activeMembers.length === 0) return [];
    const perPerson = Math.floor((amount / activeMembers.length) * 100) / 100;
    let remainder = Math.round((amount - perPerson * activeMembers.length) * 100) / 100;

    return activeMembers.map((m, idx) => {
      const extra = idx === 0 ? remainder : 0;
      return {
        memberId: m.id,
        memberName: m.name,
        amount: Math.round((perPerson + extra) * 100) / 100,
      };
    });
  }

  if (splitType === 'specific') {
    const selected = activeMembers.filter(m => selectedMemberIds.includes(m.id));
    if (selected.length === 0) return [];

    if (customWeights && Object.keys(customWeights).length > 0) {
      const totalWeight = selected.reduce((sum, m) => sum + (customWeights[m.id] || 0), 0);
      if (totalWeight <= 0) return [];

      let currentAllocated = 0;
      return selected.map((m, idx) => {
        const weight = customWeights[m.id] || 0;
        let share = idx === selected.length - 1
          ? Math.round((amount - currentAllocated) * 100) / 100
          : Math.round(((amount * weight) / totalWeight) * 100) / 100;
        currentAllocated += share;
        return {
          memberId: m.id,
          memberName: m.name,
          amount: share,
        };
      });
    }

    const perPerson = Math.floor((amount / selected.length) * 100) / 100;
    const remainder = Math.round((amount - perPerson * selected.length) * 100) / 100;

    return selected.map((m, idx) => {
      const extra = idx === 0 ? remainder : 0;
      return {
        memberId: m.id,
        memberName: m.name,
        amount: Math.round((perPerson + extra) * 100) / 100,
      };
    });
  }

  if (splitType === 'monthly_attendance_weighted') {
    const attendanceCounts = getMonthlyAttendanceCounts(attendanceSessions, monthTarget);
    const attendedMembers = activeMembers.filter(m => (attendanceCounts[m.id] || 0) > 0);

    const totalSessionsPlayed = Object.values(attendanceCounts).reduce((a, b) => a + b, 0);

    if (totalSessionsPlayed === 0 || attendedMembers.length === 0) {
      // Fallback: If no attendance records yet for this month, split equally among all active members
      return calculateSplits({
        amount,
        splitType: 'all',
        allMembers,
      });
    }

    let allocatedSum = 0;
    const result = attendedMembers.map((m, idx) => {
      const days = attendanceCounts[m.id] || 0;
      let share: number;

      if (idx === attendedMembers.length - 1) {
        // Last person takes remainder to avoid rounding drift
        share = Math.round((amount - allocatedSum) * 100) / 100;
      } else {
        share = Math.round(((amount * days) / totalSessionsPlayed) * 100) / 100;
        allocatedSum += share;
      }

      return {
        memberId: m.id,
        memberName: m.name,
        amount: share,
        daysAttended: days,
      };
    });

    return result;
  }

  if (splitType === 'monthly_attendance_equal') {
    const attendanceCounts = getMonthlyAttendanceCounts(attendanceSessions, monthTarget);
    const attendedMembers = activeMembers.filter(m => (attendanceCounts[m.id] || 0) > 0);

    if (attendedMembers.length === 0) {
      return calculateSplits({
        amount,
        splitType: 'all',
        allMembers,
      });
    }

    const perPerson = Math.floor((amount / attendedMembers.length) * 100) / 100;
    const remainder = Math.round((amount - perPerson * attendedMembers.length) * 100) / 100;

    return attendedMembers.map((m, idx) => {
      const extra = idx === 0 ? remainder : 0;
      return {
        memberId: m.id,
        memberName: m.name,
        amount: Math.round((perPerson + extra) * 100) / 100,
        daysAttended: attendanceCounts[m.id] || 0,
      };
    });
  }

  return [];
}

/**
 * Calculate balances for all members based on expenses, splits, and settlements
 */
export function calculateMemberBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
  sessions: AttendanceSession[]
): MemberBalanceSummary[] {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Map of memberId -> stats
  const statsMap: Record<string, MemberBalanceSummary> = {};

  // Initialize all members
  members.forEach(m => {
    statsMap[m.id] = {
      memberId: m.id,
      memberName: m.name,
      isGuest: m.isGuest,
      totalPaid: 0,
      totalShare: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
      netBalance: 0,
      daysAttendedTotal: 0,
      daysAttendedCurrentMonth: 0,
    };
  });

  // Calculate attendance stats
  sessions.forEach(session => {
    const isCurrentMonth = session.date.startsWith(currentMonth);
    session.attendeeIds.forEach(id => {
      if (statsMap[id]) {
        statsMap[id].daysAttendedTotal += 1;
        if (isCurrentMonth) {
          statsMap[id].daysAttendedCurrentMonth += 1;
        }
      }
    });
  });

  // Aggregate expenses paid
  expenses.forEach(exp => {
    if (statsMap[exp.paidById]) {
      statsMap[exp.paidById].totalPaid += exp.amount;
    }

    // Aggregate splits owed
    exp.splits.forEach(split => {
      if (statsMap[split.memberId]) {
        statsMap[split.memberId].totalShare += split.amount;
      }
    });
  });

  // Aggregate settlements
  settlements.forEach(settle => {
    if (statsMap[settle.fromMemberId]) {
      statsMap[settle.fromMemberId].settlementsPaid += settle.amount;
    }
    if (settle.toMemberId !== 'group_pool' && statsMap[settle.toMemberId]) {
      statsMap[settle.toMemberId].settlementsReceived += settle.amount;
    }
  });

  // Compute final netBalance
  // netBalance > 0: In Advance / User is owed money back
  // netBalance < 0: User owes money to group/others
  // netBalance = 0: All cleared
  return Object.values(statsMap).map(item => {
    const totalOutflow = item.totalPaid + item.settlementsPaid;
    const totalInflowOrShare = item.totalShare + item.settlementsReceived;
    const net = Math.round((totalOutflow - totalInflowOrShare) * 100) / 100;

    return {
      ...item,
      totalPaid: Math.round(item.totalPaid * 100) / 100,
      totalShare: Math.round(item.totalShare * 100) / 100,
      settlementsPaid: Math.round(item.settlementsPaid * 100) / 100,
      settlementsReceived: Math.round(item.settlementsReceived * 100) / 100,
      netBalance: net,
    };
  });
}
