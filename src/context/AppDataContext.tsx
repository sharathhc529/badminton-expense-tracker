import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Member,
  Expense,
  AttendanceSession,
  DailyPoll,
  Settlement,
  AuditLog,
  MemberBalanceSummary,
  AuditActionType,
  GuestAttendee,
} from '../types';
import {
  initialMembers,
  initialExpenses,
  initialAttendanceSessions,
  initialSettlements,
  initialAuditLogs,
} from '../services/seedData';
import { calculateMemberBalances, calculateSplits } from '../services/calculation';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { DEFAULT_SHEETS_WEBHOOK_URL, SHEETS_SYNC_TOKEN } from '../config/sheetsSync';

interface AppDataContextType {
  members: Member[];
  expenses: Expense[];
  attendanceSessions: AttendanceSession[];
  polls: Record<string, DailyPoll>;
  settlements: Settlement[];
  auditLogs: AuditLog[];
  memberBalances: MemberBalanceSummary[];
  isCloudSynced: boolean;
  lastSyncedAt: string | null;

  // Actions
  addMember: (member: Omit<Member, 'id' | 'createdAt'>) => Promise<string>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => Promise<string>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  saveAttendanceSession: (session: Omit<AttendanceSession, 'id' | 'updatedAt' | 'updatedBy'> & { id?: string }) => Promise<string>;
  toggleMemberAttendance: (date: string, memberId: string, timeSlot?: string) => Promise<void>;
  addGuestToAttendance: (date: string, guest: GuestAttendee, timeSlot?: string) => Promise<void>;

  votePoll: (date: string, answer: 'yes' | 'no', timeSlot?: string) => Promise<void>;
  getPollForDate: (date: string, timeSlot?: string) => DailyPoll | undefined;

  recordSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt' | 'recordedBy'>) => Promise<string>;
  deleteSettlement: (id: string) => Promise<void>;

  recalculateMonthlyCourtExpenses: (monthStr: string) => void;
  resetAllData: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const STORAGE_KEY_MEMBERS = 'shuttleledger_members';
const STORAGE_KEY_EXPENSES = 'shuttleledger_expenses';
const STORAGE_KEY_ATTENDANCE = 'shuttleledger_attendance';
const STORAGE_KEY_POLLS = 'shuttleledger_polls';
const STORAGE_KEY_SETTLEMENTS = 'shuttleledger_settlements';
const STORAGE_KEY_AUDIT = 'shuttleledger_audit';

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(!!db);

