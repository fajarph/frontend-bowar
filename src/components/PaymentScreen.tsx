import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext, type User } from '../App';
import { ArrowLeft, Building2, Shield, Info, X, Upload, Check, Wallet, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { getWarnetDetail } from '../services/api';

export function PaymentScreen() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [paymentMethod, setPaymentMethod] = useState<'bowar' | 'bca' | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [warnetDetail, setWarnetDetail] = useState<{
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
  } | null>(null);

  const booking = context?.bookings.find((b) => b.id === bookingId);
  const cafe = context?.cafes.find((c) => c.id === booking?.cafeId);

  // Load warnet detail from API to get bank account info
  useEffect(() => {
    const loadWarnetDetail = async () => {
      if (!booking?.cafeId) return;

      try {
        const response = await getWarnetDetail(Number(booking.cafeId));
        if (response.data) {
          setWarnetDetail({
            bankAccountNumber: response.data.bankAccountNumber,
            bankAccountName: response.data.bankAccountName,
          });
        }
      } catch (error) {
        console.error('Failed to load warnet detail:', error);
      }
    };

    loadWarnetDetail();
  }, [booking?.cafeId]);

  const pricePerHour =
    context?.user?.role === 'member' &&
      context.user.cafeWallets?.some((w) => w.cafeId === booking?.cafeId)
      ? cafe?.memberPricePerHour || 0
      : cafe?.regularPricePerHour || 0;

  const totalPrice = pricePerHour * (booking?.duration || 0);
  const bowarBalance = context?.user?.bowarWallet || 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    // Read and preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBowarPayment = () => {
    if (bowarBalance < totalPrice) {
      toast.error('Saldo DompetBowar tidak cukup');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // ✅ POTONG SALDO HANYA SEKALI
      context?.setUser((prev: User | null) => {
        if (!prev) return prev;

        const newBalance = (prev.bowarWallet || 0) - totalPrice;

        return {
          ...prev,
          bowarWallet: newBalance,
        };
      });

      // ✅ JANGAN sync manual ke registeredUsers (INI SUMBER BUG)
      // ❌ HAPUS BLOK INI:
      // context.registeredUsers.forEach((u) => {
      //   if (u.id === prev.id) {
      //     u.bowarWallet = updatedUser.bowarWallet;
      //   }
      // });

      // Update booking
      context?.updateBooking(bookingId!, {
        paymentStatus: 'paid',
        canCancelUntil: Date.now() + 120000,
      });

      // Tambah waktu untuk member
      if (context?.user?.role === 'member' && booking?.cafeId) {
        const existingWallet = context.user.cafeWallets?.find(
          (w) => w.cafeId === booking.cafeId
        );

        if (existingWallet) {
          context.extendWallet(booking.cafeId, booking.duration * 60);
        }
      }

      toast.success('✅ Pembayaran berhasil via DompetBowar!');
      setIsProcessing(false);

      setTimeout(() => {
        navigate('/booking-history');
      }, 1500);
    }, 1500);
  };

  const handleSubmitPayment = () => {
    if (!senderName.trim()) {
      toast.error('Nama pengirim wajib diisi');
      return;
    }

    if (!proofImage) {
      toast.error('Screenshot bukti transfer wajib diupload');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      // Update booking to paid
      context?.updateBooking(bookingId!, {
        paymentStatus: 'paid',
        canCancelUntil: Date.now() + 120000, // 2 minutes from now
      });

      // For members at THIS cafe, add time to wallet
      if (context?.user?.role === 'member' && booking?.cafeId) {
        const existingWallet = context.user.cafeWallets?.find(
          (w) => w.cafeId === booking.cafeId
        );

        if (existingWallet) {
          context.extendWallet(booking.cafeId, booking.duration * 60);
        }
      }

      toast.success('✅ Pembayaran berhasil! Waktu dimulai setelah login di warnet.');
      setIsProcessing(false);

      // Navigate to booking history
      setTimeout(() => {
        navigate('/booking-history');
      }, 1500);
    }, 2000);
  };

  if (!booking || !cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Booking tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
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
            <h1 className="text-slate-200">Pembayaran</h1>
            <p className="text-slate-400 text-sm">
              {paymentMethod === 'bowar' ? 'Via DompetBowar' : paymentMethod === 'bca' ? 'Via Transfer BCA' : 'Pilih metode pembayaran'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Ringkasan Pesanan</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">Warnet</span>
              <span className="text-right">{cafe.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">Nomor PC</span>
              <span>#{booking.pcNumber}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">📅 Tanggal</span>
              <span>{booking.date}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">🕗 Waktu</span>
              <span>{booking.time}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">Durasi</span>
              <span>{booking.duration} {booking.duration === 1 ? 'jam' : 'jam'}</span>
            </div>
            <div className="border-t border-cyan-500/30 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Pembayaran</span>
                <span className="text-2xl text-cyan-400 tabular-nums">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        {!paymentMethod && (
          <div className="space-y-4">
            <h3 className="text-slate-200">Pilih Metode Pembayaran</h3>

            {/* DompetBowar Option */}
            <button
              onClick={() => {
                if (bowarBalance < totalPrice) {
                  toast.error('Saldo DompetBowar tidak cukup');
                  return;
                }
                setPaymentMethod('bowar');
              }}
              className={`w-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border rounded-3xl p-5 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all group text-left ${bowarBalance < totalPrice ? 'border-slate-700 opacity-60' : 'border-cyan-500/50 hover:border-cyan-500/70'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-3">
                    <Wallet className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-medium">DompetBowar</h4>
                    <p className="text-slate-400 text-sm">Bayar dengan wallet</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs mb-1">Saldo Anda</p>
                  <p className={`text-sm tabular-nums ${bowarBalance < totalPrice ? 'text-red-400' : 'text-cyan-400'}`}>
                    Rp {bowarBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              {bowarBalance < totalPrice && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                  <p className="text-red-400 text-xs">
                    ❌ Saldo tidak cukup. Minimal Rp {totalPrice.toLocaleString()}
                  </p>
                </div>
              )}

              {bowarBalance >= totalPrice && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                  <p className="text-green-400 text-xs">
                    ✅ Pembayaran instan - Langsung dikonfirmasi
                  </p>
                </div>
              )}
            </button>

            {/* BCA Transfer Option */}
            <button
              onClick={() => setPaymentMethod('bca')}
              className="w-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 hover:border-blue-500/70 rounded-3xl p-5 hover:from-blue-500/30 hover:to-blue-600/30 transition-all group text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3">
                    <Building2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-medium">Transfer BCA</h4>
                    <p className="text-slate-400 text-sm">Transfer via bank</p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2">
                <p className="text-blue-400 text-xs">
                  ⏱️ Konfirmasi dalam 1-5 menit setelah upload bukti
                </p>
              </div>
            </button>

            {/* Top Up Link */}
            {bowarBalance < totalPrice && (
              <button
                onClick={() => navigate('/dompet-bowar')}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm">Top Up DompetBowar</span>
              </button>
            )}
          </div>
        )}

        {/* BCA Transfer Instructions - Only show if BCA is selected */}
        {paymentMethod === 'bca' && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-2">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-slate-200">Informasi Transfer</h3>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Bank</span>
                  <span className="text-slate-200 font-medium">BCA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Nomor Rekening</span>
                  {warnetDetail?.bankAccountNumber ? (
                    <span className="text-cyan-400 font-mono text-lg">{warnetDetail.bankAccountNumber}</span>
                  ) : (
                    <span className="text-slate-500 text-sm italic">Belum tersedia</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Atas Nama</span>
                  {warnetDetail?.bankAccountName ? (
                    <span className="text-slate-200 font-medium">{warnetDetail.bankAccountName}</span>
                  ) : (
                    <span className="text-slate-500 text-sm italic">Belum tersedia</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Jumlah Transfer</span>
                  <span className="text-cyan-400 font-bold text-lg">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-300 text-sm font-medium mb-1">Perhatian</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Transfer sesuai nominal yang tertera. Setelah transfer, klik tombol di bawah untuk konfirmasi pembayaran.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DompetBowar Confirmation - Only show if Bowar is selected */}
        {paymentMethod === 'bowar' && (
          <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-slate-200">Konfirmasi Pembayaran</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Saldo Saat Ini</span>
                  <span className="text-cyan-400 tabular-nums">Rp {bowarBalance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Total Pembayaran</span>
                  <span className="text-red-400 tabular-nums">- Rp {totalPrice.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-medium">Sisa Saldo</span>
                    <span className="text-green-400 font-bold text-lg tabular-nums">
                      Rp {(bowarBalance - totalPrice).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-300 text-sm font-medium mb-1">Pembayaran Instan</p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Booking Anda akan langsung dikonfirmasi setelah pembayaran. Saldo akan terpotong otomatis dari DompetBowar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Payment Button */}
      {paymentMethod && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
          <div className="flex gap-3">
            <button
              onClick={() => setPaymentMethod(null)}
              className="flex-shrink-0 px-6 bg-slate-800 border border-slate-700 text-slate-300 py-4 rounded-2xl hover:bg-slate-700 transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={paymentMethod === 'bowar' ? handleBowarPayment : () => setShowPaymentForm(true)}
              disabled={isProcessing}
              className={`flex-1 py-4 rounded-2xl transition-all font-semibold flex items-center justify-center gap-2 ${paymentMethod === 'bowar'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                } disabled:cursor-not-allowed text-white disabled:shadow-none`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : paymentMethod === 'bowar' ? (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Bayar dengan DompetBowar</span>
                </>
              ) : (
                <span>Konfirmasi Pembayaran</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment Form Modal - Only for BCA */}
      {showPaymentForm && paymentMethod === 'bca' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-slate-200 text-lg">Konfirmasi Pembayaran</h3>
                <p className="text-slate-400 text-sm">Lengkapi data di bawah ini</p>
              </div>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="bg-slate-800 border border-slate-700 p-2 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Sender Name Input */}
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Nama Pengirim <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Masukkan nama pemilik rekening"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Proof Image Upload */}
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Upload Bukti Transfer <span className="text-red-400">*</span>
                </label>

                {!proofImage ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      className="flex flex-col items-center justify-center w-full bg-slate-800/50 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl px-4 py-8 cursor-pointer transition-all"
                    >
                      <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-full p-4 mb-3">
                        <Upload className="w-8 h-8 text-cyan-400" />
                      </div>
                      <p className="text-slate-200 text-sm font-medium mb-1">
                        Klik untuk upload screenshot
                      </p>
                      <p className="text-slate-500 text-xs">
                        PNG, JPG, JPEG (Max. 5MB)
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                      <img
                        src={proofImage}
                        alt="Bukti Transfer"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                      <button
                        onClick={() => setProofImage(null)}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-2 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Bukti transfer berhasil diupload</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium mb-1">Keamanan Data</p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Data yang Anda masukkan akan diverifikasi oleh sistem kami. Pembayaran akan dikonfirmasi dalam 1-5 menit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitPayment}
                disabled={isProcessing || !senderName.trim() || !proofImage}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none flex items-center justify-center gap-2 font-semibold"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Konfirmasi Pembayaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}