import React, { useState } from 'react';
import {
  Calendar,
  Receipt,
  Users,
  History,
  Cloud,
  CloudOff,
  LogOut,
  LogIn,
  Settings,
  Menu,
  X,
  FileSpreadsheet,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

interface NavbarProps {
  activeTab: 'dashboard' | 'calendar' | 'expenses' | 'balances' | 'members' | 'audit';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'expenses' | 'balances' | 'members' | 'audit') => void;
  onOpenCloudSettings: () => void;
  onOpenSheetsModal: () => void;
  onOpenExpenseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCloudSettings,
  onOpenSheetsModal,
  onOpenExpenseModal,
}) => {
  const { currentUser, signInGoogle, signOut } = useAuth();
  const { isCloudSynced } = useAppData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Sparkles },
    { id: 'calendar', label: 'Attendance & Calendar', icon: Calendar },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'balances', label: 'Balances & Dues', icon: Wallet },
    { id: 'members', label: 'Players', icon: Users },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand logo & title */}
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

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            {/* Quick Add Expense Button */}
            <button
              onClick={onOpenExpenseModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <span>+ Add Expense</span>
            </button>

            {/* Google Sheets Modal Button */}
            <button
              onClick={onOpenSheetsModal}
              title="Export & Sync with Google Sheets"
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>

            {/* Cloud Sync Status Indicator */}
            <button
              onClick={onOpenCloudSettings}
              title={isCloudSynced ? 'Connected to Firebase Cloud DB' : 'Using Offline-Ready Storage (Click to connect Firebase)'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                isCloudSynced
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {isCloudSynced ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isCloudSynced ? 'Cloud Synced' : 'Offline / Local'}</span>
            </button>

            {/* Google User Profile */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-emerald-400 object-cover"
                />
                <div className="hidden xl:block text-left text-xs">
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
                onClick={() => signInGoogle()}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 text-sm font-semibold rounded-lg shadow transition"
              >
                <LogIn className="w-4 h-4 text-emerald-600" />
                <span>Google Sign-In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={onOpenExpenseModal}
              className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
            >
              + Expense
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-2 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onOpenSheetsModal();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Sheets Sync</span>
              </button>
              <button
                onClick={() => {
                  onOpenCloudSettings();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg"
              >
                <Settings className="w-4 h-4 text-teal-400" />
                <span>Cloud DB</span>
              </button>
            </div>

            {currentUser ? (
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-1 text-xs text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  signInGoogle();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-1 text-xs bg-white text-slate-900 font-semibold px-2.5 py-1.5 rounded-lg"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
