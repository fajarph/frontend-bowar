import { useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import type { RegisteredUser, CafeWallet } from '../../App';
import { Monitor, User, LogIn, LogOut, Clock, Crown, Search } from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { getWarnetDetail } from '../../services/api';

export function OperatorPCGrid() {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const operator = context?.operator;
  const [selectedPC, setSelectedPC] = useState<number | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied'>('all');

  const cafe = context?.cafes.find((c) => c.id === operator?.cafeId);
  const totalPCs = cafe?.totalPCs || 50;

  // Get active bookings for this cafe
  const activeBookings = useMemo(() => {
    return context?.bookings.filter(
      (b) => b.cafeId === operator?.cafeId && b.status === 'active'
    ) || [];
  }, [context?.bookings, operator?.cafeId]);

  // Get cafe members
  const cafeMembers = context?.registeredUsers.filter((u) =>
    u.cafeWallets?.some((w) => w.cafeId === operator?.cafeId)
  ) || [];

  // Sync PC statuses from API
  useEffect(() => {
    const loadPCStatuses = async () => {
      if (operator?.cafeId && context?.setPcStatuses) {
        try {
          const response = await getWarnetDetail(Number(operator.cafeId));
          if (response.data?.pcs) {
            context.setPcStatuses((prev) => ({
              ...prev,
              [operator.cafeId]: response.data.pcs.map((pc: any) => ({
                id: String(pc.id),
                number: pc.number,
                status: pc.status,
                remainingMinutes: pc.remainingMinutes,
                sessionStartTime: pc.status === 'occupied' ? Date.now() : undefined,
              })),
            }));
          }
        } catch (error) {
          console.error('Failed to sync PC statuses for operator:', error);
        }
      }
    };

    loadPCStatuses();
    // Poll every 30 seconds for operator
    const interval = setInterval(loadPCStatuses, 30000);
    return () => clearInterval(interval);
  }, [operator?.cafeId, context?.setPcStatuses]);

  // Filter members by search
  const filteredMembers = cafeMembers.filter(
    (m) =>
      m.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Get PC status from global context
  const getPCStatus = useCallback((pcNum: number) => {
    if (!operator?.cafeId || !context?.pcStatuses[operator.cafeId]) {
      return { status: 'available' as const };
    }

    const pc = context.pcStatuses[operator.cafeId].find((p) => p.number === pcNum);
    if (pc && pc.status === 'occupied') {
      // Find the user if possible (matching by pcNumber in active bookings or other logic)
      const booking = activeBookings.find((b) => b.pcNumber === pcNum);
      const user = booking ? context?.registeredUsers.find((u) => u.id === booking.userId) : undefined;
      const memberWallet = user?.cafeWallets?.find((w) => w.cafeId === operator?.cafeId);

      return {
        status: 'occupied' as const,
        user,
        booking,
        isMember: !!memberWallet,
        isActive: memberWallet?.isActive || false,
        remainingMinutes: pc.remainingMinutes
      };
    }
    return { status: 'available' as const };
  }, [context?.pcStatuses, operator?.cafeId, activeBookings, context?.registeredUsers]);

  const handlePCClick = useCallback((pcNum: number) => {
    setSelectedPC(pcNum);
    const pcStatus = getPCStatus(pcNum);
    if (pcStatus.status === 'available') {
      setShowLoginDialog(true);
    }
  }, [getPCStatus]);

  const handleMemberLogin = useCallback((member: RegisteredUser) => {
    if (selectedPC === null || !operator?.cafeId) return;

    const memberWallet = member.cafeWallets?.find((w: CafeWallet) => w.cafeId === operator.cafeId);

    if (!memberWallet || memberWallet.remainingMinutes <= 0) {
      toast.error('Member tidak memiliki waktu tersimpan. Silakan tambahkan waktu dulu.');
      return;
    }

    // Create a new active booking
    // Date.now() is called inside useCallback event handler, not during render
    const now = Date.now();
    const currentCafe = context?.cafes.find((c) => c.id === operator.cafeId);
    const newBooking = {
      id: `booking-${now}`,
      userId: member.id,
      cafeId: operator.cafeId,
      cafeName: currentCafe?.name || '',
      pcNumber: selectedPC,
      date: new Date().toISOString(),
      time: new Date().toTimeString().slice(0, 5),
      duration: Math.floor(memberWallet.remainingMinutes / 60), // Convert to hours
      status: 'active' as const,
      paymentStatus: 'paid' as const,
      bookedAt: now,
      sessionStartTime: now,
      isSessionActive: true,
    };

    context?.addBooking(newBooking);

    // Activate member wallet
    context?.updateMemberWallet(member.id, operator.cafeId, {
      isActive: true,
      lastUpdated: now,
    });

    toast.success(`${member.username} login ke PC ${selectedPC}`);
    setShowLoginDialog(false);
    setSelectedPC(null);
    setMemberSearch('');
  }, [selectedPC, operator, context]);

  const handleMemberLogout = useCallback((pcNum: number) => {
    const pcStatus = getPCStatus(pcNum);
    if (pcStatus.status !== 'occupied' || !pcStatus.user || !operator?.cafeId) return;

    const memberWallet = pcStatus.user.cafeWallets?.find((w) => w.cafeId === operator.cafeId);
    if (!memberWallet) return;

    // Calculate time used (in minutes)
    // Date.now() is called inside useCallback event handler, not during render
    const now = Date.now();
    const sessionStartTime = pcStatus.booking?.sessionStartTime || now;
    const timeUsed = Math.floor((now - sessionStartTime) / 60000); // Convert ms to minutes

    // Deduct time from wallet
    const newRemainingMinutes = Math.max(0, memberWallet.remainingMinutes - timeUsed);

    context?.updateMemberWallet(pcStatus.user.id, operator.cafeId, {
      remainingMinutes: newRemainingMinutes,
      isActive: false,
      lastUpdated: now,
    });

    // Update booking status
    if (pcStatus.booking) {
      context?.updateBookingStatus(pcStatus.booking.id, 'completed');
    }

    toast.success(
      `${pcStatus.user.username} logout. Waktu digunakan: ${timeUsed} menit. Tersisa: ${newRemainingMinutes} menit.`
    );
  }, [getPCStatus, operator, context]);

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  // Filter PCs
  const pcNumbers = Array.from({ length: totalPCs }, (_, i) => i + 1);
  const filteredPCs = pcNumbers.filter((pc) => {
    const status = getPCStatus(pc).status;
    if (filterStatus === 'all') return true;
    return status === filterStatus;
  });

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-slate-200 flex items-center gap-2">
                <Monitor className="w-6 h-6 text-blue-400" />
                Manajemen PC
              </h1>
              <p className="text-slate-400 text-sm">{cafe?.name}</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-2xl text-sm transition-all ${filterStatus === 'all'
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              All ({totalPCs})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-2xl text-sm transition-all ${filterStatus === 'available'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Available ({totalPCs - activeBookings.length})
            </button>
            <button
              onClick={() => setFilterStatus('occupied')}
              className={`px-4 py-2 rounded-2xl text-sm transition-all ${filterStatus === 'occupied'
                ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Occupied ({activeBookings.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6">
        {/* PC Grid */}
        <div className="grid grid-cols-5 gap-3">
          {filteredPCs.map((pcNum) => {
            const pcStatus = getPCStatus(pcNum);
            const isAvailable = pcStatus.status === 'available';

            return (
              <div
                key={pcNum}
                onClick={() => handlePCClick(pcNum)}
                className={`aspect-square rounded-2xl border-2 transition-all cursor-pointer ${isAvailable
                  ? 'bg-slate-900/50 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10'
                  : 'bg-blue-900/20 border-blue-500/50 hover:border-blue-500/70'
                  }`}
              >
                <div className="flex flex-col items-center justify-center h-full p-2">
                  <Monitor
                    className={`w-6 h-6 mb-1 ${isAvailable ? 'text-green-400' : 'text-blue-400'
                      }`}
                  />
                  <span
                    className={`text-sm ${isAvailable ? 'text-green-300' : 'text-blue-300'
                      }`}
                  >
                    {pcNum}
                  </span>
                  {!isAvailable && pcStatus.user && (
                    <>
                      <div className="w-full border-t border-slate-700/50 mt-1 pt-1">
                        <div className="flex items-center justify-center gap-1">
                          {pcStatus.isMember && (
                            <Crown className="w-3 h-3 text-purple-400" />
                          )}
                          <span className="text-xs text-slate-400 truncate">
                            {pcStatus.user.username}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberLogout(pcNum);
                        }}
                        className="mt-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg px-2 py-0.5 transition-all"
                      >
                        <LogOut className="w-3 h-3 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
          <h3 className="text-slate-300 text-sm mb-3">Legend:</h3>
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-900/50 border-2 border-green-500/50 rounded" />
              <span className="text-slate-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-900/20 border-2 border-blue-500/50 rounded" />
              <span className="text-slate-400">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-0 max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800/50">
            <DialogTitle className="text-slate-200 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-400" />
              Login Member ke PC {selectedPC}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Pilih member untuk login ke PC terpilih
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari member berdasarkan username atau email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Member List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Tidak ada member ditemukan</p>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const wallet = member.cafeWallets?.find((w) => w.cafeId === operator.cafeId);
                  const remainingMinutes = wallet?.remainingMinutes || 0;
                  const isActive = wallet?.isActive || false;

                  return (
                    <button
                      key={member.id}
                      onClick={() => handleMemberLogin(member)}
                      disabled={remainingMinutes <= 0 || isActive}
                      className={`w-full bg-slate-800/50 border rounded-2xl p-4 text-left transition-all ${remainingMinutes > 0 && !isActive
                        ? 'border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800'
                        : 'border-slate-800/50 opacity-50 cursor-not-allowed'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-200">{member.username}</span>
                        </div>
                        {isActive && (
                          <span className="text-xs text-red-400">Sudah login</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span className={remainingMinutes > 0 ? 'text-teal-400' : 'text-red-400'}>
                          {Math.floor(remainingMinutes / 60)}j {remainingMinutes % 60}m tersisa
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-800/50">
            <button
              onClick={() => {
                setShowLoginDialog(false);
                setMemberSearch('');
              }}
              className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 py-3 rounded-2xl transition-all"
            >
              Batal
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <OperatorBottomNav />
    </div>
  );
}