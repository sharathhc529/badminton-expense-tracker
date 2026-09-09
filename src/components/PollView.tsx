import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, XCircle, Users } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { DailyPollWidget } from './DailyPollWidget';

const TIME_SLOT = '06:00 AM - 07:00 AM';

export const PollView: React.FC<{ onNavigateTab?: (tab: 'calendar') => void }> = ({ onNavigateTab }) => {
  const { polls } = useAppData();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const pollKey = `${selectedDate}_${TIME_SLOT}`;
  const currentPoll = polls[pollKey];
  const votes = currentPoll ? Object.values(currentPoll.votes).sort((a, b) => a.timestamp.localeCompare(b.timestamp)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">Daily RSVP Poll</h1>
        <p className="text-xs text-slate-400 mt-1">Update your response and see who else has responded below.</p>
      </div>

      <DailyPollWidget
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onNavigateToCalendar={onNavigateTab ? () => onNavigateTab('calendar') : undefined}
      />

      {/* Who has responded */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Who's Responded — {format(parseISO(selectedDate), 'EEEE, MMM dd')}</span>
          </h2>
          <span className="text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
            {votes.length} {votes.length === 1 ? 'response' : 'responses'}
          </span>
        </div>

        {votes.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-6 italic">No one has responded to this poll yet.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {votes.map(vote => (
              <div key={vote.userId} className="flex items-center justify-between py-2.5">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${vote.userId}`}
                    alt={vote.userName}
                    className="w-7 h-7 rounded-full shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{vote.userName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{format(new Date(vote.timestamp), 'dd MMM, hh:mm a')}</div>
                  </div>
                </div>
                {vote.answer === 'yes' ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Playing
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> Not Joining
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
