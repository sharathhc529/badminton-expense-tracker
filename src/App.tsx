import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppDataProvider } from './context/AppDataContext';
import { Navbar } from './components/Navbar';
import { Sidebar, Tab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { ExpenseList } from './components/ExpenseList';
import { BalancesLedger } from './components/BalancesLedger';
import { MemberManager } from './components/MemberManager';
import { AuditLogView } from './components/AuditLogView';
import { ExpenseModal } from './components/ExpenseModal';
import { SettlementModal } from './components/SettlementModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PollView } from './components/PollView';
import { Expense } from './types';
import { Plus } from 'lucide-react';

import { AdminSheetView } from './components/AdminSheetView';

const TAB_FOR_HASH: Record<string, Tab> = {
  '#/sheet': 'sheet',
  '#/poll': 'poll',
};

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (TAB_FOR_HASH[window.location.hash]) return TAB_FOR_HASH[window.location.hash];
    if (window.location.search.includes('tab=sheet')) return 'sheet';
    return 'dashboard';
  });

  // Listen for hash change e.g. typing #/sheet or #/poll
  React.useEffect(() => {
    const handleHashChange = () => {
      if (TAB_FOR_HASH[window.location.hash]) {
        setActiveTab(TAB_FOR_HASH[window.location.hash]);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-16 lg:pb-0">
      {/* Top Navigation */}
      <Navbar setActiveTab={setActiveTab} onToggleSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenExpenseModal={handleOpenAddExpense}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                onNavigateTab={setActiveTab}
                onOpenExpenseModal={handleOpenAddExpense}
                onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
              />
            )}

            {activeTab === 'calendar' && <AttendanceCalendar />}

            {activeTab === 'expenses' && (
              <ExpenseList onOpenExpenseModal={handleOpenAddExpense} onEditExpense={handleOpenEditExpense} />
            )}

            {activeTab === 'balances' && <BalancesLedger />}

            {activeTab === 'members' && <MemberManager />}

            {activeTab === 'audit' && <AuditLogView />}

            {activeTab === 'sheet' && <AdminSheetView />}

            {activeTab === 'poll' && <PollView onNavigateTab={setActiveTab} />}
          </div>
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <button
          onClick={handleOpenAddExpense}
          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 active:scale-95 transition"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Global Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />

      <SettlementModal isOpen={isSettlementModalOpen} onClose={() => setIsSettlementModalOpen(false)} />

      <GoogleSheetsModal isOpen={isSheetsModalOpen} onClose={() => setIsSheetsModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppDataProvider>
          <AppContent />
        </AppDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
