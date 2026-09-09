export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isGuest?: boolean;
  isActive: boolean;
  createdAt: string;
}

export type ExpenseCategory =
  | 'court_monthly'
  | 'court_hourly'
  | 'shuttles'
  | 'equipment'
  | 'tournament'
  | 'snacks'
  | 'other';

export type SplitType =
  | 'all'
  | 'specific'
  | 'monthly_attendance_weighted'
  | 'monthly_attendance_equal';

export interface ExpenseSplit {
  memberId: string;
  memberName: string;
  amount: number;
  daysAttended?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  paidById: string;
  paidByName: string;
  splitType: SplitType;
  monthTarget?: string; // YYYY-MM (e.g. 2026-09) for monthly court fee
  splits: ExpenseSplit[];
  notes?: string;
  createdBy: {
    uid: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface GuestAttendee {
  name: string;
  phone?: string;
  feeCharged?: number;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "06:00 AM - 07:00 AM"
  attendeeIds: string[];
  guestAttendees?: GuestAttendee[];
  notes?: string;
  updatedBy: {
    uid: string;
    name: string;
    email: string;
  };
  updatedAt: string;
}

export interface PollVote {
  userId: string;
  userName: string;
  userEmail: string;
  memberId?: string;
  answer: 'yes' | 'no';
  timestamp: string;
}

export interface DailyPoll {
  date: string; // YYYY-MM-DD
  timeSlot: string;
  votes: Record<string, PollVote>;
}

export interface Settlement {
  id: string;
  date: string; // YYYY-MM-DD
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string; // memberId or 'group_pool'
  toMemberName: string;
  amount: number;
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
  notes?: string;
  recordedBy: {
    uid: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export type AuditActionType =
  | 'CREATE_EXPENSE'
  | 'UPDATE_EXPENSE'
  | 'DELETE_EXPENSE'
  | 'UPDATE_ATTENDANCE'
  | 'POLL_VOTE'
  | 'RECORD_SETTLEMENT'
  | 'ADD_MEMBER'
  | 'UPDATE_MEMBER'
  | 'DELETE_MEMBER'
  | 'DATA_IMPORT_EXPORT';

export interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
  };
  action: AuditActionType;
  targetType: 'expense' | 'attendance' | 'settlement' | 'member' | 'poll' | 'system';
  description: string;
  details?: Record<string, any>;
}

export interface MemberBalanceSummary {
  memberId: string;
  memberName: string;
  isGuest?: boolean;
  totalPaid: number;       // Amount this person paid for group expenses
  totalShare: number;      // Amount this person owes from all splits
  settlementsPaid: number; // Payments made to settle dues
  settlementsReceived: number; // Settlements received from others
  netBalance: number;      // (totalPaid + settlementsPaid) - (totalShare + settlementsReceived)
                           // > 0 means in advance (to receive back), < 0 means owes money
  daysAttendedTotal: number;
  daysAttendedCurrentMonth: number;
}
