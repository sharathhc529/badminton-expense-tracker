import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  UserCheck,
  UserPlus,
  Trash2,
  Clock,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { exportAttendanceToCSV } from '../services/sheetsExport';
import { GuestAttendee } from '../types';

export const AttendanceCalendar: React.FC<{ initialSelectedDate?: string }> = ({ initialSelectedDate }) => {
  const {
    members,
    attendanceSessions,
    saveAttendanceSession,
    recalculateMonthlyCourtExpenses,
  } = useAppData();
  const { showToast } = useToast();

  const [currentMonth, setCurrentMonth] = useState<Date>(
    initialSelectedDate ? parseISO(initialSelectedDate) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialSelectedDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('06:00 AM - 07:00 AM');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);

  // Local state for editing session
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [guestAttendees, setGuestAttendees] = useState<GuestAttendee[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [newGuestName, setNewGuestName] = useState<string>('');

  const monthStr = format(currentMonth, 'yyyy-MM');

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Map of date -> session[]
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof attendanceSessions>();
    attendanceSessions.forEach(session => {
      const list = map.get(session.date) || [];
      list.push(session);
      map.set(session.date, list);
    });
    return map;
  }, [attendanceSessions]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let totalSessions = 0;
    let totalPlayerDays = 0;
    const memberCounts: Record<string, number> = {};

    attendanceSessions.forEach(s => {
      if (s.date.startsWith(monthStr)) {
        totalSessions += 1;
        totalPlayerDays += s.attendeeIds.length + (s.guestAttendees?.length || 0);
        s.attendeeIds.forEach(id => {
          memberCounts[id] = (memberCounts[id] || 0) + 1;
        });
      }
    });

    const topAttendeeEntry = Object.entries(memberCounts).sort((a, b) => b[1] - a[1])[0];
    const topMember = topAttendeeEntry ? members.find(m => m.id === topAttendeeEntry[0]) : null;

    return {
      totalSessions,
      totalPlayerDays,
      topMemberName: topMember?.name || 'N/A',
      topMemberDays: topAttendeeEntry ? topAttendeeEntry[1] : 0,
    };
  }, [attendanceSessions, monthStr, members]);

  // Open editor for selected date
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = attendanceSessions.find(s => s.date === dateStr && s.timeSlot === selectedTimeSlot);
    if (existing) {
      setAttendeeIds(existing.attendeeIds);
      setGuestAttendees(existing.guestAttendees || []);
      setSessionNotes(existing.notes || '');
    } else {
      setAttendeeIds([]);
      setGuestAttendees([]);
      setSessionNotes('');
    }
    setIsEditingModalOpen(true);
  };

  const handleToggleAttendee = (memberId: string) => {
    setAttendeeIds(prev => (prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]));
  };

  const handleSelectAllActive = () => {
    setAttendeeIds(members.filter(m => m.isActive && !m.isGuest).map(m => m.id));
  };

  const handleClearAll = () => {
    setAttendeeIds([]);
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    setGuestAttendees(prev => [...prev, { name: newGuestName.trim() }]);
    setNewGuestName('');
  };

  const handleRemoveGuest = (index: number) => {
    setGuestAttendees(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveSession = async () => {
    const existing = attendanceSessions.find(s => s.date === selectedDate && s.timeSlot === selectedTimeSlot);
    await saveAttendanceSession({
      id: existing?.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      attendeeIds,
      guestAttendees,
      notes: sessionNotes,
    });
    recalculateMonthlyCourtExpenses(selectedDate.slice(0, 7));
    showToast({
      type: 'success',
      title: 'Attendance Updated',
      description: `${attendeeIds.length + guestAttendees.length} player(s) marked for ${format(parseISO(selectedDate), 'dd MMM yyyy')}.`,
    });
    setIsEditingModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation & Stats Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Attendance Calendar
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
              </h1>
              <p className="text-xs text-slate-400">Click any date to update attendance or add outside guest players</p>
            </div>
          </div>

          {/* Month Steppers & Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Current Month
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => exportAttendanceToCSV(attendanceSessions, members)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-medium rounded-xl border border-slate-700 transition ml-2"
              title="Export Attendance to CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Monthly Attendance Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Sessions</span>
            <div className="text-lg font-bold text-white">{monthlyStats.totalSessions}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Player-Days</span>
            <div className="text-lg font-bold text-emerald-400">{monthlyStats.totalPlayerDays}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-2">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Top Attendee this Month</span>
            <div className="text-base font-bold text-teal-300 truncate">
              {monthlyStats.topMemberName}{' '}
              {monthlyStats.topMemberDays > 0 && (
                <span className="text-xs text-slate-400 font-normal">({monthlyStats.topMemberDays} days)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <div
              key={day}
              className={`py-2 text-xs font-semibold uppercase tracking-wider ${
                idx >= 5 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isSelected = selectedDate === dateStr;
            const isToday = isSameDay(day, new Date());
            const isCurrentMonthDay = isSameMonth(day, currentMonth);
            const daySessions = sessionsByDate.get(dateStr) || [];
            const hasSession = daySessions.length > 0;
            const totalAttendees = daySessions.reduce(
              (sum, s) => sum + s.attendeeIds.length + (s.guestAttendees?.length || 0),
              0
            );

            return (
              <div
                key={dateStr}
                onClick={() => handleSelectDate(dateStr)}
                className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !isCurrentMonthDay
                    ? 'bg-slate-950/40 border-slate-900/60 opacity-40 hover:opacity-80'
                    : isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-800/50 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isSelected
                        ? 'text-emerald-400'
                        : isCurrentMonthDay
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {hasSession && (
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded-full">
                      {totalAttendees} 🏸
                    </span>
                  )}
                </div>

                {/* Session Snippet */}
                <div className="space-y-1 my-1">
                  {daySessions.map(session => (
                    <div
                      key={session.id}
                      className="text-[10px] bg-slate-900/90 border border-slate-700/60 px-1.5 py-0.5 rounded truncate text-slate-300"
                    >
                      {session.attendeeIds.length + (session.guestAttendees?.length || 0)} players
                    </div>
                  ))}
                </div>

                {/* Quick Add / Status Footer */}
                <div className="text-[9px] text-slate-500 flex items-center justify-between">
                  {hasSession ? (
                    <span className="text-emerald-400/80">Active</span>
                  ) : (
                    <span className="text-slate-600 hover:text-slate-400">+ Add</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Session Editor Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Session Attendance
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    {format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy')}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select players who played today. This directly updates the monthly court expense distribution!
                </p>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Time slot picker */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Time Slot</span>
              </label>
              <div className="flex gap-2">
                {['06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', 'Evening 07:00 PM'].map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      selectedTimeSlot === slot
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Selection Section */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Regular Members ({attendeeIds.length} Selected)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllActive}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Select All Active
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
                {members
                  .filter(m => m.isActive && !m.isGuest)
                  .map(member => {
                    const isSelected = attendeeIds.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleToggleAttendee(member.id)}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer border transition ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-white'
                            : 'bg-slate-800/40 border-slate-750 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}`}
                          alt={member.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-xs font-medium truncate">{member.name}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Outside / Guest Attendees Section */}
            <div className="mt-5">
              <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Outside / Guest Players ({guestAttendees.length})
              </span>

              {/* Guest list */}
              {guestAttendees.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {guestAttendees.map((guest, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-teal-950/40 border border-teal-500/30 p-2 rounded-lg text-xs text-teal-200"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                        <span className="font-semibold">{guest.name}</span>
                        <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1 rounded">Guest</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(idx)}
                        className="text-slate-400 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add guest form */}
              <form onSubmit={handleAddGuest} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Guest player name (e.g. Ramesh)"
                  value={newGuestName}
                  onChange={e => setNewGuestName(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add</span>
                </button>
              </form>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Session Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Court 3 booked, doubles tournament warmup"
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Total Playing: <strong className="text-emerald-400">{attendeeIds.length + guestAttendees.length}</strong>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSession}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
