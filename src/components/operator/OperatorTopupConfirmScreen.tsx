import { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../../App';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Wallet,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { getBowarTransaction, approveTopup, rejectTopup } from '../../services/api';

interface PendingTopup {
  id: number;
  type: 'topup';
  amount: number;
  description?: string;
  status: 'pending';
  createdAt: string;
  proofImage?: string;
  senderName?: string;
  userId?: number;
  username?: string;
  email?: string;
}

export function OperatorTopupConfirmScreen() {
  const navigate = useNavigate();
  const { topupId } = useParams<{ topupId: string }>();
  const context = useContext(AppContext);
  const operator = context?.operator;

  const [topup, setTopup] = useState<PendingTopup | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectionNote, setShowRejectionNote] = useState(false);
  const [proofImageError, setProofImageError] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);

  useEffect(() => {
    if (!operator) {
      navigate('/operator/login');
      return;
    }

    if (!topupId) {
      toast.error('ID top up tidak valid');
      navigate('/operator/topups');
      return;
    }

    const loadTopup = async () => {
      try {
        setLoading(true);

        const response = await getBowarTransaction(Number(topupId));

        if (!response.data) {
          toast.error('Gagal mengambil data top up');
          navigate('/operator/topups');
          return;
        }

        setTopup(response.data);
      } catch (error: any) {
        console.error('Load topup error:', error);

        if (error?.response?.status === 401) {
          toast.error('Sesi telah berakhir. Silakan login kembali.');
          context?.setOperator(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_operator');
          navigate('/operator/login');
        } else {
          toast.error(
            error?.response?.data?.message || 'Gagal memuat detail top up'
          );
          navigate('/operator/topups');
        }
      } finally {
        setLoading(false);
      }
    };

    loadTopup();
  }, [topupId, operator?.id]);


  const handleApprove = async () => {
    if (!topup) return;

    if (!confirm('Apakah Anda yakin ingin menyetujui top up ini?')) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await approveTopup(topup.id);

      const newBalance = response.data?.newBalance;
      if (newBalance !== undefined) {
        toast.success(
          `Top up berhasil disetujui! Saldo baru: Rp ${newBalance.toLocaleString('id-ID')}`
        );
      } else {
        toast.success(response.message || 'Top up berhasil disetujui');
      }

      // Navigate back to topups list
      navigate('/operator/topups');
    } catch (error: unknown) {
      console.error('Approve error:', error);
      const errorMessage =
        (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
          ? String(error.response.data.message)
          : 'Gagal menyetujui top up';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!topup) return;

    if (!showRejectionNote) {
      setShowRejectionNote(true);
      return;
    }

    if (!rejectionNote.trim()) {
      toast.error('Mohon isi alasan penolakan');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menolak top up ini?')) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await rejectTopup(topup.id, rejectionNote.trim() || undefined);
      toast.success(response.message || 'Top up berhasil ditolak');

      // Navigate back to topups list
      navigate('/operator/topups');
    } catch (error: unknown) {
      console.error('Reject error:', error);
      const errorMessage =
        (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
          ? String(error.response.data.message)
          : 'Gagal menolak top up';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Memuat detail top up...</p>
        </div>
      </div>
    );
  }

  if (!topup) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/operator/topups')}
              className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-slate-100 text-xl">Konfirmasi Top Up</h1>
              <p className="text-slate-400 text-xs mt-1">Review dan verifikasi permintaan top up</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Status Badge */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-amber-400 font-semibold">Status: Pending</p>
            <p className="text-amber-300/70 text-xs">Menunggu konfirmasi operator</p>
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-3">
              <Wallet className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Jumlah Top Up</p>
              <h2 className="text-slate-100 text-3xl font-bold">
                Rp {topup.amount.toLocaleString('id-ID')}
              </h2>
            </div>
          </div>
          {topup.description && (
            <p className="text-slate-300 text-sm mt-2">{topup.description}</p>
          )}
        </div>

        {/* User Info */}
        {(topup.username || topup.email) && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
            <h3 className="text-slate-200 text-lg mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Informasi Pengguna
            </h3>
            <div className="space-y-3">
              {topup.username && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-2">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Username</p>
                    <p className="text-slate-200">{topup.username}</p>
                  </div>
                </div>
              )}
              {topup.email && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Email</p>
                    <p className="text-slate-200">{topup.email}</p>
                  </div>
                </div>
              )}
              {topup.senderName && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-2">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Nama Pengirim</p>
                    <p className="text-slate-200">{topup.senderName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proof Image */}
        {topup.proofImage && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
            <h3 className="text-slate-200 text-lg mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-teal-400" />
              Bukti Transfer
            </h3>
            <div className="relative">
              {proofImageError ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
                  <p className="text-slate-400 text-sm">Gagal memuat gambar</p>
                  <button
                    onClick={() => {
                      setProofImageError(false);
                      window.open(topup.proofImage, '_blank');
                    }}
                    className="mt-3 text-teal-400 text-sm hover:text-teal-300 transition-colors"
                  >
                    Buka di tab baru
                  </button>
                </div>
              ) : (
                <img
                  src={topup.proofImage}
                  alt="Bukti transfer"
                  className="w-full rounded-2xl border border-slate-800 cursor-pointer hover:opacity-90 transition-opacity"
                  onError={() => setProofImageError(true)}
                  onClick={() => setImageModal(topup.proofImage || null)}
                />
              )}
            </div>
            <p className="text-slate-500 text-xs mt-3 text-center">
              Klik gambar untuk melihat dalam ukuran penuh
            </p>
          </div>
        )}

        {/* Transaction Details */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Detail Transaksi
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">ID Transaksi</span>
              <span className="text-slate-200 font-mono text-sm">#{topup.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Tanggal Permintaan</span>
              <span className="text-slate-200 text-sm">
                {topup.createdAt
                  ? new Date(topup.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Tipe</span>
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs">
                Top Up
              </span>
            </div>
          </div>
        </div>

        {/* Rejection Note Input */}
        {showRejectionNote && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6">
            <h3 className="text-red-400 text-lg mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alasan Penolakan
            </h3>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Masukkan alasan penolakan top up ini..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all min-h-[100px] resize-none"
            />
            <p className="text-slate-400 text-xs mt-2">
              Catatan: Alasan penolakan akan dikirim ke pengguna
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          {!showRejectionNote ? (
            <>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Setujui Top Up</span>
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                <span>Tolak Top Up</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionNote.trim()}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                <span>Konfirmasi Penolakan</span>
              </button>
              <button
                onClick={() => {
                  setShowRejectionNote(false);
                  setRejectionNote('');
                }}
                disabled={isProcessing}
                className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 py-3 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </>
          )}
        </div>
      </div>
      {/* Modal Components */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={imageModal} alt="Top Up Proof Fullscreen" className="w-full h-full object-contain rounded-2xl" />
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
