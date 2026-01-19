import { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import {
  Calendar,
  Clock,
  Monitor,
  Crown,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { toast } from 'sonner';
import {
  getOperatorBookings,
  approveBookingPayment,
  rejectBookingPayment
} from '../../services/api';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useEffect } from 'react';

export function OperatorBookings() {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const operator = context?.operator;
  const [operatorBookings, setOperatorBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    bookingId: number | null;
  }>({ isOpen: false, type: 'approve', bookingId: null });

  const cafe = context?.cafes.find((c) => c.id === operator?.cafeId);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getOperatorBookings(1, 50, filterStatus, searchQuery); // Assuming pagination and search are handled by API
      setOperatorBookings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Gagal memuat daftar booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (operator?.cafeId) { // Only fetch if operator is loaded
      fetchBookings();
    }
  }, [filterStatus, searchQuery, operator?.cafeId]); // Re-fetch when filter, search, or operator changes

  // Statistics from local state (or we could fetch them)
  const stats = useMemo(() => {
    return {
      total: operatorBookings.length,
      active: operatorBookings.filter((b) => b.status === 'active').length,
      pending: operatorBookings.filter((b) => b.paymentStatus === 'pending' && b.status !== 'cancelled').length,
      completed: operatorBookings.filter((b) => b.status === 'completed').length,
    };
  }, [operatorBookings]);

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  const handleConfirmPayment = (bookingId: number) => {
    setConfirmModal({ isOpen: true, type: 'approve', bookingId });
  };

  const handleCancelBooking = (bookingId: number) => {
    setConfirmModal({ isOpen: true, type: 'reject', bookingId });
  };

  const confirmAction = async () => {
    if (!confirmModal.bookingId) return;

    setActioningId(confirmModal.bookingId);
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      if (confirmModal.type === 'approve') {
        await approveBookingPayment(confirmModal.bookingId);
        toast.success('✅ Booking berhasil disetujui!');
      } else {
        await rejectBookingPayment(confirmModal.bookingId);
        toast.success('❌ Booking berhasil ditolak');
      }
      fetchBookings(); // Use the local fetchBookings
    } catch (error: any) {
      console.error('Error processing booking:', error);
      toast.error(error.response?.data?.message || 'Gagal memproses booking');
    } finally {
      setActioningId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="mb-4">
            <h1 className="text-slate-200 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              Manajemen Booking
            </h1>
            <p className="text-slate-400 text-sm">{cafe?.name}</p>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari berdasarkan username, email, atau nomor PC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${filterStatus === 'all'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${filterStatus === 'active'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Aktif ({stats.active})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${filterStatus === 'pending'
                ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Pembayaran Tertunda ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${filterStatus === 'completed'
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Selesai ({stats.completed})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : operatorBookings.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">Tidak ada booking ditemukan</p>
              <p className="text-slate-500 text-sm">
                {searchQuery || filterStatus !== 'all'
                  ? 'Coba sesuaikan filter Anda'
                  : 'Booking akan muncul di sini'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {operatorBookings.map((booking) => {
              const user = booking.user; // Assuming user data is nested in booking
              const isMember = booking.isMemberBooking; // Assuming this field comes from API
              const isStoredTimePurchase = booking.pcNumber === 0;

              return (
                <div
                  key={booking.id}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div className={`rounded-2xl p-3 ${isStoredTimePurchase
                        ? 'bg-teal-500/20 border border-teal-500/30'
                        : booking.status === 'active'
                          ? 'bg-green-500/20 border border-green-500/30'
                          : booking.status === 'completed'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-slate-800/50 border border-slate-700/50'
                        }`}>
                        {isStoredTimePurchase ? (
                          <Clock className="w-5 h-5 text-teal-400" />
                        ) : (
                          <Monitor className="w-5 h-5 text-blue-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isMember && <Crown className="w-4 h-4 text-purple-400" />}
                          <h3 className="text-slate-200">{user?.username || 'Tidak diketahui'}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{user?.email}</p>

                        {/* Booking Details */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          {!isStoredTimePurchase && (
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3.5 h-3.5" />
                              <span>PC {booking.pcNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(booking.bookingDate || booking.date)}</span>
                          </div>
                          {!isStoredTimePurchase && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{booking.bookingTime || booking.time} • {booking.duration}j</span>
                            </div>
                          )}
                          {isStoredTimePurchase && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{booking.duration} jam dibeli</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {booking.status === 'active' && (
                        <span className="bg-green-500/20 border border-green-500/50 text-green-400 text-xs px-3 py-1.5 rounded-full">
                          Aktif
                        </span>
                      )}
                      {booking.status === 'completed' && (
                        <span className="bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs px-3 py-1.5 rounded-full">
                          Selesai
                        </span>
                      )}
                      {booking.paymentStatus === 'pending' && (
                        <span className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs px-3 py-1.5 rounded-full">
                          Tertunda
                        </span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="bg-red-500/20 border border-red-500/50 text-red-400 text-xs px-3 py-1.5 rounded-full">
                          Dibatalkan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Payment Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-teal-400" />
                      <span className="text-teal-300">
                        {formatCurrency(booking.totalPrice)}
                      </span>
                      {booking.paymentStatus === 'paid' ? (
                        <span className="text-xs text-green-400 flex items-center gap-1 ml-2">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Lunas
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1 ml-2">
                          <XCircle className="w-3.5 h-3.5" />
                          Belum Lunas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Proof Details (Newly Added) */}
                  {booking.paymentStatus === 'pending' && (booking.paymentProofImage || booking.paymentAccountName) && (
                    <div className="mt-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                      <h4 className="text-slate-300 text-sm font-medium mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                        Detail Bukti Transfer
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {booking.paymentAccountName && (
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Nama Pengirim</p>
                              <p className="text-slate-200 text-sm">{booking.paymentAccountName}</p>
                            </div>
                          )}
                          {booking.paymentNotes && (
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Catatan</p>
                              <p className="text-slate-300 text-sm">{booking.paymentNotes}</p>
                            </div>
                          )}
                        </div>

                        {booking.paymentProofImage && (
                          <div
                            onClick={() => setImageModal(`http://localhost:3333${booking.paymentProofImage}`)}
                            className="relative cursor-pointer group rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all max-w-[200px]"
                          >
                            <img
                              src={`http://localhost:3333${booking.paymentProofImage}`}
                              alt="Payment Proof"
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Search className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Move Actions Here for better UX when there is payment proof */}
                  <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                      {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => handleCancelBooking(Number(booking.id))}
                            disabled={actioningId === Number(booking.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleConfirmPayment(Number(booking.id))}
                            disabled={actioningId === Number(booking.id)}
                            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {actioningId === Number(booking.id) && <Loader2 className="w-4 h-4 animate-spin" />}
                            Setujui Pembayaran
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {/* Modal Components */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={imageModal} alt="Payment Proof Fullscreen" className="w-full h-full object-contain rounded-2xl" />
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'approve' ? 'Setujui Pembayaran?' : 'Tolak/Batalkan Booking?'}
        message={
          confirmModal.type === 'approve'
            ? 'Pembayaran akan diterima dan booking akan diaktifkan.'
            : 'Booking akan dibatalkan/ditolak. Jika pembayaran sudah ditransfer, Anda harus melakukan refund manual.'
        }
        confirmText={confirmModal.type === 'approve' ? 'Setujui' : 'Tolak/Batal'}
        cancelText="Batal"
        type={confirmModal.type === 'approve' ? 'info' : 'danger'}
        onConfirm={confirmAction}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      <OperatorBottomNav />
    </div>
  );
}