  // Core state with local storage hydration or seed fallback
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    return saved ? JSON.parse(saved) : initialAttendanceSessions;
  });

  const [polls, setPolls] = useState<Record<string, DailyPoll>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_POLLS);
    return saved ? JSON.parse(saved) : {};
  });

  const [settlements, setSettlements] = useState<Settlement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
    return saved ? JSON.parse(saved) : initialSettlements;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendanceSessions));
  }, [attendanceSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POLLS, JSON.stringify(polls));
  }, [polls]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(settlements));
  }, [settlements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Real-time Firestore synchronization if active
  useEffect(() => {
    if (!db) return;

    try {
      const unsubMembers = onSnapshot(collection(db, 'members'), snapshot => {
        if (!snapshot.empty) {
          const list: Member[] = [];
          snapshot.forEach(doc => list.push(doc.data() as Member));
          setMembers(list);
        }
      });

      const unsubExpenses = onSnapshot(collection(db, 'expenses'), snapshot => {
        if (!snapshot.empty) {
          const list: Expense[] = [];
          snapshot.forEach(doc => list.push(doc.data() as Expense));
          setExpenses(list);
        }
      });

      const unsubAttendance = onSnapshot(collection(db, 'attendance'), snapshot => {
        if (!snapshot.empty) {
          const list: AttendanceSession[] = [];
          snapshot.forEach(doc => list.push(doc.data() as AttendanceSession));
          setAttendanceSessions(list);
        }
      });

      const unsubSettlements = onSnapshot(collection(db, 'settlements'), snapshot => {
        if (!snapshot.empty) {
          const list: Settlement[] = [];
          snapshot.forEach(doc => list.push(doc.data() as Settlement));
          setSettlements(list);
        }
      });

      const unsubLogs = onSnapshot(collection(db, 'audit_logs'), snapshot => {
        if (!snapshot.empty) {
          const list: AuditLog[] = [];
          snapshot.forEach(doc => list.push(doc.data() as AuditLog));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setAuditLogs(list);
        }
      });

      setIsCloudSynced(true);

      return () => {
        unsubMembers();
        unsubExpenses();
        unsubAttendance();
        unsubSettlements();
        unsubLogs();
      };
    } catch (e) {
      console.warn('Firestore snapshot error', e);
      setIsCloudSynced(false);
    }
  }, []);

  // Compute live member balances
  const memberBalances = useMemo(() => {
    return calculateMemberBalances(members, expenses, settlements, attendanceSessions);
  }, [members, expenses, settlements, attendanceSessions]);

  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem('shuttleledger_last_sync_time') || null;
  });

  // Automatically dispatch to Google Sheets webhook if configured
  const autoSyncToGoogleSheets = async (
    customMembers?: Member[],
    customExpenses?: Expense[],
    customAttendance?: AttendanceSession[],
    customSettlements?: Settlement[]
  ) => {
    try {
      const webhookUrl = localStorage.getItem('shuttleledger_sheets_webhook') || DEFAULT_SHEETS_WEBHOOK_URL;
      if (!webhookUrl.startsWith('https://script.google.com')) return;

      const activeM = customMembers || members;
      const activeE = customExpenses || expenses;
      const activeA = customAttendance || attendanceSessions;
      const activeS = customSettlements || settlements;
      const computedB = calculateMemberBalances(activeM, activeE, activeS, activeA);

      const now = new Date();
      const payloadStr = JSON.stringify({
        timestamp: now.toISOString(),
        syncToken: SHEETS_SYNC_TOKEN,
        members: activeM,
        expenses: activeE,
        attendance: activeA,
        settlements: activeS,
        balances: computedB,
      });

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        mode: 'no-cors',
        body: payloadStr,
      });

      const formattedTime = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      setLastSyncedAt(now.toISOString());
      localStorage.setItem('shuttleledger_last_sync_time', now.toISOString());

      showToast({
        type: 'sheets_sync',
        title: '📊 Google Sheet Synced',
        description: `Last synced: ${formattedTime}`,
      });
    } catch (e) {
      console.warn('Auto-sync to Google Sheets background warning:', e);
    }
  };

  // Helper to log audit actions
  const logAudit = async (
    action: AuditActionType,
    targetType: 'expense' | 'attendance' | 'settlement' | 'member' | 'poll' | 'system',
    description: string,
    details?: Record<string, any>
  ) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      user: {
        uid: currentUser?.uid || 'guest_user',
        name: currentUser?.name || 'Anonymous Player',
        email: currentUser?.email || 'unknown@example.com',
        photoURL: currentUser?.photoURL,
      },
      action,
      targetType,
      description,
      details,
    };

    setAuditLogs(prev => [newLog, ...prev]);

    if (db) {
      try {
        await setDoc(doc(db, 'audit_logs', newLog.id), newLog);
      } catch (e) {
        console.error('Failed to write audit log to firestore', e);
      }
    }
  };

  // Recalculate monthly court expenses when attendance changes
  const recalculateMonthlyCourtExpenses = (monthStr: string) => {
    setExpenses(prev => {
      let changed = false;
      const updated = prev.map(exp => {
        if (
          (exp.category === 'court_monthly' || exp.splitType.startsWith('monthly_attendance')) &&
          exp.monthTarget === monthStr
        ) {
          const newSplits = calculateSplits({
            amount: exp.amount,
            splitType: exp.splitType,
            allMembers: members,
            monthTarget: monthStr,
            attendanceSessions,
          });
          changed = true;
          return { ...exp, splits: newSplits };
        }
        return exp;
      });
      return changed ? updated : prev;
    });
  };

  // Member CRUD
  const addMember = async (memberData: Omit<Member, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'm_' + Date.now();
    const newMember: Member = {
      ...memberData,
      id,
      createdAt: new Date().toISOString(),
    };

    const newMembers = [...members, newMember];
    setMembers(newMembers);
    await logAudit(
      'ADD_MEMBER',
      'member',
      `${currentUser?.name || 'User'} added new member "${newMember.name}" (${newMember.isGuest ? 'Guest' : 'Regular'})`
    );

    if (db) {
      await setDoc(doc(db, 'members', id), newMember);
    }
    autoSyncToGoogleSheets(newMembers);
    return id;
  };

  const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
    const target = members.find(m => m.id === id);
    if (!target) return;

    const updated = { ...target, ...updates };
    const newMembers = members.map(m => (m.id === id ? updated : m));
    setMembers(newMembers);
    await logAudit('UPDATE_MEMBER', 'member', `${currentUser?.name || 'User'} updated member "${target.name}"`);

    if (db) {
      await setDoc(doc(db, 'members', id), updated);
    }
    autoSyncToGoogleSheets(newMembers);
  };

  const deleteMember = async (id: string): Promise<void> => {
    const target = members.find(m => m.id === id);
    if (!target) return;

    const newMembers = members.filter(m => m.id !== id);
    setMembers(newMembers);
    await logAudit('DELETE_MEMBER', 'member', `${currentUser?.name || 'User'} removed member "${target.name}"`);

    if (db) {
      await deleteDoc(doc(db, 'members', id));
    }
    autoSyncToGoogleSheets(newMembers);
  };

  // Expense CRUD
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>): Promise<string> => {
    const id = 'exp_' + Date.now();
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdBy: {
        uid: currentUser?.uid || 'user',
        name: currentUser?.name || 'Player',
        email: currentUser?.email || '',
      },
      createdAt: new Date().toISOString(),
    };

    const newExpenses = [newExpense, ...expenses];
    setExpenses(newExpenses);
    await logAudit(
      'CREATE_EXPENSE',
      'expense',
      `${currentUser?.name || 'User'} added expense "${newExpense.title}" for ₹${newExpense.amount} (${newExpense.splitType} split)`
    );

    if (db) {
      await setDoc(doc(db, 'expenses', id), newExpense);
    }
    autoSyncToGoogleSheets(undefined, newExpenses);
    return id;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<void> => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;

    const updated = { ...target, ...updates };
    const newExpenses = expenses.map(e => (e.id === id ? updated : e));
    setExpenses(newExpenses);
    await logAudit(
      'UPDATE_EXPENSE',
      'expense',
      `${currentUser?.name || 'User'} updated expense "${target.title}" (₹${updated.amount})`
    );

    if (db) {
      await setDoc(doc(db, 'expenses', id), updated);
    }
    autoSyncToGoogleSheets(undefined, newExpenses);
  };

  const deleteExpense = async (id: string): Promise<void> => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;

    const newExpenses = expenses.filter(e => e.id !== id);
    setExpenses(newExpenses);
    await logAudit(
      'DELETE_EXPENSE',
      'expense',
      `${currentUser?.name || 'User'} deleted expense "${target.title}" (₹${target.amount})`
    );

    if (db) {
      await deleteDoc(doc(db, 'expenses', id));
    }
    autoSyncToGoogleSheets(undefined, newExpenses);
  };

  // Attendance Management
  const saveAttendanceSession = async (
    sessionData: Omit<AttendanceSession, 'id' | 'updatedAt' | 'updatedBy'> & { id?: string }
  ): Promise<string> => {
    const id = sessionData.id || `att_${sessionData.date}_${Date.now()}`;
    const session: AttendanceSession = {
      id,
      date: sessionData.date,
      timeSlot: sessionData.timeSlot || '06:00 AM - 07:00 AM',
      attendeeIds: sessionData.attendeeIds,
      guestAttendees: sessionData.guestAttendees || [],
      notes: sessionData.notes || '',
      updatedBy: {
        uid: currentUser?.uid || 'user',
        name: currentUser?.name || 'Player',
        email: currentUser?.email || '',
      },
      updatedAt: new Date().toISOString(),
    };

    let updatedSessions: AttendanceSession[] = [];
    setAttendanceSessions(prev => {
      const filtered = prev.filter(s => s.id !== id && !(s.date === session.date && s.timeSlot === session.timeSlot));
      updatedSessions = [session, ...filtered];
      return updatedSessions;
    });

    const monthStr = session.date.slice(0, 7);
    recalculateMonthlyCourtExpenses(monthStr);

    await logAudit(
      'UPDATE_ATTENDANCE',
      'attendance',
      `${currentUser?.name || 'User'} updated attendance for ${session.date} (${session.attendeeIds.length} players)`
    );

    if (db) {
      await setDoc(doc(db, 'attendance', id), session);
    }
    autoSyncToGoogleSheets(undefined, undefined, updatedSessions);
    return id;
  };

  const toggleMemberAttendance = async (
    date: string,
    memberId: string,
    timeSlot: string = '06:00 AM - 07:00 AM'
  ): Promise<void> => {
    const existing = attendanceSessions.find(s => s.date === date && s.timeSlot === timeSlot);
    let newAttendees: string[] = [];

    if (existing) {
      if (existing.attendeeIds.includes(memberId)) {
        newAttendees = existing.attendeeIds.filter(id => id !== memberId);
      } else {
        newAttendees = [...existing.attendeeIds, memberId];
      }
      await saveAttendanceSession({
        id: existing.id,
        date,
        timeSlot,
        attendeeIds: newAttendees,
        guestAttendees: existing.guestAttendees,
        notes: existing.notes,
      });
    } else {
      newAttendees = [memberId];
      await saveAttendanceSession({
        date,
        timeSlot,
        attendeeIds: newAttendees,
      });
    }
  };

  const addGuestToAttendance = async (
    date: string,
    guest: GuestAttendee,
    timeSlot: string = '06:00 AM - 07:00 AM'
  ): Promise<void> => {
    const existing = attendanceSessions.find(s => s.date === date && s.timeSlot === timeSlot);
    if (existing) {
      const guests = [...(existing.guestAttendees || []), guest];
      await saveAttendanceSession({
        ...existing,
        guestAttendees: guests,
      });
    } else {
      await saveAttendanceSession({
        date,
        timeSlot,
        attendeeIds: [],
        guestAttendees: [guest],
      });
    }
  };

  // Daily Poll & RSVP
  const votePoll = async (
    date: string,
    answer: 'yes' | 'no',
    timeSlot: string = '06:00 AM - 07:00 AM'
  ): Promise<void> => {
    const pollKey = `${date}_${timeSlot}`;
    const userId = currentUser?.uid || 'guest_' + Date.now();
    const userName = currentUser?.name || 'Player';
    const userEmail = currentUser?.email || '';

    // Find linked member or matching email
    const matchedMember = members.find(
      m => m.email?.toLowerCase() === userEmail.toLowerCase() || m.name.toLowerCase() === userName.toLowerCase()
    );

    const newVote = {
      userId,
      userName,
      userEmail,
      memberId: matchedMember?.id,
      answer,
      timestamp: new Date().toISOString(),
    };

    setPolls(prev => {
      const currentPoll = prev[pollKey] || { date, timeSlot, votes: {} };
      return {
        ...prev,
        [pollKey]: {
          ...currentPoll,
          votes: {
            ...currentPoll.votes,
            [userId]: newVote,
          },
        },
      };
    });

    // If voting 'yes' and member is identified, automatically add to attendance!
    if (matchedMember) {
      const existing = attendanceSessions.find(s => s.date === date && s.timeSlot === timeSlot);
      if (answer === 'yes') {
        if (!existing || !existing.attendeeIds.includes(matchedMember.id)) {
          await toggleMemberAttendance(date, matchedMember.id, timeSlot);
        }
      } else if (answer === 'no' && existing && existing.attendeeIds.includes(matchedMember.id)) {
        await toggleMemberAttendance(date, matchedMember.id, timeSlot);
      }
    }

    await logAudit(
      'POLL_VOTE',
      'poll',
      `${userName} voted ${answer.toUpperCase()} for ${date} (${timeSlot})`
    );
  };

  const getPollForDate = (date: string, timeSlot: string = '06:00 AM - 07:00 AM'): DailyPoll | undefined => {
    return polls[`${date}_${timeSlot}`];
  };

  // Settlement Management
  const recordSettlement = async (
    settlementData: Omit<Settlement, 'id' | 'createdAt' | 'recordedBy'>
  ): Promise<string> => {
    const id = 'set_' + Date.now();
    const newSettlement: Settlement = {
      ...settlementData,
      id,
      recordedBy: {
        uid: currentUser?.uid || 'user',
        name: currentUser?.name || 'Player',
        email: currentUser?.email || '',
      },
      createdAt: new Date().toISOString(),
    };

    const newSettlements = [newSettlement, ...settlements];
    setSettlements(newSettlements);
    await logAudit(
      'RECORD_SETTLEMENT',
      'settlement',
      `${newSettlement.fromMemberName} settled ₹${newSettlement.amount} to ${newSettlement.toMemberName} (${newSettlement.paymentMethod})`
    );

    if (db) {
      await setDoc(doc(db, 'settlements', id), newSettlement);
    }
    autoSyncToGoogleSheets(undefined, undefined, undefined, newSettlements);
    return id;
  };

  const deleteSettlement = async (id: string): Promise<void> => {
    const target = settlements.find(s => s.id === id);
    if (!target) return;

    const newSettlements = settlements.filter(s => s.id !== id);
    setSettlements(newSettlements);
    await logAudit(
      'RECORD_SETTLEMENT',
      'settlement',
      `Deleted settlement record of ₹${target.amount} from ${target.fromMemberName}`
    );

    if (db) {
      await deleteDoc(doc(db, 'settlements', id));
    }
    autoSyncToGoogleSheets(undefined, undefined, undefined, newSettlements);
  };

  const resetAllData = () => {
    setMembers(initialMembers);
    setExpenses(initialExpenses);
    setAttendanceSessions(initialAttendanceSessions);
    setSettlements(initialSettlements);
    setAuditLogs(initialAuditLogs);
    setPolls({});
    localStorage.clear();
  };

  return (
    <AppDataContext.Provider
      value={{
        members,
        expenses,
        attendanceSessions,
        polls,
        settlements,
        auditLogs,
        memberBalances,
        isCloudSynced,
        lastSyncedAt,
        addMember,
        updateMember,
        deleteMember,
        addExpense,
        updateExpense,
        deleteExpense,
        saveAttendanceSession,
        toggleMemberAttendance,
        addGuestToAttendance,
        votePoll,
        getPollForDate,
        recordSettlement,
        deleteSettlement,
        recalculateMonthlyCourtExpenses,
        resetAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export function useAppData(): AppDataContextType {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
