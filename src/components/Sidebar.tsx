import React from 'react';
import { Calendar, Receipt, Users, History, FileSpreadsheet, Wallet, Sparkles, Vote, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type Tab = 'dashboard' | 'calendar' | 'expenses' | 'balances' | 'members' | 'audit' | 'sheet' | 'poll';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenExpenseModal: () => void;
  onOpenSheetsModal: () => void;
}

const baseNavItems = [
  { id: 'dashboard', label: 'Overview', icon: Sparkles },
  { id: 'calendar', label: 'Attendance & Calendar', icon: Calendar },
  { id: 'poll', label: 'RSVP Poll', icon: Vote },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'balances', label: 'Balances & Dues', icon: Wallet },
  { id: 'members', label: 'Players', icon: Users },
] as const;

const SidebarContent: React.FC<
  SidebarProps & { onNavigate: (tab: Tab) => void }
> = ({ activeTab, onNavigate, onOpenExpenseModal, onOpenSheetsModal }) => {
  const { isAdmin } = useAuth();

  const navItems = isAdmin
    ? [
        ...baseNavItems,
        { id: 'audit' as const, label: 'Audit Trail', icon: History },
        { id: 'sheet' as const, label: '/sheet', icon: FileSpreadsheet },
      ]
    : baseNavItems;

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Menu</span>
        {baseNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {isAdmin && (
          <>
            <span className="block px-3 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Admin
            </span>
            {navItems.slice(baseNavItems.length).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        <span className="block px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Quick Actions
        </span>
        <button
          onClick={onOpenExpenseModal}
          className="w-full flex items-center space-x-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
        <button
          onClick={onOpenSheetsModal}
          className="w-full flex items-center space-x-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Sheets Sync</span>
        </button>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = props => {
  const { isOpen, onClose, setActiveTab } = props;

  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-slate-900/60 border-r border-slate-800 sticky top-16 h-[calc(100vh-4rem)]">
        <SidebarContent {...props} onNavigate={handleNavigate} />
      </aside>

      {/* Mobile off-canvas drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 shrink-0">
              <span className="font-bold text-white">Menu</span>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <SidebarContent {...props} onNavigate={handleNavigate} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
