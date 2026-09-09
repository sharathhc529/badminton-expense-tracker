import React, { useState } from 'react';
import { format, addDays, isWeekend, parseISO } from 'date-fns';
import { CheckCircle2, XCircle, UserPlus, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

export const DailyPollWidget: React.FC<{ onNavigateToCalendar?: (date: string) => void }> = ({
  onNavigateToCalendar,
}) => {
  const { currentUser, signInGoogle } = useAuth();
  const { members, attendanceSessions, polls, votePoll, addGuestToAttendance, toggleMemberAttendance } = useAppData();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [timeSlot, setTimeSlot] = useState<string>('06:00 AM - 07:00 AM');
  const [guestName, setGuestName] = useState<string>('');
  const [showGuestModal, setShowGuestModal] = useState<boolean>(false);
  const [justVoted, setJustVoted] = useState<string | null>(null);

  const selectedDateObj = parseISO(selectedDate);
  const isSelectedWeekend = isWeekend(selectedDateObj);
  const pollKey = `${selectedDate}_${timeSlot}`;
  const currentPoll = polls[pollKey];

  // Find attendance session for this date & slot
  const currentSession = attendanceSessions.find(s => s.date === selectedDate && s.timeSlot === timeSlot);
  const confirmedMemberIds = currentSession ? currentSession.attendeeIds : [];
  const guestAttendees = currentSession?.guestAttendees || [];

  // Determine current user's vote
  const myVote = currentUser ? currentPoll?.votes[currentUser.uid]?.answer : null;

  // Handle voting
  const handleVote = async (answer: 'yes' | 'no') => {
    if (!currentUser) {
      try {
        await signInGoogle();
      } catch (err) {
        console.warn('Sign-in failed or cancelled', err);
      }
      return;
    }
    await votePoll(selectedDate, answer, timeSlot);
    setJustVoted(answer);
    setTimeout(() => setJustVoted(null), 3000);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    await addGuestToAttendance(selectedDate, { name: guestName.trim() }, timeSlot);
    setGuestName('');
    setShowGuestModal(false);
  };

  const totalAttendeesCount = confirmedMemberIds.length + guestAttendees.length;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Slot Info & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Daily Game RSVP Poll
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Mon - Fri (6-7 AM)
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Regular Session: 06:00 AM - 07:00 AM</span>
            {isSelectedWeekend && <span className="text-amber-400 font-medium">(Weekend Special)</span>}
          </p>
        </div>

        {/* Date Selector Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              selectedDate === todayStr ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Today ({format(new Date(), 'dd MMM')})
          </button>
          <button
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              selectedDate === tomorrowStr ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tomorrow ({format(addDays(new Date(), 1), 'dd MMM')})
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => e.target.value && setSelectedDate(e.target.value)}
            className="bg-transparent text-xs text-slate-300 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Interaction Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left: Instant Voting / RSVP Buttons */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="text-center sm:text-left">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Your RSVP Response</span>
            <p className="text-xs text-slate-400">
              Are you joining for <strong className="text-white">{format(selectedDateObj, 'EEEE, MMM dd')}</strong>?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVote('yes')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-md ${
                myVote === 'yes'
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-emerald-500/25'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>🏸 Yes, Playing!</span>
            </button>

            <button
              onClick={() => handleVote('no')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all transform active:scale-95 ${
                myVote === 'no'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 shadow-rose-600/25'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300 border border-slate-600'
              }`}
            >
              <XCircle className="w-5 h-5" />
              <span>❌ Not Joining</span>
            </button>
          </div>

          {justVoted && (
            <div className="text-xs text-center text-emerald-400 bg-emerald-500/10 py-1.5 px-2 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Attendance updated on calendar automatically!</span>
            </div>
          )}

          {!currentUser && (
            <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Sign in with Google to record your RSVP with your name and photo.</span>
            </div>
          )}
        </div>

        {/* Right: Confirmed Attendees List & Guest Adder */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Confirmed Playing</span>
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                {totalAttendeesCount} {totalAttendeesCount === 1 ? 'Player' : 'Players'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGuestModal(true)}
                className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-lg border border-teal-500/30 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Guest / Drop-in</span>
              </button>

              {onNavigateToCalendar && (
                <button
                  onClick={() => onNavigateToCalendar(selectedDate)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600"
                >
                  View in Calendar
                </button>
              )}
            </div>
          </div>

          {/* Attendees Grid */}
          <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/40 min-h-[90px] flex flex-wrap items-center gap-2">
            {totalAttendeesCount === 0 ? (
              <div className="w-full text-center text-xs text-slate-400 py-3 italic">
                No players confirmed yet for this slot. Be the first to RSVP 'Yes'! 🏸
              </div>
            ) : (
              <>
                {/* Regular Members */}
                {members
                  .filter(m => confirmedMemberIds.includes(m.id))
                  .map(member => (
                    <div
                      key={member.id}
                      onClick={() => toggleMemberAttendance(selectedDate, member.id, timeSlot)}
                      title="Click to toggle attendance"
                      className="flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-400 px-2.5 py-1 rounded-full text-xs text-emerald-200 cursor-pointer transition shadow-sm"
                    >
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="font-medium">{member.name}</span>
                      <span className="text-[10px] text-emerald-400">✓</span>
                    </div>
                  ))}

                {/* Guest Attendees */}
                {guestAttendees.map((guest, idx) => (
                  <div
                    key={`guest_${idx}`}
                    className="flex items-center space-x-1.5 bg-teal-950/60 border border-teal-500/40 px-2.5 py-1 rounded-full text-xs text-teal-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span className="font-medium">{guest.name}</span>
                    <span className="text-[9px] bg-teal-500/30 text-teal-300 px-1 rounded">Guest</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Quick toggle bar for other members */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 text-xs text-slate-400">
            <span className="shrink-0 text-[11px] text-slate-500">Quick add:</span>
            {members
              .filter(m => !confirmedMemberIds.includes(m.id))
              .slice(0, 6)
              .map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMemberAttendance(selectedDate, m.id, timeSlot)}
                  className="shrink-0 bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700 transition"
                >
                  + {m.name.split(' ')[0]}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Outside Guest Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Outside / Guest Player</h3>
            <p className="text-xs text-slate-400 mb-4">
              Temporary guest player joining for {format(selectedDateObj, 'dd MMM yyyy')} session.
            </p>

            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul (Guest)"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow"
                >
                  Add to Today's Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
