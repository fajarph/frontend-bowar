import { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, Monitor, Calendar, Clock, Plus, Minus, Wallet, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { createBooking } from '../services/api';

export function BookingScreen() {
  const { cafeId, pcNumber } = useParams<{ cafeId: string; pcNumber: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [duration, setDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Set current date and time
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState(
    now.toTimeString().slice(0, 5) // HH:MM format
  );

  // Bank transfer payment proof states
  const [paymentAccountName, setPaymentAccountName] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cafe = context?.cafes.find((c) => c.id === cafeId);
  const isMemberCafe =
    context?.user?.role === 'member' &&
    String(context.user.warnet?.id || '') === String(cafe?.id || '');

  // Check if this is first member booking
  const isFirstMemberBooking =
    isMemberCafe &&
    context.user?.cafeWallets?.find((w) => w.cafeId === cafeId)?.remainingMinutes === 0;

  // Minimum duration for first member booking
  const minDuration = isFirstMemberBooking ? 2 : 1;

  if (!cafe || !pcNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Booking tidak valid</p>
      </div>
    );
  }

  const pricePerHour = isMemberCafe
    ? cafe.memberPricePerHour
    : cafe.regularPricePerHour;
  const totalPrice = pricePerHour * duration;
  const bowarBalance = context?.user?.cafeWallets?.find(w => w.cafeId === cafeId)?.balance || 0;

  const handleCreateBooking = async () => {
    if (!paymentMethod) {
      toast.error('Pilih metode pembayaran terlebih dahulu');
      return;
    }

    if (duration < minDuration) {
      toast.error(`Booking member pertama membutuhkan minimum ${minDuration} jam`);
      return;
    }

    if (paymentMethod === 'dompet_bowar' && bowarBalance < totalPrice) {
      toast.error(`Saldo di ${cafe.name} tidak cukup. Silakan top up khusus di warnet ini.`);
      return;
    }

    // Validate bank transfer requirements
    if (paymentMethod === 'bank_transfer') {
      if (!paymentAccountName.trim()) {
        toast.error('Nama pemilik rekening harus diisi');
        return;
      }
      if (!paymentProofImage) {
        toast.error('Bukti transfer harus diupload');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('warnetId', cafeId!);
      formData.append('pcNumber', pcNumber!);
      formData.append('bookingDate', date);
      formData.append('bookingTime', time);
      formData.append('duration', duration.toString());
      formData.append('paymentMethod', paymentMethod);

      // Add payment proof data for bank transfer
      if (paymentMethod === 'bank_transfer') {
        formData.append('paymentAccountName', paymentAccountName);
        if (paymentProofImage) {
          formData.append('paymentProofImage', paymentProofImage);
        }
      }

      const response = await createBooking(formData);

      if (response.data) {
        // Update local user balance if payment was via DompetBowar
        if (paymentMethod === 'dompet_bowar' && context?.user) {
          context.setUser((prev) => {
            if (!prev) return prev;
            const updatedWallets = prev.cafeWallets?.map(w =>
              w.cafeId === cafeId ? { ...w, balance: w.balance - totalPrice } : w
            );
            return { ...prev, cafeWallets: updatedWallets };
          });
        }

        toast.success(
          paymentMethod === 'dompet_bowar'
            ? '✅ Booking berhasil! Pembayaran telah dikonfirmasi.'
            : '✅ Booking berhasil! Menunggu konfirmasi pembayaran.'
        );

        setTimeout(() => {
          navigate('/booking-history');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.duration ||
        'Gagal membuat booking. Silakan coba lagi.';

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-200">Detail Booking</h1>
            <p className="text-slate-400 text-sm">Lengkapi pesanan Anda</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* PC Info */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-2xl p-4">
              <Monitor className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-slate-200 mb-1">PC #{pcNumber}</h2>
              <p className="text-slate-400 text-sm">{cafe.name}</p>
              {isMemberCafe && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-2 py-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="text-cyan-400 text-xs">Tarif Member</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Detail Pesanan</h3>
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">📅 Tanggal Pesanan</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">🕗 Waktu Pesanan</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Durasi</h3>
          {isFirstMemberBooking && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-3 mb-4">
              <p className="text-cyan-300 text-sm">
                ℹ️ Booking member pertama membutuhkan minimum 2 jam
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDuration(Math.max(minDuration, duration - 1))}
              disabled={duration <= minDuration}
              className="bg-slate-800/50 border border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-2xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all"
            >
              <Minus className="w-6 h-6 text-slate-300" />
            </button>
            <div className="text-center">
              <p className="text-5xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tabular-nums mb-2">
                {duration}
              </p>
              <p className="text-slate-400">
                {duration === 1 ? 'jam' : 'jam'}
              </p>
            </div>
            <button
              onClick={() => setDuration(duration + 1)}
              className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all"
            >
              <Plus className="w-6 h-6 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Ringkasan Harga</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <span>Tarif per Jam</span>
              <span>Rp {pricePerHour.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Durasi</span>
              <span>{duration} {duration === 1 ? 'jam' : 'jam'}</span>
            </div>
            {isMemberCafe && (
              <div className="flex items-center justify-between text-cyan-400 text-sm">
                <span>💎 Diskon Member</span>
                <span>Diterapkan</span>
              </div>
            )}
            <div className="border-t border-slate-700/50 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Pembayaran</span>
                <span className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tabular-nums">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Metode Pembayaran</h3>
          <div className="space-y-3">
            {/* DompetBowar Option */}
            <button
              onClick={() => setPaymentMethod('dompet_bowar')}
              className={`w-full bg-gradient-to-br rounded-2xl p-4 border transition-all text-left ${paymentMethod === 'dompet_bowar'
                ? 'from-cyan-500/30 to-purple-500/30 border-cyan-500/70 ring-2 ring-cyan-500/50'
                : 'from-slate-800/30 to-slate-900/30 border-slate-700/50 hover:border-cyan-500/50'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-2">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-medium">Saldo Warnet</h4>
                    <p className="text-slate-400 text-sm">Bayar dengan saldo {cafe.name}</p>
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
                <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                  <p className="text-red-400 text-xs">
                    ❌ Saldo tidak cukup. Minimal Rp {totalPrice.toLocaleString()}
                  </p>
                </div>
              )}
            </button>

            {/* Bank Transfer Option */}
            <button
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`w-full bg-gradient-to-br rounded-2xl p-4 border transition-all text-left ${paymentMethod === 'bank_transfer'
                ? 'from-blue-500/30 to-blue-600/30 border-blue-500/70 ring-2 ring-blue-500/50'
                : 'from-slate-800/30 to-slate-900/30 border-slate-700/50 hover:border-blue-500/50'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-medium">Transfer Bank</h4>
                    <p className="text-slate-400 text-sm">Transfer via BCA</p>
                  </div>
                </div>
              </div>
              {cafe?.bankAccountNumber && (
                <div className="mt-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 space-y-1">
                  <p className="text-slate-400 text-xs">Transfer ke:</p>
                  <p className="text-cyan-400 font-mono font-medium">{cafe.bankAccountNumber}</p>
                  {cafe.bankAccountName && (
                    <p className="text-slate-300 text-sm">a/n {cafe.bankAccountName}</p>
                  )}
                </div>
              )}
              <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2">
                <p className="text-blue-400 text-xs">
                  ⏱️ Perlu konfirmasi operator
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Proof Form - Bank Transfer */}
        {paymentMethod === 'bank_transfer' && (
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-3xl p-6">
            <h3 className="text-slate-200 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Upload Bukti Transfer
            </h3>

            {/* Account Name Input */}
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">
                Nama Pemilik Rekening
              </label>
              <input
                type="text"
                value={paymentAccountName}
                onChange={(e) => setPaymentAccountName(e.target.value)}
                placeholder="Contoh: John Doe"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">
                Screenshot Bukti Transfer (Max 15MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 15 * 1024 * 1024) {
                      toast.error('Ukuran file maksimal 15MB');
                      e.target.value = '';
                      return;
                    }
                    setPaymentProofImage(file);
                    // Create preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 cursor-pointer"
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                <p className="text-slate-300 text-sm mb-2">Preview:</p>
                <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-xl" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
        <button
          onClick={handleCreateBooking}
          disabled={!paymentMethod || isProcessing}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Konfirmasi Booking</span>
          )}
        </button>
      </div>
    </div>
  );
}