import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    Monitor,
    User,
    CheckCircle,
    XCircle,
    Image as ImageIcon,
    Loader2,
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { toast } from 'sonner';
import { getOperatorPendingBookings, approveBookingPayment, rejectBookingPayment } from '../../services/api';
import { ConfirmModal } from '../ui/ConfirmModal';

interface PendingBooking {
    id: number;
    userId: number;
    warnetId: number;
    pcNumber: number;
    bookingDate: string;
    bookingTime: string;
    duration: number;
    status: string;
    paymentStatus: string;
    pricePerHour: number;
    totalPrice: number;
    isMemberBooking: boolean;
    paymentProofImage: string | null;
    paymentAccountName: string | null;
    paymentNotes: string | null;
    createdAt: string;
    user?: {
        id: number;
        username: string;
        email: string;
    };
    warnet?: {
        id: number;
        name: string;
    };
}

export function OperatorPendingBookings() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<PendingBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<number | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        bookingId: number | null;
    }>({ isOpen: false, type: 'approve', bookingId: null });

    const fetchPendingBookings = async () => {
        try {
            setLoading(true);
            const response = await getOperatorPendingBookings();
            setBookings(response.data || []);
        } catch (error: any) {
            console.error('Error fetching pending bookings:', error);
            if (error.response?.status === 403) {
                toast.error('Hanya operator yang dapat mengakses halaman ini');
                navigate('/operator/login');
            } else {
                toast.error('Gagal memuat pending bookings');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingBookings();
    }, []);

    const handleApprove = (bookingId: number) => {
        setConfirmModal({ isOpen: true, type: 'approve', bookingId });
    };

    const handleReject = (bookingId: number) => {
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
            // Refresh list
            fetchPendingBookings();
        } catch (error: any) {
            console.error('Error processing booking:', error);
            toast.error(error.response?.data?.message || 'Gagal memproses booking');
        } finally {
            setActioningId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Memuat pending bookings...</p>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-slate-200 flex items-center gap-2 mb-1">
                        <Calendar className="w-6 h-6 text-purple-400" />
                        Pending Bookings
                    </h1>
                    <p className="text-slate-400 text-sm">Konfirmasi pembayaran transfer bank</p>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 py-6">
                {bookings.length === 0 ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center">
                            <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-slate-600" />
                            </div>
                            <p className="text-slate-400 mb-2">Semua booking sudah diproses</p>
                            <p className="text-slate-500 text-sm">Tidak ada booking yang menunggu konfirmasi</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6"
                            >
                                {/* User Info */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-3">
                                        <User className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-slate-200 font-medium">{booking.user?.username || 'Unknown User'}</h3>
                                        <p className="text-slate-400 text-sm">{booking.user?.email}</p>
                                    </div>
                                    <span className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
                                        Menunggu
                                    </span>
                                </div>

                                {/* Booking Details */}
                                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-800/30 rounded-2xl">
                                    <div>
                                        <p className="text-slate-500 text-xs mb-1">PC Number</p>
                                        <p className="text-slate-200 flex items-center gap-1">
                                            <Monitor className="w-4 h-4 text-cyan-400" />
                                            PC #{booking.pcNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs mb-1">Durasi</p>
                                        <p className="text-slate-200 flex items-center gap-1">
                                            <Clock className="w-4 h-4 text-cyan-400" />
                                            {booking.duration} jam
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-500 text-xs mb-1">Tanggal & Waktu</p>
                                        <p className="text-slate-200 text-sm">
                                            {formatDate(booking.bookingDate)} • {booking.bookingTime}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-slate-300 text-sm">Total Pembayaran</p>
                                        <p className="text-cyan-400 text-xl font-bold">
                                            Rp {booking.totalPrice?.toLocaleString() || '0'}
                                        </p>
                                    </div>

                                    {booking.paymentAccountName && (
                                        <div className="mb-2">
                                            <p className="text-slate-500 text-xs mb-1">Nama Pengirim</p>
                                            <p className="text-slate-200">{booking.paymentAccountName}</p>
                                        </div>
                                    )}

                                    {booking.paymentNotes && (
                                        <div>
                                            <p className="text-slate-500 text-xs mb-1">Catatan</p>
                                            <p className="text-slate-300 text-sm">{booking.paymentNotes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Proof Image */}
                                {booking.paymentProofImage && (
                                    <div className="mb-4">
                                        <p className="text-slate-300 text-sm mb-2">Bukti Transfer:</p>
                                        <div
                                            onClick={() => setImageModal(`http://localhost:3333${booking.paymentProofImage}`)}
                                            className="relative cursor-pointer group rounded-2xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all"
                                        >
                                            <img
                                                src={`http://localhost:3333${booking.paymentProofImage}`}
                                                alt="Payment Proof"
                                                className="w-full h-auto max-h-64 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleReject(booking.id)}
                                        disabled={actioningId === booking.id}
                                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 py-3 rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {actioningId === booking.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" />
                                                <span>Tolak</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleApprove(booking.id)}
                                        disabled={actioningId === booking.id}
                                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 py-3 rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {actioningId === booking.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Setujui</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Modal */}
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

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.type === 'approve' ? 'Setujui Booking?' : 'Tolak Booking?'}
                message={
                    confirmModal.type === 'approve'
                        ? 'Booking akan diaktifkan dan PC akan ditandai sebagai occupied.'
                        : 'Booking akan dibatalkan dan user akan diberitahu.'
                }
                confirmText={confirmModal.type === 'approve' ? 'Setujui' : 'Tolak'}
                cancelText="Batal"
                type={confirmModal.type === 'approve' ? 'info' : 'danger'}
                onConfirm={confirmAction}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />

            <OperatorBottomNav />
        </div>
    );
}
