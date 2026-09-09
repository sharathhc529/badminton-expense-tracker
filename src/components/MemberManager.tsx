import React, { useState } from 'react';
import { Users, UserPlus, Phone, Mail, Trash2, Edit2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { Member } from '../types';

export const MemberManager: React.FC = () => {
  const { members, addMember, updateMember, deleteMember } = useAppData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setEmail('');
    setPhone('');
    setIsGuest(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setName(m.name);
    setEmail(m.email || '');
    setPhone(m.phone || '');
    setIsGuest(!!m.isGuest);
    setIsActive(m.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMember) {
      await updateMember(editingMember.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        isGuest,
        isActive,
      });
      showToast({ type: 'success', title: 'Player Updated', description: `"${name.trim()}" was updated.` });
    } else {
      await addMember({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
        isGuest,
        isActive,
      });
      showToast({ type: 'success', title: 'Player Added', description: `"${name.trim()}" was added to the players list.` });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove "${memberName}" from the players list?`)) {
      await deleteMember(id);
      showToast({ type: 'success', title: 'Player Removed', description: `"${memberName}" was removed from the players list.` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Player Directory</span>
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {members.length} Registered
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage players, google email linkages, and outside guest profiles
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Player</span>
        </button>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div
            key={member.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition space-y-4 relative"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}`}
                  alt={member.name}
                  className="w-12 h-12 rounded-full border border-emerald-500/40 object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {member.name}
                    {member.isGuest ? (
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded font-normal">
                        Guest
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-normal">
                        Regular
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    {member.isActive ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active Player
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEditModal(member)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                  title="Edit Player"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(member.id, member.name)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title="Remove Player"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contact details */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{member.email || 'No email attached'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{member.phone || 'No phone attached'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingMember ? 'Edit Player' : 'Add New Badminton Player'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Player Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharath Chandra"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Email (for login matching)
                </label>
                <input
                  type="email"
                  placeholder="e.g. player@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isGuest}
                    onChange={e => setIsGuest(e.target.checked)}
                    className="rounded text-teal-500"
                  />
                  <span>Outside / Guest</span>
                </label>

                <label className="flex items-center space-x-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Active Member</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/25"
                >
                  {editingMember ? 'Update Player' : 'Save Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
