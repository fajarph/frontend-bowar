import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Monitor, MapPin, Timer, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBookings, cancelBooking } from '../services/api';
import { ConfirmModal } from './ui/ConfirmModal';

// Define booking type from API (matching backend camelCase response)
interface ApiBooking {
  id: number;
  userId: number;
  warnetId: number;
  pcNumber: number;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'rejected';
  sessionStartTime: string | null;
  sessionEndTime: string | null;
  isSessionActive: boolean;
  pricePerHour: number;
  totalPrice: number;
  isMemberBooking: boolean;
  canCancelUntil: string | null;
  createdAt: string;
  updatedAt: string;
  warnet?: {
    id: number;
    name: string;
    address: string;
    description?: string;
    phone?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  };
}

export function BookingDetailScreen() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await getBookings();
        const bookingsData = response.data?.data?.data || response.data?.data || [];
        const foundBooking = bookingsData.find((b: ApiBooking) => b.id === Number(bookingId));

        if (foundBooking) {
          console.log('Found booking:', foundBooking);
          console.log('PC Number:', foundBooking.pcNumber);
          console.log('Price per hour:', foundBooking.pricePerHour);
          setBooking(foundBooking);
        } else {
          toast.error('Booking tidak ditemukan');
          navigate('/booking-history');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Gagal memuat detail booking');
        navigate('/booking-history');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const canCancelBooking = (): boolean => {
    if (!booking || !booking.canCancelUntil || booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    const cancelDeadline = new Date(booking.canCancelUntil).getTime();
    return currentTime < cancelDeadline;
  };

  const getRemainingCancelTime = (): string => {
    if (!booking?.canCancelUntil) return '';

    const cancelDeadline = new Date(booking.canCancelUntil).getTime();
    const remaining = Math.max(0, cancelDeadline - currentTime);
    const seconds = Math.floor((remaining / 1000) % 60);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCancelBooking = () => {
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!booking) return;

    setShowCancelModal(false);
    setCancelling(true);

    try {
      const response = await cancelBooking(booking.id);

      if (response.data) {
        setBooking({ ...booking, status: 'cancelled' });
        toast.success('✅ Booking berhasil dibatalkan');

        // Navigate back to history after 1.5 seconds
        setTimeout(() => {
          navigate('/booking-history');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error.response?.data?.message || 'Gagal membatalkan booking';
      toast.error(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return 'Menunggu';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Memuat detail booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const showCancelButton = canCancelBooking();

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-200">Detail Booking</h1>
            <p className="text-slate-400 text-sm">Informasi lengkap booking Anda</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Status Card */}
        <div className={`border-2 ${getStatusColor(booking.status)} rounded-3xl p-6 backdrop-blur-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {booking.status === 'active' && <CheckCircle2 className="w-8 h-8 text-cyan-400" />}
              {booking.status === 'completed' && <CheckCircle2 className="w-8 h-8 text-green-400" />}
              {booking.status === 'cancelled' && <XCircle className="w-8 h-8 text-red-400" />}
              {booking.status === 'pending' && <Timer className="w-8 h-8 text-yellow-400" />}
              <div>
                <p className="text-slate-400 text-sm">Status Booking</p>
                <p className="text-2xl font-bold">{getStatusText(booking.status)}</p>
              </div>
            </div>
            {booking.isMemberBooking && (
              <span className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                Member
              </span>
            )}
          </div>

          {booking.paymentStatus === 'paid' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-2">
              <p className="text-green-400 text-sm">✅ Pembayaran Dikonfirmasi</p>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-2">
              <p className="text-yellow-400 text-sm">⏱️ Menunggu Konfirmasi Pembayaran</p>
            </div>
          )}
        </div>

        {/* Warnet Info */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h2 className="text-slate-200 text-lg mb-4">Informasi Warnet</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Monitor className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm">Nama Warnet</p>
                <p className="text-slate-200 font-medium">{booking.warnet?.name || 'N/A'}</p>
              </div>
            </div>

            {booking.warnet?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-400 text-sm">Alamat</p>
                  <p className="text-slate-200">{booking.warnet.address}</p>
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <p className="text-slate-400 text-sm mb-1">PC Number</p>
              <p className="text-cyan-400 text-2xl font-bold">#{booking.pcNumber}</p>
            </div>

            {booking.paymentStatus === 'pending' && booking.warnet?.bankAccountNumber && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-2">
                <p className="text-blue-400 text-xs flex items-center gap-1.5 font-medium">
                  <Monitor className="w-3.5 h-3.5" />
                  REKENING PEMBAYARAN:
                </p>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-blue-500/20">
                  <p className="text-slate-400 text-xs mb-1">Transfer BCA:</p>
                  <p className="text-slate-100 font-mono text-lg font-bold">{booking.warnet.bankAccountNumber}</p>
                  <p className="text-slate-300 text-sm">a/n {booking.warnet.bankAccountName || booking.warnet.name}</p>
                </div>
                <p className="text-slate-400 text-[10px] italic">
                  Silakan transfer sesuai total tagihan dan tunggu konfirmasi operator.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h2 className="text-slate-200 text-lg mb-4">Detail Booking</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm">Tanggal & Waktu</p>
                <p className="text-slate-200">
                  {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
                <p className="text-cyan-400">{booking.bookingTime || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm">Durasi</p>
                <p className="text-slate-200 font-medium">{booking.duration || 0} Jam</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-3xl p-6">
          <h2 className="text-slate-200 text-lg mb-4">Rincian Harga</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <span>Tarif per Jam</span>
              <span>Rp {(booking.pricePerHour || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Durasi</span>
              <span>{booking.duration || 0} jam</span>
            </div>
            {booking.isMemberBooking && (
              <div className="flex items-center justify-between text-blue-400 text-sm">
                <span>💎 Harga Member</span>
                <span>Diterapkan</span>
              </div>
            )}
            <div className="border-t border-cyan-500/30 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-medium">Total Pembayaran</span>
                <span className="text-2xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold">
                  Rp {(booking.totalPrice || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Button with Countdown */}
        {showCancelButton && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-amber-300 font-medium">Waktu Pembatalan Tersisa</p>
                <p className="text-amber-400 text-2xl font-bold tabular-nums">{getRemainingCancelTime()}</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-4">
              Anda masih bisa membatalkan booking ini. Saldo akan dikembalikan ke DompetBowar.
            </p>

            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 py-3 px-4 rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  <span>Membatalkan...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  <span>Batalkan Booking</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Booking Info */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-3">Informasi Tambahan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Booking ID</span>
              <span className="text-slate-300 font-mono">#{booking.id}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Dibuat pada</span>
              <span className="text-slate-300">
                {new Date(booking.createdAt).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Batalkan Booking?"
        message="Apakah Anda yakin ingin membatalkan booking ini? Saldo akan dikembalikan ke DompetBowar."
        confirmText="Ya, Batalkan"
        cancelText="Tidak"
        type="danger"
        onConfirm={confirmCancelBooking}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
