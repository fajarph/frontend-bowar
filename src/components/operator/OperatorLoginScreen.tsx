import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '../../services/api';

export function OperatorLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState('');
  const navigate = useNavigate();
  const context = useContext(AppContext);

  // Debug: Log cafes when they change
  useEffect(() => {
    if (context?.cafes) {
      console.log('🏢 Cafes loaded in OperatorLoginScreen:', context.cafes.length);
    }
  }, [context?.cafes]);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('Silakan isi semua field');
      return;
    }

    if (!selectedCafe) {
      toast.error('Silakan pilih warnet Anda');
      return;
    }

    try {
      // Login via backend API
      const response = await login({
        username,
        password,
      });

      const backendUser = response.user;

      // Check if user is operator
      if (backendUser.role !== 'operator') {
        toast.error('Akun ini bukan operator');
        return;
      }

      // Find cafe from context
      const cafe = context?.cafes.find((c) => c.id === selectedCafe);
      if (!cafe) {
        toast.error('Warnet tidak ditemukan');
        return;
      }

      // Verify operator is assigned to selected cafe
      // Check if operator's warnet_id matches selected cafe
      if (backendUser.warnet && String(backendUser.warnet.id) !== selectedCafe) {
        toast.error('Operator tidak terdaftar di warnet yang dipilih');
        return;
      }

      // Clear any existing user session before setting operator session
      // This ensures operator uses the correct token
      localStorage.removeItem('auth_user');
      context?.setUser(null);
      
      // Verify token was saved (login() function should have saved it)
      // Wait a bit for token to be saved by login() function
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const token = localStorage.getItem('auth_token');
      if (!token || token.trim().length === 0) {
        console.error('❌ Token not found after login');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        console.log('Login response:', response);
        toast.error('Gagal menyimpan token. Silakan coba lagi.');
        return;
      }
      
      console.log('✅ Token saved successfully after operator login');
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 30) + '...');
      console.log('Token full (first 50 chars):', token.substring(0, 50));

      // Set operator in context
      const operator = {
        id: String(backendUser.id),
        username: backendUser.username,
        name: backendUser.username, // Use username as name if name not available
        password: '', // Not stored for security
        role: 'operator' as const,
        cafeId: selectedCafe,
        cafeName: cafe.name,
      };

      context?.setOperator(operator);
      localStorage.setItem('auth_operator', JSON.stringify(operator));
      
      // Verify token is still there after setting operator
      const tokenAfterOperatorSet = localStorage.getItem('auth_token');
      if (!tokenAfterOperatorSet || tokenAfterOperatorSet !== token) {
        console.error('❌ Token was lost after setting operator!');
        console.log('Original token:', token.substring(0, 30));
        console.log('Token after set:', tokenAfterOperatorSet?.substring(0, 30));
      } else {
        console.log('✅ Token verified after setting operator');
      }
      
      toast.success(`Selamat datang, ${backendUser.username}! Mengelola ${cafe.name}`);
      navigate('/operator/dashboard');
    } catch (error: unknown) {
      console.error('Operator login error:', error);
      const errorMessage = 
        (error && typeof error === 'object' && 'response' in error && 
         error.response && typeof error.response === 'object' && 'data' in error.response &&
         error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
          ? String(error.response.data.message)
          : 'Kredensial tidak valid';
      toast.error(errorMessage);
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />

            {/* Logo */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-xl">
              <Shield className="w-16 h-16 text-purple-400" />
            </div>
          </div>

          {/* App Name & Tagline */}
          <h1 className="text-slate-100 text-4xl mb-2 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
            Bowar Operator
          </h1>
          <p className="text-purple-400 text-sm tracking-wider mb-1">
            Sistem Manajemen Warnet
          </p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Masuk untuk mengelola warnet Anda
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl shadow-purple-500/5 relative z-10">
          <div className="space-y-5 relative z-10">
            {/* Operator Badge */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300">Akses Operator</span>
              </div>
              <p className="text-slate-400 text-xs">
                Hanya untuk staf cafe yang berwenang
              </p>
            </div>

            {/* Cafe Selection */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Warnet
              </label>
              <select
                value={selectedCafe}
                onChange={(e) => setSelectedCafe(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.focus();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.currentTarget.focus();
                }}
                disabled={!context?.cafes || context.cafes.length === 0}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <option value="">
                  {!context?.cafes || context.cafes.length === 0 
                    ? 'Memuat daftar warnet...' 
                    : 'Pilih warnet Anda'}
                </option>
                {context?.cafes && context.cafes.length > 0 && context.cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
              {!context?.cafes || context.cafes.length === 0 ? (
                <p className="text-slate-500 text-xs mt-1">Memuat daftar warnet...</p>
              ) : null}
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Username Operator
              </label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              MASUK SEBAGAI OPERATOR
            </button>

            {/* Back to Customer Login */}
            <div className="text-center pt-4 border-t border-slate-800/50">
              <p className="text-slate-400 text-sm mb-3">
                Bukan operator?
              </p>
              <button
                onClick={() => navigate('/login')}
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Ke Login Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}