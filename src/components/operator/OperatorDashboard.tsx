import { useContext, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import {
  Monitor,
  DollarSign,
  Calendar,
  TrendingUp,
  Shield,
  LogOut,
  Activity,
  MessageCircle,
  Settings2,
  Wallet
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { getWarnetStatistics } from '../../services/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export function OperatorDashboard() {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const operator = context?.operator;
  const [statistics, setStatistics] = useState<{
    todayRevenue: number;
    todayBookings: number;
    activeBookings: number;
    totalMembers: number;
    pendingTopups: number;
    pendingBookings: number;
    transactions: any[];
  } | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  const cafe = context?.cafes.find((c) => c.id === operator.cafeId);

  // Fetch statistics from backend
  useEffect(() => {
    const loadStatistics = async () => {
      if (!operator?.cafeId) return;

      try {
        const warnetId = parseInt(operator.cafeId);
        const response = await getWarnetStatistics(warnetId);

        if (response.data) {
          setStatistics({
            todayRevenue: response.data.todayRevenue || 0,
            todayBookings: response.data.todayBookings || 0,
            activeBookings: response.data.activeBookings || 0,
            totalMembers: response.data.totalMembers || 0,
            pendingTopups: response.data.pendingTopups || 0,
            pendingBookings: response.data.pendingBookings || 0,
            transactions: response.data.transactions || [],
          });
        }
      } catch (error: any) {
        console.error('Failed to load statistics:', error);
        toast.error('Gagal memuat statistik');
      } finally {
        // No-op
      }
    };

    loadStatistics();
  }, [operator?.cafeId]);

  // Calculate statistics (fallback to context data if API fails)
  const stats = useMemo(() => {
    const cafeBookings = context?.bookings.filter((b) => b.cafeId === operator.cafeId) || [];
    const activeBookingsCount = cafeBookings.filter((b) => b.status === 'active').length;

    // Real unread chat message count
    let unreadChatCount = 0;
    Object.values(context?.chatMessages || {}).forEach((msgs: any[]) => {
      unreadChatCount += msgs.filter(m => String(m.sender).toLowerCase() === 'user' && !m.isRead).length;
    });

    // PC Statistics
    const totalPCs = cafe?.totalPCs || 0;
    const occupiedPCs = activeBookingsCount;
    const availablePCs = Math.max(0, totalPCs - occupiedPCs);
    const utilizationRate = totalPCs > 0 ? ((occupiedPCs / totalPCs) * 100).toFixed(1) : '0';

    return {
      todayBookings: statistics?.todayBookings ?? 0,
      activeBookings: statistics?.activeBookings ?? activeBookingsCount,
      todayRevenue: statistics?.todayRevenue ?? 0,
      totalMembers: statistics?.totalMembers ?? 0,
      totalPCs,
      occupiedPCs,
      availablePCs,
      utilizationRate,
      pendingPayments: statistics?.pendingBookings ?? cafeBookings.filter(b => b.paymentStatus === 'pending' && b.status !== 'cancelled').length,
      unreadMessages: unreadChatCount,
      pendingTopups: statistics?.pendingTopups ?? 0,
    };
  }, [context?.bookings, context?.chatMessages, operator.cafeId, cafe?.totalPCs, statistics]);

  const handleLogout = () => {
    context?.setOperator(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_operator');
    toast.success('👋 Anda berhasil keluar dari panel operator.');
    navigate('/operator/login');
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl p-2">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-slate-100 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Operator Panel
                </h1>
                <p className="text-slate-400 text-xs">{cafe?.name}</p>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutDialog(true)}
              className="bg-slate-800/50 border border-slate-700/50 hover:border-red-500/50 rounded-2xl px-4 py-2 transition-all group"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                <span className="text-slate-400 group-hover:text-red-400 text-sm transition-colors">
                  Keluar
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-2">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Booking Hari Ini</p>
                <p className="text-slate-100 text-xl font-semibold">{stats.todayBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-2">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Sesi Aktif</p>
                <p className="text-slate-100 text-xl font-semibold">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-teal-500/20 border border-teal-500/30 rounded-2xl p-2">
                <DollarSign className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-xs">Pendapatan Hari Ini</p>
                <p className="text-teal-300 text-xl font-semibold">
                  Rp {stats.todayRevenue.toLocaleString('id-ID')}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-teal-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Quick Actions (DYNAMIC & CLEAN) */}
        <div>
          <h3 className="text-slate-300 mb-4 px-1">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* PC Grid Card */}
            <button
              onClick={() => navigate('/operator/pc-grid')}
              className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 hover:border-blue-400/50 rounded-3xl p-5 transition-all text-left group overflow-hidden"
            >
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-2 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Monitor className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-slate-200 font-medium">Grid PC</h4>
              <p className="text-slate-400 text-xs">{stats.availablePCs} Tersedia</p>
            </button>

            {/* Chat Card */}
            <button
              onClick={() => navigate('/operator/chat')}
              className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30 hover:border-purple-400/50 rounded-3xl p-5 transition-all text-left relative group overflow-hidden"
            >
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-2 w-fit mb-3 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-slate-200 font-medium">Chat</h4>
              <p className="text-slate-400 text-xs">
                {stats.unreadMessages > 0 ? `${stats.unreadMessages} pesan baru` : 'Tidak ada pesan'}
              </p>
              {stats.unreadMessages > 0 && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Management Hub Card (Booking Focus) */}
            <button
              onClick={() => navigate('/operator/management')}
              className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 border border-amber-500/30 hover:border-amber-400/50 rounded-3xl p-5 transition-all text-left group overflow-hidden"
            >
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-2 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-slate-200 font-medium">Booking</h4>
              <p className="text-slate-400 text-xs">
                {stats.pendingPayments > 0 ? `${stats.pendingPayments} pending` : 'Semua beres'}
              </p>
            </button>

            {/* Management Hub Card (Top Up Focus) */}
            <button
              onClick={() => navigate('/operator/management')}
              className="bg-gradient-to-br from-teal-900/20 to-teal-800/20 border border-teal-500/30 hover:border-teal-400/50 rounded-3xl p-5 transition-all text-left group overflow-hidden"
            >
              <div className="bg-teal-500/20 border border-teal-500/30 rounded-2xl p-2 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Settings2 className="w-6 h-6 text-teal-400" />
              </div>
              <h4 className="text-slate-200 font-medium">Manajemen</h4>
              <p className="text-slate-400 text-xs">
                {stats.pendingTopups > 0 ? `${stats.pendingTopups} Top Up` : 'Verifikasi & Member'}
              </p>
            </button>
          </div>
        </div>

        {/* PC Status Overview */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-200 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              Status PC
            </h3>
            <span className="text-xs text-slate-500">Utilisasi: {stats.utilizationRate}%</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-3 text-center">
              <p className="text-2xl text-slate-100 font-semibold">{stats.totalPCs}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Total</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 text-center">
              <p className="text-2xl text-green-400 font-semibold">{stats.availablePCs}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Free</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-center">
              <p className="text-2xl text-blue-400 font-semibold">{stats.occupiedPCs}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Used</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {statistics && statistics.transactions.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
            <h3 className="text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              Aktivitas Terbaru
            </h3>
            <div className="space-y-3">
              {statistics.transactions.slice(0, 3).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                  <div className={`p-2 rounded-xl ${transaction.type === 'topup' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                    {transaction.type === 'topup' ? <Wallet size={16} /> : <DollarSign size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">{transaction.description}</p>
                    <p className="text-slate-500 text-xs">{transaction.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-200 text-sm font-semibold">Rp{transaction.amount.toLocaleString('id-ID')}</p>
                    <p className="text-slate-600 text-[10px]">Lunas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <OperatorBottomNav />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-400" />
              Keluar Sesi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Anda perlu login kembali untuk mengakses panel operator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 rounded-2xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl"
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}