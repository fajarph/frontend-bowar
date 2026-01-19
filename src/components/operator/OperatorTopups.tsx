import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import {
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  User,
  Mail,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { toast } from 'sonner';
import { getBowarTransactions } from '../../services/api';

interface Topup {
  id: number;
  type: 'topup';
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  proofImage?: string;
  senderName?: string;
  userId?: number;
  username?: string;
  email?: string;
  userRole?: string;
}

export function OperatorTopups() {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const operator = context?.operator;

  const [allTopups, setAllTopups] = useState<Topup[]>([]); // Store all topups for filtering
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageModal, setImageModal] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Function to reload topups
  const reloadTopups = async () => {
    hasLoadedRef.current = false;
    isLoadingRef.current = false;

    // Wait a bit to ensure token is available
    await new Promise(resolve => setTimeout(resolve, 500));

    const token = localStorage.getItem('auth_token');
    if (!token || token.trim().length === 0) {
      console.error('❌ No token found in reloadTopups');
      console.log('Available localStorage keys:', Object.keys(localStorage));
      console.log('auth_operator:', localStorage.getItem('auth_operator'));
      toast.error('Session expired. Silakan login kembali.');
      context?.setOperator(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_operator');
      navigate('/operator/login');
      return;
    }

    // Clean token
    const cleanToken = token.startsWith('Bearer ')
      ? token.substring(7).trim()
      : token.trim();

    console.log('🔑 Token found in reloadTopups, length:', cleanToken.length);
    console.log('🔑 Token preview:', cleanToken.substring(0, 30) + '...');
    console.log('🔑 Full token (first 50 chars):', cleanToken.substring(0, 50));

    try {
      isLoadingRef.current = true;
      setLoading(true);

      // Reload all topups
      console.log('📡 Reloading topups with token...');
      console.log('📡 Token at request time:', cleanToken.substring(0, 50));
      console.log('📡 Making request to /bowar-transactions with explicit token...');
      const response = await getBowarTransactions(1, 100, undefined, 'topup');

      let topupsData: Topup[] = [];
      if (response.data && Array.isArray(response.data)) {
        topupsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        topupsData = response.data.data;
      } else if (response.data?.transactions && Array.isArray(response.data.transactions)) {
        topupsData = response.data.transactions;
      }

      console.log('🔄 Reloaded topups:', topupsData.length, topupsData);
      setAllTopups(topupsData); // Store all topups
      // Filter will be applied by filteredTopups useMemo
      hasLoadedRef.current = true;
    } catch (error: unknown) {
      console.error('Failed to reload topups:', error);
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 401) {
        toast.error('Sesi telah berakhir. Silakan login kembali.');
        context?.setOperator(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_operator');
        navigate('/operator/login');
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Load topups
  useEffect(() => {
    if (!operator?.id) {
      navigate('/operator/login');
      return;
    }

    // Check token first before loading
    const token = localStorage.getItem('auth_token');
    if (!token || token.trim().length === 0) {
      console.error('❌ No token found when loading topups');
      console.log('Available localStorage keys:', Object.keys(localStorage));
      console.log('Operator data:', operator);
      toast.error('Session expired. Silakan login kembali.');
      context?.setOperator(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_operator');
      navigate('/operator/login');
      return;
    }

    if (isLoadingRef.current || hasLoadedRef.current) {
      return;
    }

    const loadTopups = async () => {
      // Wait a bit to ensure token is fully saved and available
      await new Promise(resolve => setTimeout(resolve, 500));

      // Double-check token before making request
      const currentToken = localStorage.getItem('auth_token');
      if (!currentToken || currentToken.trim().length === 0) {
        console.error('❌ Token disappeared before request');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        console.log('auth_operator:', localStorage.getItem('auth_operator'));
        toast.error('Session expired. Silakan login kembali.');
        context?.setOperator(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_operator');
        navigate('/operator/login');
        return;
      }

      // Clean token
      const cleanToken = currentToken.startsWith('Bearer ')
        ? currentToken.substring(7).trim()
        : currentToken.trim();

      console.log('🔑 Token found, length:', cleanToken.length);
      console.log('🔑 Token preview:', cleanToken.substring(0, 30) + '...');
      console.log('🔑 Full token (first 50 chars):', cleanToken.substring(0, 50));
      console.log('🔑 Operator data:', localStorage.getItem('auth_operator'));

      try {
        isLoadingRef.current = true;
        setLoading(true);

        // For operator, get all topups (backend will return all topups for operators)
        // Load all topups so we can filter by status
        console.log('📡 Requesting topups with token...');
        console.log('📡 Token at request time:', cleanToken.substring(0, 50));
        console.log('📡 Making request to /bowar-transactions with explicit token...');
        const response = await getBowarTransactions(1, 100, undefined, 'topup');

        let topupsData: Topup[] = [];
        if (response.data && Array.isArray(response.data)) {
          topupsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          topupsData = response.data.data;
        } else if (response.data?.transactions && Array.isArray(response.data.transactions)) {
          topupsData = response.data.transactions;
        }

        console.log('📊 Loaded topups:', topupsData.length, topupsData);
        setAllTopups(topupsData); // Store all topups (filtering will be applied by filteredTopups useMemo)
        hasLoadedRef.current = true;
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401) {
          toast.error('Sesi telah berakhir. Silakan login kembali.');
          context?.setOperator(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_operator');
          navigate('/operator/login');
        } else {
          toast.error(axiosError.response?.data?.message || 'Gagal memuat data top up');
        }
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadTopups();

    // Listen for focus event to refresh when returning to page
    const handleFocus = () => {
      if (hasLoadedRef.current) {
        reloadTopups();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operator?.id, navigate, context]);

  // Filter and search topups
  const filteredTopups = useMemo(() => {
    let filtered = [...allTopups]; // Use allTopups instead of topups

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((t) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          t.username?.toLowerCase().includes(searchLower) ||
          t.email?.toLowerCase().includes(searchLower) ||
          t.senderName?.toLowerCase().includes(searchLower) ||
          t.amount.toString().includes(searchQuery) ||
          t.id.toString().includes(searchQuery)
        );
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allTopups, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allTopups.length,
      pending: allTopups.filter((t) => t.status === 'pending').length,
      completed: allTopups.filter((t) => t.status === 'completed').length,
      failed: allTopups.filter((t) => t.status === 'failed').length,
    };
  }, [allTopups]);

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  const cafe = context?.cafes.find((c) => c.id === operator.cafeId);

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="mb-4">
            <h1 className="text-slate-200 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-purple-400" />
              Manajemen Top Up
            </h1>
            <p className="text-slate-400 text-sm">{cafe?.name}</p>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari berdasarkan username, email, atau ID..."
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
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${filterStatus === 'pending'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${filterStatus === 'completed'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${filterStatus === 'failed'
                ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
            >
              Failed ({stats.failed})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Memuat data...</p>
          </div>
        ) : filteredTopups.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">
                {searchQuery || filterStatus !== 'all'
                  ? 'Tidak ada top up yang sesuai filter'
                  : 'Belum ada top up'}
              </p>
              <p className="text-slate-500 text-sm">
                {searchQuery || filterStatus !== 'all'
                  ? 'Coba sesuaikan filter Anda'
                  : 'Permintaan top up akan muncul di sini'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTopups.map((topup) => (
              <div
                key={topup.id}
                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Status & Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 rounded-xl p-2 ${topup.status === 'pending'
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : topup.status === 'completed'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-red-500/20 border border-red-500/30'
                      }`}>
                      {topup.status === 'pending' ? (
                        <Clock className="w-5 h-5 text-amber-400" />
                      ) : topup.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-slate-200 font-semibold">
                          Rp {topup.amount.toLocaleString('id-ID')}
                        </h3>
                        {topup.status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-xs">
                            Pending
                          </span>
                        )}
                        {topup.status === 'completed' && (
                          <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs">
                            Completed
                          </span>
                        )}
                        {topup.status === 'failed' && (
                          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs">
                            Failed
                          </span>
                        )}
                      </div>

                      {/* User Info */}
                      {(topup.username || topup.email) && (
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-1">
                          {topup.username && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="truncate">{topup.username}</span>
                            </div>
                          )}
                          {topup.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{topup.email}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {topup.proofImage && (
                            <div className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              <span>Bukti tersedia</span>
                            </div>
                          )}
                          <span>
                            {new Date(topup.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Thumbnail Preview */}
                        {topup.proofImage && (
                          <div className="relative group/img w-16 h-16 rounded-lg overflow-hidden border border-slate-700/50">
                            <img
                              src={topup.proofImage}
                              alt="Bukti thumbnail"
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                            />
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageModal(topup.proofImage || null);
                              }}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                            >
                              <Search className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action */}
                  {topup.status === 'pending' && (
                    <button
                      onClick={() => navigate(`/operator/topups/${topup.id}/confirm`)}
                      className="flex-shrink-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-xl p-2 transition-all"
                    >
                      <ArrowRight className="w-4 h-4 text-purple-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Components */}
      {imageModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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

      {/* Bottom Navigation */}
      <OperatorBottomNav />
    </div>
  );
}
