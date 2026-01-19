import { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import { ArrowLeft, AlertCircle, ShieldAlert } from "lucide-react";

export function RulesScreen() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);

  const cafe = context?.cafes.find((c) => c.id === cafeId);

  if (!cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Warnet tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-slate-100 text-2xl">Peraturan Warnet</h1>
              <p className="text-slate-400 text-sm mt-1">{cafe.name}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-2 flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-300 text-sm mb-1">Penting untuk Dibaca</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Harap patuhi peraturan berikut untuk kenyamanan bersama dan pengalaman gaming yang optimal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Content */}
      <div className="relative z-10 px-6 py-6">
        {cafe.rules && cafe.rules.length > 0 ? (
          <div className="space-y-4">
            {cafe.rules.map((rule, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-900/80 to-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5 hover:border-amber-500/30 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-amber-400">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 leading-relaxed">
                      {rule}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada peraturan khusus untuk warnet ini</p>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 bg-slate-900/30 backdrop-blur-xl border border-slate-800/30 rounded-2xl p-4">
          <p className="text-slate-400 text-sm text-center leading-relaxed">
            Pelanggaran terhadap peraturan dapat mengakibatkan peringatan atau penutupan sesi gaming Anda. Terima kasih atas kerjasamanya! 🎮
          </p>
        </div>
      </div>
    </div>
  );
}
