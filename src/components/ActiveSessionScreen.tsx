import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, Monitor, Clock, X, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ActiveSessionScreen() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [cancelTimeLeft, setCancelTimeLeft] = useState<number | null>(null);

  const booking = context?.bookings.find((b) => b.id === bookingId);
  const cafe = context?.cafes.find((c) => c.id === booking?.cafeId);

  // Calculate cancel window countdown (2 minutes)
  useEffect(() => {
    if (!booking?.canCancelUntil) return;

    const interval = setInterval(() => {
      const timeLeft = Math.max(0, Math.floor((booking.canCancelUntil! - Date.now()) / 1000));
      setCancelTimeLeft(timeLeft);

      if (timeLeft === 0) {
        // Time to cancel has expired
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const formatCancelTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSessionTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelBooking = () => {
    if (!booking || !cancelTimeLeft || cancelTimeLeft <= 0) {
      toast.error('Periode pembatalan telah berakhir');
      return;
    }

    // Cancel the booking
    context?.updateBooking(bookingId!, {
      status: 'cancelled',
    });

    // Remove time from member wallet if it was added
    if (context?.user?.role === 'member' && booking.cafeId) {
      const wallet = context.user.cafeWallets?.find((w) => w.cafeId === booking.cafeId);
      if (wallet && wallet.remainingMinutes >= booking.duration * 60) {
        context.updateWallet(
          booking.cafeId,
          wallet.remainingMinutes - booking.duration * 60,
          wallet.isActive
        );
      }
    }

    toast.success('❌ Booking berhasil dibatalkan.');
    navigate('/booking-history');
  };

  const handleExtendSession = () => {
    // Navigate to booking screen to extend
    toast.info('Perpanjangan memerlukan pembayaran tambahan');
    navigate(`/booking/${booking?.cafeId}/${booking?.pcNumber}`);
  };

  if (!booking || !cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Booking tidak ditemukan</p>
      </div>
    );
  }

  const canCancel = cancelTimeLeft !== null && cancelTimeLeft > 0;

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate('/booking-history')}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-200">
              {booking.isSessionActive ? 'Sesi Aktif' : 'Detail Booking'}
            </h1>
            <p className="text-slate-400 text-sm">
              {booking.isSessionActive ? 'Gaming sedang berlangsung' : 'Menunggu untuk dimulai'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Session Timer (Only if active) */}
        {booking.isSessionActive && booking.remainingMinutes !== undefined && (
          <div className="bg-gradient-to-br from-cyan-500/20 to-green-500/20 border-2 border-cyan-400/50 rounded-3xl p-8 text-center shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-cyan-400 animate-pulse" />
              <p className="text-slate-300">⏳ Waktu Tersisa</p>
            </div>
            <p className="text-6xl bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent tabular-nums mb-2">
              {formatSessionTime(booking.remainingMinutes)}
            </p>
            <p className="text-slate-400 text-sm">
              Waktu akan berkurang saat Anda bermain
            </p>
          </div>
        )}

        {/* Cancellation Timer (Only if within 2 minutes) */}
        {canCancel && !booking.isSessionActive && (
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <div>
                <h3 className="text-orange-300">Jendela Pembatalan</h3>
                <p className="text-slate-400 text-sm">Anda dapat membatalkan dalam 2 menit setelah pembayaran</p>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-orange-500/30 rounded-2xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-2">Pembatalan tersedia selama</p>
              <p className="text-4xl text-orange-400 tabular-nums">
                {formatCancelTime(cancelTimeLeft)}
              </p>
            </div>
          </div>
        )}

        {/* Booking Info Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-2xl p-4">
              <Monitor className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-slate-200 mb-1">PC #{booking.pcNumber}</h2>
              <p className="text-slate-400 text-sm">{cafe.name}</p>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs ${
                booking.isSessionActive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {booking.isSessionActive ? 'Bermain' : 'Dipesan'}
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-800/50 pt-4">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm text-slate-400">📅 Tanggal</span>
              <span>{booking.date}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm text-slate-400">🕗 Waktu</span>
              <span>{booking.time}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm text-slate-400">Durasi</span>
              <span>{booking.duration} {booking.duration === 1 ? 'jam' : 'jam'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Pembayaran</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm">Lunas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        {!booking.isSessionActive && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-3xl p-6">
            <h3 className="text-cyan-300 mb-3">📌 Informasi Penting</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Waktu billing akan dimulai saat Anda login di warnet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Reservasi Anda terjamin untuk PC ini</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Hitung mundur timer dimulai setelah login di warnet</span>
              </li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Extend Session Button (Always visible for paid bookings) */}
          {booking.paymentStatus === 'paid' && (
            <button
              onClick={handleExtendSession}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              ➕ Perpanjang Sesi
            </button>
          )}

          {/* Cancel Booking Button (Only within 2 minutes) */}
          {canCancel && !booking.isSessionActive && (
            <button
              onClick={handleCancelBooking}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Batalkan Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}