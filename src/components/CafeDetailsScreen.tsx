import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import { getWarnetDetail } from "../services/api";
import {
  ArrowLeft,
  MapPin,
  Cpu,
  Monitor,
  MemoryStick,
  Zap,
  Crown,
  AlertCircle,
} from "lucide-react";

export function CafeDetailsScreen() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [warnetDetail, setWarnetDetail] = useState<{
    description?: string | null;
    phone?: string | null;
    email?: string | null;
    operatingHours?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const cafe = context?.cafes.find((c) => c.id === cafeId);

  // Load warnet detail from API
  useEffect(() => {
    const loadWarnetDetail = async () => {
      if (!cafeId) return;

      try {
        setLoading(true);
        const response = await getWarnetDetail(Number(cafeId));
        if (response.data) {
          setWarnetDetail({
            description: response.data.description,
            phone: response.data.phone,
            email: response.data.email,
            operatingHours: response.data.operatingHours,
          });

          // Sync PC statuses to global context
          if (response.data.pcs && context?.setPcStatuses) {
            context.setPcStatuses((prev) => ({
              ...prev,
              [cafeId]: response.data.pcs.map((pc: any) => ({
                id: String(pc.id),
                number: pc.number,
                status: pc.status,
                remainingMinutes: pc.remainingMinutes,
                // We don't have sessionStartTime from API yet, but we have remainingMinutes
                sessionStartTime: pc.status === 'occupied' ? Date.now() : undefined,
              })),
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load warnet detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWarnetDetail();
  }, [cafeId]);

  if (!cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Warnet tidak ditemukan</p>
      </div>
    );
  }

  const specs = [
    { icon: Cpu, label: "CPU", value: "Intel i7-12700K" },
    { icon: Monitor, label: "GPU", value: "RTX 4060 Ti" },
    { icon: MemoryStick, label: "RAM", value: "32GB DDR5" },
    { icon: Monitor, label: "Monitor", value: '27" IPS' },
    { icon: Zap, label: "Refresh Rate", value: "165Hz" },
  ];

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-200 text-xl">{cafe.name}</h1>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-slate-400 text-xs">{cafe.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section (No longer contains the main title/back button) */}
      <div className="relative z-10 h-64 overflow-hidden mb-6">
        <img
          src={cafe.image}
          alt={cafe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />

        {/* Member Badge - Still on Image */}
        {context?.user?.role === "member" &&
          String(context.user.warnet?.id || '') === String(cafeId || '') && (
            <div className="absolute bottom-6 right-6 bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-xl border border-cyan-400/50 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg shadow-cyan-500/30">
              <Crown className="w-4 h-4 text-white" />
              <span className="text-white text-sm">
                Member Anda
              </span>
            </div>
          )}
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Description Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-3">
            Tentang Warnet Ini
          </h3>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Memuat deskripsi...</p>
            </div>
          ) : warnetDetail?.description ? (
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
              {warnetDetail.description}
            </p>
          ) : (
            <p className="text-slate-500 text-sm italic">
              Deskripsi belum tersedia
            </p>
          )}
        </div>

        {/* PC Specifications */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">
            Spesifikasi PC
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {specs.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-1.5">
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-slate-400 text-xs">
                      {spec.label}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm">
                    {spec.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Harga</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">
                Harga Reguler
              </span>
              <span className="text-slate-200 text-xl">
                Rp {cafe.regularPricePerHour.toLocaleString()}
                /jam
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cyan-300">
                Harga Member
              </span>
              <span className="text-cyan-400 text-xl">
                Rp {cafe.memberPricePerHour.toLocaleString()}
                /jam
              </span>
            </div>
            {context?.user?.role !== "member" && (
              <div className="bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-3 mt-3">
                <p className="text-slate-300 text-sm">
                  💡 Jadi member untuk hemat{" "}
                  <span className="text-cyan-400">
                    Rp{" "}
                    {(
                      cafe.regularPricePerHour -
                      cafe.memberPricePerHour
                    ).toLocaleString()}
                    /jam
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Fasilitas</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span>WiFi Kecepatan Tinggi</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span>Ruangan AC</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span>Kursi Gaming</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span>Kantin</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span>Lampu RGB</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span>Buka 24/7</span>
            </div>
          </div>
        </div>

        {/* Rules Section */}
        {cafe.rules && cafe.rules.length > 0 && (
          <button
            onClick={() => navigate(`/cafe/${cafeId}/rules`)}
            className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Lihat Peraturan Warnet</span>
          </button>
        )}

        {/* Maps Button */}
        <button
          onClick={() =>
            window.open(
              `https://maps.google.com/?q=${encodeURIComponent(cafe.location)}`,
              "_blank",
            )
          }
          className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
        >
          <MapPin className="w-5 h-5" />
          <span>Buka Warnet di Maps</span>
        </button>
      </div>

      {/* Floating Book Now Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
        <button
          onClick={() => navigate(`/cafe/${cafeId}/pcs`)}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]"
        >
          BOOKING SEKARANG
        </button>
      </div>
    </div>
  );
}