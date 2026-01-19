import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import {
  Gamepad2,
  Eye,
  EyeOff,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { login, getUserProfile } from "../services/api";

export function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const context = useContext(AppContext);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Mohon isi semua kolom");
      return;
    }

    try {
      // ✅ SATU LOGIN API
      const response = await login({
        username,
        password,
      });

      // Verify token was saved after login (wait a bit for localStorage to sync)
      await new Promise(resolve => setTimeout(resolve, 150));
      const token = localStorage.getItem('auth_token');
      if (!token || token.trim().length === 0) {
        console.error('❌ Token not found after login');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        console.log('Login response:', response);
        toast.error('Gagal menyimpan token. Silakan coba lagi.');
        return;
      }

      console.log('✅ Token saved successfully after login');
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 30) + '...');

      const backendUser = response.user;

      // ✅ MAPPING ROLE BACKEND → FRONTEND (TYPE-SAFE)
      // Operator tidak bisa login di halaman customer login
      if (backendUser.role === 'operator') {
        toast.error('Operator harus login di halaman operator');
        navigate('/operator/login');
        return;
      }

      const role: "regular" | "member" =
        backendUser.role === "member" ? "member" : "regular";

      const frontendUser = {
        id: String(backendUser.id),
        username: backendUser.username,
        email: backendUser.email,
        password: "", // tidak disimpan
        role,
        avatar: backendUser.avatar || undefined,
        bowarWallet: backendUser.bowarWallet || 0,
      };

      context?.setUser(frontendUser);

      // Also save to localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(frontendUser));

      // Load full profile to get latest data including avatar and cafeWallets
      try {
        const profileResponse = await getUserProfile();
        if (profileResponse.data) {
          const profileData = profileResponse.data;

          // Map cafeWallets to ensure cafeId is string format
          const mappedCafeWallets = profileData.cafeWallets
            ? profileData.cafeWallets.map((wallet: any) => ({
              cafeId: String(wallet.cafeId || wallet.warnet_id || wallet.warnetId || ''),
              cafeName: wallet.cafeName || wallet.warnet_name || wallet.warnetName || '',
              balance: wallet.balance || 0, // Fix: include balance
              remainingMinutes: wallet.remainingMinutes || wallet.remaining_minutes || 0,
              isActive: wallet.isActive || wallet.is_active || false,
              lastUpdated: wallet.lastUpdated || wallet.last_updated || Date.now(),
            }))
            : undefined;

          // Debug logging - removed to prevent spam
          // Uncomment below if needed for debugging:
          // console.log('[LoginScreen] Profile Loaded After Login:', {
          //   userId: profileData.id,
          //   username: profileData.username,
          //   role: profileData.role,
          //   cafeWalletsCount: mappedCafeWallets?.length || 0,
          //   cafeWallets: mappedCafeWallets?.map((w: { cafeId: string; cafeName: string }) => ({ cafeId: w.cafeId, cafeName: w.cafeName }))
          // });

          const fullUser = {
            id: String(profileData.id),
            username: profileData.username,
            email: profileData.email,
            role: profileData.role,
            avatar: profileData.avatar,
            bowarWallet: profileData.bowarWallet || profileData.bowar_wallet || 0,
            cafeWallets: mappedCafeWallets,
            warnet: profileData.warnet, // Crucial: include warnet for badges
          };
          context?.setUser(fullUser);
          localStorage.setItem('auth_user', JSON.stringify(fullUser));
        }
      } catch (profileError) {
        console.error('Failed to load profile after login:', profileError);
        // Continue anyway with basic user data
      }

      toast.success("Login berhasil! Selamat datang di Bowar.");
      navigate("/home");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      const message = axiosError.response?.data?.message || "Username atau password salah";
      toast.error(message);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Container with Glow */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />

            {/* Logo */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/30 rounded-3xl p-6 backdrop-blur-xl">
              <Gamepad2 className="w-16 h-16 text-blue-400" />
            </div>
          </div>

          {/* App Name & Tagline */}
          <h1 className="text-slate-100 text-4xl mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
            Bowar
          </h1>
          <p className="text-teal-400 text-sm tracking-wider mb-1">
            Booking Warnet
          </p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Masuk untuk memulai sesi gaming warnet Anda
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
          <div className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleLogin()
                }
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleLogin()
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "Fitur reset password segera hadir!",
                  )
                }
                className="text-teal-400 text-sm hover:text-teal-300 transition-colors"
              >
                Lupa Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              MASUK
            </button>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-slate-800/50">
              <p className="text-slate-400 text-sm mb-3">
                Belum punya akun?
              </p>
              <button
                onClick={() => navigate("/register")}
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Buat Akun
              </button>
            </div>

            {/* Operator Login Link */}
            <div className="text-center pt-4 border-t border-slate-800/50 mt-4">
              <p className="text-slate-400 text-sm mb-3">
                Apakah Anda operator warnet?
              </p>
              <button
                onClick={() => navigate("/operator/login")}
                className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 mx-auto"
              >
                <Crown className="w-4 h-4" />
                <span>Login Operator</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}