import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Gamepad2, MapPin, Clock, Plus, X, Wallet, CreditCard, Building2, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

export function HomeScreen() {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [showAddTimeDialog, setShowAddTimeDialog] = useState(false);
  const [selectedCafeForTime, setSelectedCafeForTime] = useState<string>('');
  const [hoursToAdd, setHoursToAdd] = useState(1);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Calculate total stored time for member
  const totalStoredMinutes =
    context?.user?.role === 'member'
      ? context.user.cafeWallets?.reduce((sum, wallet) => sum + wallet.remainingMinutes, 0) || 0
      : 0;

  const handleProceedToPayment = () => {
    if (!selectedCafeForTime) {
      toast.error('Mohon pilih warnet');
      return;
    }
    setPaymentStep('payment');
  };

  const handleConfirmPayment = () => {
    if (!paymentMethod) {
      toast.error('Mohon pilih metode pembayaran');
      return;
    }

    // Get cafe and calculate cost based on member price
    const cafe = context?.cafes.find((c) => c.id === selectedCafeForTime);
    if (!cafe) {
      toast.error('Warnet tidak ditemukan');
      return;
    }

    // Simulate payment processing
    const minutesToAdd = hoursToAdd * 60;

    // Process payment and add time
    context?.extendWallet(selectedCafeForTime, minutesToAdd);

    // Add to booking history
    if (cafe && context && context.user) {
      // Check if user is member at this cafe
      const isMemberAtCafe = context.user.role === 'member' &&
        context.user.cafeWallets?.some((w) => w.cafeId === selectedCafeForTime);

      const historyEntry = {
        id: `time-${Date.now()}`,
        userId: context.user.id, // Add userId to track ownership
        cafeId: selectedCafeForTime,
        cafeName: cafe.name,
        pcNumber: 0, // 0 indicates stored time purchase, not PC booking
        date: new Date().toLocaleDateString('id-ID'),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        duration: hoursToAdd,
        status: 'completed' as const,
        paymentStatus: 'paid' as const,
        bookedAt: Date.now(),
        isMemberBooking: isMemberAtCafe, // Save member status at time of booking
      };
      context.addBooking(historyEntry);
    }

    // Show success step
    setPaymentStep('success');

    toast.success(`Pembayaran berhasil! ${hoursToAdd} jam ditambahkan ke wallet Anda`);

    // Auto close after 2 seconds
    setTimeout(() => {
      setShowAddTimeDialog(false);
      setPaymentStep('select');
      setPaymentMethod('');
      setHoursToAdd(1);
      setSelectedCafeForTime('');
    }, 2000);
  };

  const handleCloseDialog = () => {
    setShowAddTimeDialog(false);
    setPaymentStep('select');
    setPaymentMethod('');
    setHoursToAdd(1);
    setSelectedCafeForTime('');
  };

  const paymentMethods = [
    { id: 'gopay', name: 'GoPay', icon: Wallet },
    { id: 'ovo', name: 'OVO', icon: Wallet },
    { id: 'dana', name: 'DANA', icon: Smartphone },
    { id: 'bank', name: 'Bank Transfer', icon: Building2 },
    { id: 'card', name: 'Credit Card', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-2">
                <Gamepad2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-slate-100 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                  Bowar
                </h1>
                <p className="text-slate-400 text-xs">Temukan spot gaming Anda</p>
              </div>
            </div>

            {/* Member Stored Time (Only for Members) - Clickable */}
            {context?.user?.role === 'member' && (
              <button
                onClick={() => setShowAddTimeDialog(true)}
                className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-2xl px-4 py-2 backdrop-blur-xl transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400 animate-pulse" />
                  <div className="text-left">
                    <p className="text-xs text-slate-400">Total Waktu Bermain</p>
                    <p className="text-teal-300 text-sm">
                      {formatTime(totalStoredMinutes)}
                    </p>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-slate-200 mb-2">
            Selamat datang kembali, {context?.user?.username || 'Gamer'}!
          </h2>
          <p className="text-slate-400 text-sm">Pilih warnet gaming Anda</p>
        </div>

        {/* Map Quick Access Button */}
        <button
          onClick={() => navigate('/map')}
          className="w-full mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-500/50 backdrop-blur-xl rounded-3xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-3 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-slate-200 mb-1">Lihat Peta Warnet</h3>
                <p className="text-slate-400 text-sm">Temukan lokasi terdekat</p>
              </div>
            </div>
            <div className="text-teal-400 group-hover:translate-x-1 transition-transform">
              →
            </div>
          </div>
        </button>

        {/* Warnet Cards Grid */}
        <div className="space-y-4">
          {!context?.cafes || context.cafes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Memuat daftar warnet...</p>
            </div>
          ) : (
            context.cafes.map((cafe) => {
              // Strict check: User role is member AND user's home warnet matches this cafe
              const isMemberCafe = context.user?.role === 'member' &&
                String(context.user?.warnet?.id || '') === String(cafe.id || '');

              return (
                <div
                  key={cafe.id}
                  onClick={() => navigate(`/cafe/${cafe.id}`)}
                  className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-blue-500/50 rounded-3xl overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer"
                >
                  {/* Image with overlay */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={cafe.image}
                      alt={cafe.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                    {/* Member Badge - Pojok Kanan Atas */}
                    {isMemberCafe && (
                      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-xl border border-blue-400/50 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg shadow-blue-500/30">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-white text-xs font-medium">Member</span>
                      </div>
                    )}

                    {/* Info overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-slate-100 mb-1">{cafe.name}</h3>
                      <div className="flex items-start gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-sm line-clamp-1">{cafe.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-5">
                    {/* Pricing */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Harga Regular</p>
                        <p className="text-slate-200">
                          Rp {cafe.regularPricePerHour.toLocaleString()}/jam
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs mb-1">Harga Member</p>
                        <p className="text-teal-400">
                          Rp {cafe.memberPricePerHour.toLocaleString()}/jam
                        </p>
                      </div>
                    </div>

                    {/* PC Count */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">PC Tersedia</span>
                        <span className="text-teal-400 tabular-nums">{cafe.totalPCs} Unit</span>
                      </div>
                    </div>

                    {/* View in Maps Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Placeholder: would open maps in real app
                        window.open(
                          `https://maps.google.com/?q=${encodeURIComponent(cafe.location)}`,
                          '_blank'
                        );
                      }}
                      className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Lihat di Maps</span>
                    </button>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 border-2 border-blue-500/0 group-hover:border-blue-500/20 rounded-3xl pointer-events-none transition-colors" />
                </div>
              );
            })
          )}
        </div>

        {/* Empty State */}
        {context?.cafes.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-400 mb-2">Tidak ada warnet tersedia</p>
            <p className="text-slate-500 text-sm">Cek kembali segera untuk spot gaming baru!</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add Time Dialog */}
      <Dialog open={showAddTimeDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-0 max-w-md">
          <DialogTitle className="sr-only">Add Stored Time</DialogTitle>
          <DialogDescription className="sr-only">
            Add more time to your warnet wallet for later use
          </DialogDescription>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-2">
                  {paymentStep === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-teal-400" />
                  )}
                </div>
                <h2 className="text-slate-200">
                  {paymentStep === 'select' && 'Tambah Waktu Tersimpan'}
                  {paymentStep === 'payment' && 'Metode Pembayaran'}
                  {paymentStep === 'success' && 'Pembayaran Berhasil'}
                </h2>
              </div>
              <button
                onClick={handleCloseDialog}
                className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Step 1: Select Time */}
            {paymentStep === 'select' && (
              <>
                {/* Select Cafe */}
                <div className="mb-6">
                  <label className="text-slate-300 text-sm mb-2 block">Pilih Warnet</label>
                  <select
                    value={selectedCafeForTime}
                    onChange={(e) => setSelectedCafeForTime(e.target.value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.focus();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.currentTarget.focus();
                    }}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-slate-200 focus:border-blue-500/50 focus:outline-none transition-colors"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <option value="">Pilih warnet</option>
                    {context?.user?.cafeWallets?.map((wallet) => {
                      const cafe = context.cafes.find((c) => c.id === wallet.cafeId);
                      return (
                        <option key={wallet.cafeId} value={wallet.cafeId}>
                          {cafe?.name || wallet.cafeId}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Hours Selector */}
                <div className="mb-6">
                  <label className="text-slate-300 text-sm mb-2 block">Jam untuk Ditambah</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setHoursToAdd(Math.max(1, hoursToAdd - 1))}
                      className="bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 p-3 rounded-xl transition-colors"
                    >
                      <span className="text-slate-300">−</span>
                    </button>
                    <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-center">
                      <span className="text-teal-400 text-2xl tabular-nums">{hoursToAdd}</span>
                      <span className="text-slate-400 text-sm ml-2">jam</span>
                    </div>
                    <button
                      onClick={() => setHoursToAdd(hoursToAdd + 1)}
                      className="bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 p-3 rounded-xl transition-colors"
                    >
                      <span className="text-slate-300">+</span>
                    </button>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-sm">Harga per jam</span>
                    <span className="text-slate-200">
                      Rp {selectedCafeForTime
                        ? context?.cafes.find((c) => c.id === selectedCafeForTime)?.memberPricePerHour.toLocaleString() || '0'
                        : '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-500/20">
                    <span className="text-slate-200">Total</span>
                    <span className="text-teal-400">
                      Rp {selectedCafeForTime
                        ? (hoursToAdd * (context?.cafes.find((c) => c.id === selectedCafeForTime)?.memberPricePerHour || 0)).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseDialog}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 py-3 rounded-2xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!selectedCafeForTime}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                  >
                    Lanjut ke Pembayaran
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Payment Method */}
            {paymentStep === 'payment' && (
              <>
                {/* Order Summary */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Durasi</span>
                    <span className="text-slate-200">{hoursToAdd} jam</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <span className="text-slate-200">Total Pembayaran</span>
                    <span className="text-teal-400">
                      Rp {selectedCafeForTime
                        ? (hoursToAdd * (context?.cafes.find((c) => c.id === selectedCafeForTime)?.memberPricePerHour || 0)).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <label className="text-slate-300 text-sm mb-3 block">Pilih Metode Pembayaran</label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`w-full bg-slate-800/50 border rounded-2xl p-4 transition-all flex items-center gap-3 ${paymentMethod === method.id
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-slate-700/50 hover:border-slate-600'
                            }`}
                        >
                          <div className={`p-2 rounded-xl ${paymentMethod === method.id
                            ? 'bg-blue-500/20'
                            : 'bg-slate-700/50'
                            }`}>
                            <Icon className={`w-5 h-5 ${paymentMethod === method.id
                              ? 'text-blue-400'
                              : 'text-slate-400'
                              }`} />
                          </div>
                          <span className={
                            paymentMethod === method.id
                              ? 'text-blue-300'
                              : 'text-slate-300'
                          }>
                            {method.name}
                          </span>
                          {paymentMethod === method.id && (
                            <CheckCircle className="w-5 h-5 text-teal-400 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentStep('select')}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 py-3 rounded-2xl transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={!paymentMethod}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                  >
                    Konfirmasi Pembayaran
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Success */}
            {paymentStep === 'success' && (
              <div className="text-center py-8">
                <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-slate-200 mb-2">Pembayaran Berhasil!</h3>
                <p className="text-slate-400 text-sm mb-4">
                  {hoursToAdd} jam telah ditambahkan ke wallet Anda
                </p>
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Jumlah Dibayar</span>
                    <span className="text-teal-400">
                      Rp {selectedCafeForTime
                        ? (hoursToAdd * (context?.cafes.find((c) => c.id === selectedCafeForTime)?.memberPricePerHour || 0)).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}