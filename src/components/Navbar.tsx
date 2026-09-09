import React from 'react';
import { LogOut, LogIn, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Tab } from './Sidebar';

interface NavbarProps {
  setActiveTab: (tab: Tab) => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setActiveTab, onToggleSidebar }) => {
  const { currentUser, signInGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: mobile menu toggle + Brand logo & title */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden"
              title="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-2xl">
                🏸
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-white">ShuttleLedger</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Badminton Expenses & Attendance</p>
              </div>
            </div>
          </div>

          {/* Right: Google User Profile / Sign-in */}
          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-emerald-400 object-cover"
                />
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-slate-200 leading-tight truncate max-w-[120px]">{currentUser.name}</div>
                  <div className="text-slate-400 truncate max-w-[120px]">{currentUser.email}</div>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInGoogle().catch(err => console.warn('Sign-in failed or cancelled', err))}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 text-sm font-semibold rounded-lg shadow transition"
              >
                <LogIn className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Google Sign-In</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
