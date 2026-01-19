import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, Wallet, Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Upload, X, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { getBowarTransactions, topupBowar, getUserProfile, getWarnets } from '../services/api';

interface BowarTransaction {
  id: number;
  type: 'topup' | 'refund' | 'payment';
  amount: number;
  description?: string;
  createdAt?: string;
  status?: string;
  warnetId?: number;
  warnetName?: string;
}

export function DompetBowarScreen() {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [proofImage, setProofImage] = useState<string>('');
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [senderName, setSenderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWarnetId, setSelectedWarnetId] = useState<string>('');
  const [warnets, setWarnets] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transactions, setTransactions] = useState<BowarTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Load transactions and refresh balance from API
  useEffect(() => {
    const userId = context?.user?.id;

    // Skip if no user or already loading
    if (!userId || isLoadingRef.current) {
      return;
    }

    // Skip if already loaded for this user (prevent infinite loop)
    if (hasLoadedRef.current && lastUserIdRef.current === userId) {
      return;
    }

    const loadTransactionsAndBalance = async () => {
      try {
        isLoadingRef.current = true;
        setLoading(true);
        lastUserIdRef.current = userId;

        const response = await getBowarTransactions(1, 20);
        // Backend returns { message, data: { transactions: [], ... } }
        if (response.data && Array.isArray(response.data)) {
          setTransactions(response.data);
        } else if (response.data && response.data.transactions && Array.isArray(response.data.transactions)) {
          setTransactions(response.data.transactions);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setTransactions(response.data.data);
        }

        // Also refresh balance (only update if different to prevent re-render loop)
        if (context?.user && context.setUser) {
          try {
            const profileResponse = await getUserProfile();
            if (profileResponse.data) {
              const profileData = profileResponse.data;

              // Map cafeWallets
              const mappedCafeWallets = profileData.cafeWallets
                ? profileData.cafeWallets.map((wallet: any) => ({
                  cafeId: String(wallet.cafeId || wallet.warnet_id || wallet.warnetId || ''),
                  cafeName: wallet.cafeName || wallet.warnet_name || wallet.warnetName || '',
                  balance: wallet.balance || 0,
                  remainingMinutes: wallet.remainingMinutes || wallet.remaining_minutes || 0,
                  isActive: wallet.isActive || wallet.is_active || false,
                  lastUpdated: wallet.lastUpdated || wallet.last_updated || Date.now(),
                }))
                : undefined;

              const newBalance = profileData.bowarWallet || profileData.bowar_wallet || 0;

              // Only update if balance actually changed (prevent infinite loop)
              if (context.user.bowarWallet !== newBalance || context.user.cafeWallets?.length !== mappedCafeWallets?.length) {
                const refreshedUser = {
                  id: String(profileData.id),
                  username: profileData.username,
                  email: profileData.email,
                  role: profileData.role,
                  avatar: profileData.avatar,
                  bowarWallet: newBalance,
                  cafeWallets: mappedCafeWallets,
                  warnet: profileData.warnet,
                };
                context.setUser(refreshedUser);
                localStorage.setItem('auth_user', JSON.stringify(refreshedUser));
              }
            }
          } catch (profileError) {
            console.error('Failed to refresh balance:', profileError);
          }
        }

        hasLoadedRef.current = true;
      } catch (error: unknown) {
        console.error('Load transactions error:', error);
        // Keep empty array on error
        setTransactions([]);
        hasLoadedRef.current = false;
        lastUserIdRef.current = null;
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadTransactionsAndBalance();

    // Load available warnets for top-up
    const loadWarnets = async () => {
      try {
        const data = await getWarnets();
        if (data) {
          setWarnets(data);
          // If user has a default warnet, select it
          if (context?.user?.warnet?.id) {
            setSelectedWarnetId((context.user.warnet.id as any).toString());
          }
        }
      } catch (error) {
        console.error('Failed to load warnets:', error);
      }
    };
    loadWarnets();

    // Refresh when page becomes visible (user returns to tab/app) - only if already loaded
    const handleVisibilityChange = () => {
      if (!document.hidden && userId && !isLoadingRef.current && hasLoadedRef.current) {
        // Reset flag to allow refresh
        hasLoadedRef.current = false;
        loadTransactionsAndBalance();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [context?.user?.id]); // Only depend on user ID, not the whole user object

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

    // Store file object
    setProofImageFile(file);

    // Read and preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);

    if (isNaN(amount) || amount < 10000) {
      toast.error('Minimal top up Rp 10.000');
      return;
    }

    if (amount > 10000000) {
      toast.error('Maksimal top up Rp 10.000.000');
      return;
    }

    if (!proofImage) {
      toast.error('Bukti transfer wajib diupload');
      return;
    }

    if (!senderName.trim()) {
      toast.error('Nama pengirim wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('description', `Top Up DompetBowar sebesar Rp ${amount.toLocaleString()}`);
      formData.append('senderName', senderName.trim());
      formData.append('warnetId', selectedWarnetId);
      if (proofImageFile) {
        formData.append('proofImage', proofImageFile);
      }

      const response = await topupBowar(formData);

      toast.success(response.message || 'Permintaan top up berhasil dibuat. Menunggu konfirmasi.');

      // Reset form
      setShowTopUp(false);
      setTopUpAmount('');
      setProofImage('');
      setProofImageFile(null);
      setSenderName('');

      // Reset flags to allow refresh
      hasLoadedRef.current = false;
      lastUserIdRef.current = null;

      // Reload transactions and balance
      try {
        isLoadingRef.current = true;
        setLoading(true);
        const transactionsResponse = await getBowarTransactions(1, 20);
        if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
          setTransactions(transactionsResponse.data);
        } else if (transactionsResponse.data && transactionsResponse.data.data && Array.isArray(transactionsResponse.data.data)) {
          setTransactions(transactionsResponse.data.data);
        }

        // Reload user profile to get updated balance
        if (context?.user && context.setUser) {
          try {
            const profileResponse = await getUserProfile();
            if (profileResponse.data) {
              const profileData = profileResponse.data;

              // Map cafeWallets
              const mappedCafeWallets = profileData.cafeWallets
                ? profileData.cafeWallets.map((wallet: any) => ({
                  cafeId: String(wallet.cafeId || wallet.warnet_id || wallet.warnetId || ''),
                  cafeName: wallet.cafeName || wallet.warnet_name || wallet.warnetName || '',
                  balance: wallet.balance || 0,
                  remainingMinutes: wallet.remainingMinutes || wallet.remaining_minutes || 0,
                  isActive: wallet.isActive || wallet.is_active || false,
                  lastUpdated: wallet.lastUpdated || wallet.last_updated || Date.now(),
                }))
                : undefined;

              const updatedUser = {
                id: String(profileData.id),
                username: profileData.username,
                email: profileData.email,
                role: profileData.role,
                avatar: profileData.avatar,
                bowarWallet: profileData.bowarWallet || profileData.bowar_wallet || 0,
                cafeWallets: mappedCafeWallets,
                warnet: profileData.warnet,
              };
              context.setUser(updatedUser);
              localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            }
          } catch (profileError) {
            console.error('Failed to reload profile:', profileError);
          }
        }

        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to reload transactions:', error);
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    } catch (error: unknown) {
      console.error('Topup error:', error);
      const errorMessage =
        (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
          ? String(error.response.data.message)
          : 'Gagal membuat permintaan top up';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-100 text-2xl">DompetBowar</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola saldo dan transaksi Anda</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Group balance cards by Warnet */}
        <div className="space-y-4">
          <label className="text-slate-400 text-sm px-2">Daftar Saldo Per Warnet</label>
          {(context?.user?.cafeWallets && context.user.cafeWallets.length > 0) ? (
            context.user.cafeWallets.map((wallet) => (
              <div key={wallet.cafeId} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-1.5">
                        <Wallet className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-medium">{wallet.cafeName}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-2xl text-slate-100 tabular-nums">
                        Rp {(wallet.balance || 0).toLocaleString()}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWarnetId(wallet.cafeId);
                      setShowTopUp(true);
                    }}
                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 p-3 rounded-2xl border border-cyan-500/20 transition-all"
                    title="Top Up di warnet ini"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-8 text-center">
              <p className="text-slate-500">Belum ada saldo warnet. Silakan lakukan top up pertama Anda.</p>
              <button
                onClick={() => setShowTopUp(true)}
                className="mt-4 text-cyan-400 text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Top Up Sekarang</span>
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-2 flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-300 mb-1">Tentang DompetBowar</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                DompetBowar adalah wallet khusus untuk transaksi di aplikasi Bowar. Saldo akan otomatis dikembalikan jika PC yang Anda booking tidak tersedia.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/50">
            <h3 className="text-slate-200">Riwayat Transaksi</h3>
          </div>

          <div className="divide-y divide-slate-800/50">
            {loading ? (
              <div className="px-6 py-8 text-center">
                <p className="text-slate-400 text-sm">Memuat riwayat transaksi...</p>
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-xl ${tx.type === 'topup'
                          ? 'bg-green-500/20 border border-green-500/30'
                          : tx.type === 'refund'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-red-500/20 border border-red-500/30'
                          }`}
                      >
                        {tx.type === 'topup' ? (
                          <ArrowDownRight className="w-5 h-5 text-green-400" />
                        ) : tx.type === 'refund' ? (
                          <ArrowDownRight className="w-5 h-5 text-blue-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-slate-200 text-sm">{tx.description || 'Transaksi'}</p>
                          {tx.warnetName && (
                            <span className="text-cyan-400/60 text-[10px] px-1.5 py-0.5 bg-cyan-500/5 border border-cyan-500/10 rounded">
                              @{tx.warnetName}
                            </span>
                          )}
                          {tx.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs">
                              Pending
                            </span>
                          )}
                          {tx.status === 'completed' && (
                            <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs">
                              Selesai
                            </span>
                          )}
                          {tx.status === 'failed' && (
                            <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs">
                              Ditolak
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '-'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${tx.type === 'payment' ? 'text-red-400' : 'text-green-400'
                        }`}
                    >
                      {tx.type === 'payment' ? '-' : '+'}Rp {Math.abs(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4">
              <h3 className="text-slate-200 text-lg">Top Up DompetBowar</h3>
              <p className="text-slate-400 text-sm mt-1">Pilih atau masukkan nominal</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Warnet Selection */}
              <div>
                <label className="text-slate-300 text-sm mb-2 block">Pilih Warnet Tujuan <span className="text-red-400">*</span></label>
                <select
                  value={selectedWarnetId}
                  onChange={(e) => setSelectedWarnetId(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Pilih Warnet --</option>
                  {warnets.map((warnet) => (
                    <option key={warnet.id} value={warnet.id}>
                      {warnet.name}
                    </option>
                  ))}
                </select>
                <p className="text-slate-500 text-xs mt-2">Saldo hanya dapat digunakan di warnet yang dipilih.</p>

                {selectedWarnetId && (
                  <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                    <p className="text-blue-400 text-xs mb-2 flex items-center gap-1.5 font-medium">
                      <CreditCard className="w-3.5 h-3.5" />
                      INFORMASI REKENING BCA:
                    </p>
                    {(() => {
                      const selectedWarnet = warnets.find(w => String(w.id) === String(selectedWarnetId));
                      return selectedWarnet?.bankAccountNumber ? (
                        <>
                          <p className="text-slate-100 font-mono font-medium text-lg leading-none mb-1">
                            {selectedWarnet.bankAccountNumber}
                          </p>
                          <p className="text-slate-400 text-sm">a/n {selectedWarnet.bankAccountName || selectedWarnet.name}</p>
                        </>
                      ) : (
                        <p className="text-slate-400 text-sm italic">Informasi rekening belum tersedia</p>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Quick Amounts */}
              <div>
                <label className="text-slate-300 text-sm mb-3 block">Nominal Cepat</label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount.toString())}
                      className={`py-3 rounded-2xl border transition-all ${topUpAmount === amount.toString()
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/30'
                        }`}
                    >
                      <span className="text-sm">Rp {(amount / 1000).toFixed(0)}k</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Nominal Custom <span className="text-slate-500">(Min. Rp 10.000)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sender Name */}
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Nama Pengirim <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Masukkan nama pengirim"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Proof Image Upload */}
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Bukti Transfer <span className="text-red-400">*</span>
                </label>
                {proofImage ? (
                  <div className="relative">
                    <img
                      src={proofImage}
                      alt="Bukti transfer"
                      className="w-full h-48 object-cover rounded-2xl border border-slate-700"
                    />
                    <button
                      onClick={() => {
                        setProofImage('');
                        setProofImageFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-300 text-sm mb-1">Klik untuk upload bukti transfer</p>
                    <p className="text-slate-500 text-xs">JPG, PNG, GIF (Maks. 5MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <p className="text-amber-300 text-sm">
                  💡 Saldo DompetBowar dapat digunakan untuk pembayaran booking dan akan otomatis dikembalikan jika terjadi refund.
                </p>
                <p className="text-amber-200 text-xs mt-2">
                  ⚠️ Permintaan top up akan ditinjau oleh admin. Saldo akan ditambahkan setelah konfirmasi.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTopUp(false);
                    setTopUpAmount('');
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-2xl hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={!topUpAmount || parseInt(topUpAmount) < 10000 || !proofImage || !senderName.trim() || !selectedWarnetId || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    'Top Up'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}