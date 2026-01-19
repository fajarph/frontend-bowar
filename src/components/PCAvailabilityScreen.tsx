import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext, type PCStatus } from '../App';
import { ArrowLeft, Monitor, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getWarnetDetail } from '../services/api';

export function PCAvailabilityScreen() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [selectedPC, setSelectedPC] = useState<number | null>(null);
  const [pcs, setPcs] = useState<PCStatus[]>([]);

  const cafe = context?.cafes.find((c) => c.id === cafeId);

  // Get PCs from context in useEffect and fetch latest from API
  useEffect(() => {
    const loadData = async () => {
      if (cafeId && context) {
        // Initial load from context
        const pcList = context.getPCsForCafe(cafeId);
        setPcs(pcList);

        // Fetch latest from API to ensure synchronization
        try {
          const response = await getWarnetDetail(Number(cafeId));
          if (response.data?.pcs && context.setPcStatuses) {
            const mappedPcs = response.data.pcs.map((pc: any) => ({
              id: String(pc.id),
              number: pc.number,
              status: pc.status,
              remainingMinutes: pc.remainingMinutes,
              sessionStartTime: pc.status === 'occupied' ? Date.now() : undefined,
            }));

            context.setPcStatuses((prev) => ({
              ...prev,
              [cafeId]: mappedPcs,
            }));
            setPcs(mappedPcs);
          }
        } catch (error) {
          console.error('Failed to sync PC statuses:', error);
        }
      }
    };

    loadData();
    // Poll every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [cafeId, context?.setPcStatuses]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    if (!selectedPC) {
      toast.error('Silakan pilih PC');
      return;
    }

    // Allow booking for both available and occupied PCs
    // For occupied PCs, the booking will be scheduled for the next available slot
    navigate(`/booking/${cafeId}/${selectedPC}`);
  };

  if (!cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Warnet tidak ditemukan</p>
      </div>
    );
  }

  const availableCount = pcs.filter((pc) => pc.status === 'available').length;
  const occupiedCount = pcs.filter((pc) => pc.status === 'occupied').length;

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
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
          <div className="flex-1">
            <h1 className="text-slate-200">Pilih PC</h1>
            <p className="text-slate-400 text-sm">{cafe.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-slate-300 text-sm">Tersedia</span>
            </div>
            <p className="text-green-400 text-2xl tabular-nums">{availableCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
              <span className="text-slate-300 text-sm">Terpakai</span>
            </div>
            <p className="text-red-400 text-2xl tabular-nums">{occupiedCount}</p>
          </div>
        </div>

        {/* PC Grid */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
          <h3 className="text-slate-200 mb-4">Pilih PC Anda</h3>
          <div className="grid grid-cols-5 gap-2">
            {pcs.map((pc) => {
              const isSelected = selectedPC === pc.number;
              const isAvailable = pc.status === 'available';

              return (
                <button
                  key={pc.number}
                  onClick={() => {
                    setSelectedPC(pc.number);
                    if (!isAvailable) {
                      toast.info(`PC ${pc.number} sedang dimainkan. Booking untuk jam berikutnya.`);
                    }
                  }}
                  className={`
                    aspect-square rounded-xl p-2 transition-all
                    ${isAvailable
                      ? isSelected
                        ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-teal-400 shadow-lg shadow-blue-500/30'
                        : 'bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/40 hover:border-green-400 hover:from-green-500/30 hover:to-green-500/20'
                      : isSelected
                        ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/30'
                        : 'bg-slate-900/50 border border-red-500/30 hover:border-amber-500/50 hover:bg-gradient-to-br hover:from-amber-500/10 hover:to-orange-500/10'
                    }
                  `}
                >
                  <div className="h-full flex flex-col items-center justify-center gap-1">
                    <Monitor
                      className={`w-4 h-4 ${isAvailable
                        ? isSelected
                          ? 'text-teal-400'
                          : 'text-green-400'
                        : isSelected
                          ? 'text-amber-400'
                          : 'text-red-400'
                        }`}
                    />
                    <span
                      className={`text-xs ${isAvailable
                        ? isSelected
                          ? 'text-teal-300'
                          : 'text-green-300'
                        : isSelected
                          ? 'text-amber-300'
                          : 'text-red-300'
                        }`}
                    >
                      {pc.number}
                    </span>
                    {!isAvailable && pc.remainingMinutes !== undefined && (
                      <div className="flex items-center gap-0.5">
                        <Clock className={`w-2.5 h-2.5 ${isSelected ? 'text-amber-400' : 'text-red-400'}`} />
                        <span className={`text-[10px] tabular-nums ${isSelected ? 'text-amber-400' : 'text-red-400'}`}>
                          {formatTime(pc.remainingMinutes)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend with Detailed Explanations */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5 space-y-4">
          <h3 className="text-slate-200 mb-1">Keterangan Status PC</h3>

          <div className="space-y-3">
            {/* Available */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/40 rounded-xl flex items-center justify-center">
                <Monitor className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                  <span className="text-slate-200 text-sm">PC Tersedia</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  PC dapat dibooking dan siap digunakan sekarang
                </p>
              </div>
            </div>

            {/* Selected Available */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-teal-400 rounded-xl flex items-center justify-center">
                <Monitor className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-teal-400 rounded-full" />
                  <span className="text-slate-200 text-sm">PC Tersedia - Dipilih</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  PC yang sedang Anda pilih dan siap dibooking
                </p>
              </div>
            </div>

            {/* Playing/Occupied */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-900/50 border border-red-500/30 rounded-xl flex items-center justify-center opacity-60">
                <Monitor className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                  <span className="text-slate-200 text-sm">PC Sedang Dimainkan</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  PC sedang digunakan. Klik untuk booking jam berikutnya
                </p>
              </div>
            </div>

            {/* Selected Occupied */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 rounded-xl flex items-center justify-center">
                <Monitor className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  <span className="text-slate-200 text-sm">PC Sedang Dimainkan - Dipilih</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Booking untuk jam berikutnya setelah pemain selesai
                </p>
              </div>
            </div>
          </div>

          {/* Additional Note */}
          <div className="pt-3 border-t border-slate-800/50">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-400 text-xs leading-relaxed">
                <span className="text-amber-300">💡 Fitur Baru:</span> Anda sekarang bisa booking PC yang sedang dimainkan! Booking Anda akan otomatis dimulai setelah pemain selesai, atau dipindahkan ke PC lain yang tersedia jika terjadi perpanjangan billing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
        <button
          onClick={handleContinue}
          disabled={!selectedPC}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
        >
          {selectedPC ? `Lanjut dengan PC ${selectedPC}` : 'Pilih PC untuk Lanjut'}
        </button>
      </div>
    </div>
  );
}