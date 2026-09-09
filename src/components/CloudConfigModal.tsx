import React, { useState } from 'react';
import { Cloud, Check, Key, Share2, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { getSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../services/firebase';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({ isOpen, onClose }) => {
  const existingConfig = getSavedFirebaseConfig();

  const [apiKey, setApiKey] = useState<string>(existingConfig?.apiKey || '');
  const [projectId, setProjectId] = useState<string>(existingConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState<string>(existingConfig?.authDomain || '');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) return;

    saveFirebaseConfig({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
    });
  };

  const handleClear = () => {
    if (window.confirm('Reset to offline / local mode?')) {
      clearFirebaseConfig();
    }
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-xl">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cloud Database & WhatsApp Setup</h3>
              <p className="text-xs text-slate-400">100% Real-time sync across mobile phones & players</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        {/* Shareable Link Box */}
        <div className="mt-4 bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              <span>Shareable WhatsApp Link:</span>
            </span>
            <button
              onClick={handleCopyAppUrl}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-300">
            Share this URL on your badminton WhatsApp group. Any player can open it on their mobile phone, sign in with Google, RSVP for games, and see their real-time balances!
          </p>
        </div>

        {/* Firebase Config Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-teal-400" />
              <span>Firebase Cloud Credentials (Optional)</span>
            </span>
            {existingConfig && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-red-400 hover:underline"
              >
                Disconnect
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Firebase API Key</label>
            <input
              type="text"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Firebase Project ID</label>
            <input
              type="text"
              placeholder="badminton-tracker-app"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Auth Domain (Optional)</label>
            <input
              type="text"
              placeholder="badminton-tracker-app.firebaseapp.com"
              value={authDomain}
              onChange={e => setAuthDomain(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p>
              💡 <strong>Instant Testing:</strong> ShuttleLedger includes built-in offline-first cloud emulation, so you can test all features (Polls, Splits, Attendance, Settlements) right away without entering credentials!
            </p>
          </div>

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
              disabled={!apiKey.trim() || !projectId.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-xl shadow"
            >
              Save & Connect Cloud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
