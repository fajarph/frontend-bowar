import { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import type { RegisteredUser, CafeWallet } from '../../App';
import {
  Users,
  Crown,
  Clock,
  Plus,
  Minus,
  Search,
  Mail,
  Calendar,
  Wallet,
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';
import { getWarnetMembers } from '../../services/api';

export function OperatorMembers() {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const operator = context?.operator;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<RegisteredUser | null>(null);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [timeAction, setTimeAction] = useState<'add' | 'deduct'>('add');
  const [hoursToModify, setHoursToModify] = useState(1);
  const [members, setMembers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  const cafe = context?.cafes.find((c) => c.id === operator.cafeId);

  // Fetch members from backend
  useEffect(() => {
    const loadMembers = async () => {
      if (!operator?.cafeId) return;

      try {
        setLoading(true);
        const warnetId = parseInt(operator.cafeId);
        const response = await getWarnetMembers(warnetId);

        if (response.data && Array.isArray(response.data)) {
          // Map backend data to RegisteredUser format
          const mappedMembers: RegisteredUser[] = response.data.map((member: any) => ({
            id: String(member.id),
            username: member.username,
            email: member.email,
            role: member.role as 'member',
            password: '', // Not needed for display
            bowarWallet: member.bowarWallet || 0,
            avatar: member.avatar,
            cafeWallets: member.cafeWallets?.map((w: any) => ({
              ...w,
              balance: Number(w.balance) || 0
            })) || [],
          }));
          setMembers(mappedMembers);
        }
      } catch (error: any) {
        console.error('Failed to load members:', error);
        toast.error('Gagal memuat data member');
        // Fallback to context data if available
        const fallbackMembers = context?.registeredUsers.filter((u) =>
          u.cafeWallets?.some((w) => w.cafeId === operator.cafeId)
        ) || [];
        setMembers(fallbackMembers);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [operator?.cafeId, context?.registeredUsers]);

  // Get all members of this cafe with search filter
  const cafeMembers = useMemo(() => {
    if (searchQuery) {
      return members.filter(
        (m) =>
          m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return members;
  }, [members, searchQuery]);

  const handleOpenTimeDialog = (member: RegisteredUser, action: 'add' | 'deduct') => {
    setSelectedMember(member);
    setTimeAction(action);
    setHoursToModify(1);
    setShowTimeDialog(true);
  };

  const handleModifyTime = () => {
    if (!selectedMember || hoursToModify <= 0) return;

    const wallet = selectedMember.cafeWallets?.find((w: CafeWallet) => w.cafeId === operator.cafeId);
    if (!wallet) return;

    const minutesToModify = hoursToModify * 60;
    const newRemainingMinutes =
      timeAction === 'add'
        ? wallet.remainingMinutes + minutesToModify
        : Math.max(0, wallet.remainingMinutes - minutesToModify);

    // Note: Date.now() is called inside event handler, not during render
    const now = Date.now();
    context?.updateMemberWallet(selectedMember.id, operator.cafeId, {
      remainingMinutes: newRemainingMinutes,
      lastUpdated: now,
    });

    toast.success(
      `${timeAction === 'add' ? 'Menambahkan' : 'Mengurangi'} ${hoursToModify} jam ${timeAction === 'add' ? 'ke' : 'dari'
      } akun ${selectedMember.username}`
    );

    setShowTimeDialog(false);
    setSelectedMember(null);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="mb-4">
            <h1 className="text-slate-200 flex items-center gap-2">
              <Users className="w-6 h-6 text-teal-400" />
              Manajemen Member
            </h1>
            <p className="text-slate-400 text-sm">{cafe?.name}</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari berdasarkan username atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-teal-500/20 border border-teal-500/30 rounded-2xl p-2">
                <Users className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Members</p>
                <p className="text-slate-100 text-2xl">{loading ? '...' : cafeMembers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-2">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Active Now</p>
                <p className="text-slate-100 text-2xl">
                  {loading ? '...' : cafeMembers.filter((m) =>
                    m.cafeWallets?.some((w) => w.cafeId === operator.cafeId && w.isActive)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Member List */}
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Memuat data member...</p>
            </div>
          </div>
        ) : cafeMembers.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">Tidak ada member ditemukan</p>
              <p className="text-slate-500 text-sm">
                {searchQuery ? 'Coba kata kunci pencarian lain' : 'Member akan muncul di sini'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {cafeMembers.map((member) => {
              const wallet = member.cafeWallets?.find((w) => w.cafeId === operator.cafeId);
              const remainingMinutes = wallet?.remainingMinutes || 0;
              const isActive = wallet?.isActive || false;
              const lastUpdated = wallet?.lastUpdated || 0;

              return (
                <div
                  key={member.id}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6"
                >
                  {/* Member Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Avatar */}
                      <div className="bg-gradient-to-br from-teal-500/20 to-purple-500/20 border border-teal-500/50 rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0">
                        <Crown className="w-7 h-7 text-teal-400" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-slate-200">{member.username}</h3>
                          {isActive && (
                            <span className="bg-green-500/20 border border-green-500/50 text-green-400 text-xs px-2 py-0.5 rounded-full">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{member.email}</span>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-teal-400" />
                              <span className="text-xs text-slate-400">Waktu Tersimpan</span>
                            </div>
                            <p className={`text-sm ${remainingMinutes > 0 ? 'text-teal-300' : 'text-red-400'}`}>
                              {formatTime(remainingMinutes)}
                            </p>
                          </div>

                          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Wallet className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs text-slate-400">Saldo Tunai</span>
                            </div>
                            <p className="text-sm text-cyan-300">
                              Rp {(wallet?.balance || 0).toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span className="text-xs text-slate-400">Terakhir Update</span>
                            </div>
                            <p className="text-sm text-slate-300">
                              {formatDate(lastUpdated)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                    <button
                      onClick={() => handleOpenTimeDialog(member, 'add')}
                      className="flex-1 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Tambah Waktu</span>
                    </button>
                    <button
                      onClick={() => handleOpenTimeDialog(member, 'deduct')}
                      disabled={remainingMinutes <= 0}
                      className={`flex-1 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 ${remainingMinutes > 0
                          ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400'
                          : 'bg-slate-800/30 border border-slate-700/50 text-slate-600 cursor-not-allowed'
                        }`}
                    >
                      <Minus className="w-4 h-4" />
                      <span className="text-sm">Kurangi Waktu</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Modification Dialog */}
      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-0 max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800/50">
            <DialogTitle className="text-slate-200 flex items-center gap-2">
              {timeAction === 'add' ? (
                <>
                  <Plus className="w-5 h-5 text-teal-400" />
                  Tambah Waktu
                </>
              ) : (
                <>
                  <Minus className="w-5 h-5 text-red-400" />
                  Kurangi Waktu
                </>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {timeAction === 'add' ? 'Tambah waktu ke akun member' : 'Kurangi waktu dari akun member'}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6">
            {selectedMember && (
              <>
                {/* Member Info */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-slate-200">{selectedMember.username}</p>
                      <p className="text-slate-400 text-sm">{selectedMember.email}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-slate-400 text-xs mb-1">Waktu Tersimpan Saat Ini</p>
                    <p className="text-teal-300">
                      {formatTime(
                        selectedMember.cafeWallets?.find((w: CafeWallet) => w.cafeId === operator.cafeId)
                          ?.remainingMinutes || 0
                      )}
                    </p>
                  </div>
                </div>

                {/* Hours Input */}
                <div className="mb-6">
                  <label className="block text-slate-300 text-sm mb-3">
                    Jam untuk {timeAction === 'add' ? 'Ditambahkan' : 'Dikurangi'}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setHoursToModify(Math.max(1, hoursToModify - 1))}
                      className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl transition-all"
                    >
                      <Minus className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="flex-1 text-center">
                      <p className="text-4xl text-slate-100">{hoursToModify}</p>
                      <p className="text-slate-400 text-sm">jam</p>
                    </div>
                    <button
                      onClick={() => setHoursToModify(hoursToModify + 1)}
                      className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl transition-all"
                    >
                      <Plus className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-500/30 rounded-2xl p-4 mb-6">
                  <p className="text-slate-400 text-xs mb-2">Setelah modifikasi:</p>
                  <p className="text-teal-300 text-xl">
                    {formatTime(
                      timeAction === 'add'
                        ? (selectedMember.cafeWallets?.find((w: CafeWallet) => w.cafeId === operator.cafeId)
                          ?.remainingMinutes || 0) +
                        hoursToModify * 60
                        : Math.max(
                          0,
                          (selectedMember.cafeWallets?.find((w: CafeWallet) => w.cafeId === operator.cafeId)
                            ?.remainingMinutes || 0) -
                          hoursToModify * 60
                        )
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-800/50 flex gap-3">
            <button
              onClick={() => setShowTimeDialog(false)}
              className="flex-1 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 py-3 rounded-2xl transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleModifyTime}
              className={`flex-1 py-3 rounded-2xl transition-all ${timeAction === 'add'
                  ? 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/30'
                }`}
            >
              Konfirmasi {timeAction === 'add' ? 'Tambah' : 'Kurang'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <OperatorBottomNav />
    </div>
  );
}