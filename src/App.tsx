import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppDataProvider } from './context/AppDataContext';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { ExpenseList } from './components/ExpenseList';
import { BalancesLedger } from './components/BalancesLedger';
import { MemberManager } from './components/MemberManager';
import { AuditLogView } from './components/AuditLogView';
import { ExpenseModal } from './components/ExpenseModal';
import { SettlementModal } from './components/SettlementModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { CloudConfigModal } from './components/CloudConfigModal';
import { Expense } from './types';
import { Plus } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'expenses' | 'balances' | 'members' | 'audit'>(
    'dashboard'
  );

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState<boolean>(false);

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-16 lg:pb-8">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenExpenseModal={handleOpenAddExpense}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </main>

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

      <CloudConfigModal isOpen={isCloudSettingsOpen} onClose={() => setIsCloudSettingsOpen(false)} />
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
