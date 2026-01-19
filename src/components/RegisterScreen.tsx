import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { AppContext, type User, type CafeWallet } from '../App';
import { ArrowLeft, User as UserIcon, Crown, Check, MapPin, Clock, Award, ShieldCheck, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { registerUser, registerMember, getWarnets } from '../services/api';

interface Warnet {
  id: number;
  name: string;
  address: string;
  description: string | null;
}

export function RegisterScreen() {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<'regular' | 'member' | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCafe, setSelectedCafe] = useState('');
  const [warnets, setWarnets] = useState<Warnet[]>([]);
  const [loadingWarnets, setLoadingWarnets] = useState(false);
  const navigate = useNavigate();
  // const context = useContext(AppContext);

  // Fetch warnets from backend
  useEffect(() => {
    const fetchWarnets = async () => {
      if (selectedRole === 'member') {
        setLoadingWarnets(true);
        try {
          const warnetsData = await getWarnets();
          if (Array.isArray(warnetsData)) {
            setWarnets(warnetsData);
          } else {
            setWarnets([]);
          }
        } catch (error) {
          console.error('Error fetching warnets:', error);
          toast.error('Gagal memuat daftar warnet');
        } finally {
          setLoadingWarnets(false);
        }
      }
    };

    fetchWarnets();
  }, [selectedRole]);

  const handleRoleSelect = (role: 'regular' | 'member') => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      toast.error('Mohon isi semua kolom');
      return;
    }

    if (selectedRole === 'member' && !selectedCafe) {
      toast.error('Mohon pilih warnet untuk bergabung');
      return;
    }

    try {
      let response;

      if (selectedRole === 'member') {
        // Convert warnet ID to number (from backend, ID is already number)
        const warnetId = parseInt(selectedCafe);
        if (isNaN(warnetId) || !selectedCafe) {
          toast.error('ID warnet tidak valid. Silakan pilih warnet yang valid.');
      return;
    }

        // Call backend API for member registration
        response = await registerMember({
          username,
          email,
          password,
          warnet_id: warnetId,
        });
      } else {
        // Call backend API for regular user registration
        response = await registerUser({
      username,
      email,
          password,
        });
      }

      // Success response from backend
      if (response.message) {
    if (selectedRole === 'member') {
      toast.success('🎉 Registrasi berhasil!');
      toast.success('⭐ Membership diaktifkan!');
      toast.info('Silakan login dengan kredensial Anda');
    } else {
      toast.success('🎉 Registrasi berhasil!');
      toast.info('Silakan login dengan kredensial Anda');
    }

    // Redirect to login page after successful registration
    setTimeout(() => {
      navigate('/login');
    }, 1500);
      }
    } catch (error: unknown) {
      // Handle API errors
      const axiosError = error as { response?: { data?: any; status?: number } };
      
      console.error('Registration error:', axiosError.response?.data || error);
      
      if (axiosError.response?.status === 422) {
        // Validation errors from VineJS/AdonisJS
        const errorData = axiosError.response.data;
        
        // Try different error formats
        let errorMessage = 'Data yang dikirim tidak valid. Pastikan semua field diisi dengan benar.';
        
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          // Format: { errors: [{ field: "...", message: "..." }] }
          const messages = errorData.errors.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.message) return `${err.field || ''}: ${err.message}`;
            return JSON.stringify(err);
          });
          errorMessage = `Validasi gagal: ${messages.join(', ')}`;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        toast.error(errorMessage);
      } else {
        const errorMessage = axiosError.response?.data?.message || (error as { message?: string })?.message || 'Terjadi kesalahan saat mendaftar';
        toast.error(errorMessage);
      }
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-md mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/login')}
              className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-slate-100">Pilih Tipe Akun</h1>
              <p className="text-slate-400 text-sm">Pilih jenis registrasi Anda</p>
            </div>
          </div>

          {/* Role Cards */}
          <div className="space-y-4">
            {/* Regular User Card */}
            <button
              onClick={() => handleRoleSelect('regular')}
              className="w-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-blue-500/50 rounded-3xl p-6 text-left transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 group-hover:border-blue-500/50 rounded-2xl p-4 transition-colors">
                  <UserIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-200 mb-2">Pengguna Regular</h3>
                  <p className="text-slate-400 text-sm mb-3">
                    Akses booking standard ke semua warnet
                  </p>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Bayar sesuai pemakaian</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Member Card */}
            <button
              onClick={() => handleRoleSelect('member')}
              className="w-full bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-500/30 hover:border-blue-500/60 rounded-3xl p-6 text-left transition-all hover:shadow-xl hover:shadow-blue-500/20 group relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-2xl p-4">
                    <Crown className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-blue-300">Member Warnet</h3>
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                        Premium
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">
                      Benefit eksklusif dan akses prioritas
                    </p>
                  </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                      <Award className="w-4 h-4" />
                      <span>Harga Lebih Murah</span>
                    </div>
                    <p className="text-slate-400 text-xs">Hemat harga per jam</p>
                  </div>
                  <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Prioritas</span>
                    </div>
                    <p className="text-slate-400 text-xs">Booking lebih awal</p>
                  </div>
                  <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Waktu Tersimpan</span>
                    </div>
                    <p className="text-slate-400 text-xs">Simpan untuk nanti</p>
                  </div>
                  <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Terjamin</span>
                    </div>
                    <p className="text-slate-400 text-xs">Kursi terjamin</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setStep('role')}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-100">Buat Akun</h1>
            <p className="text-slate-400 text-sm">
              {selectedRole === 'member' ? 'Registrasi Member' : 'Registrasi Pengguna Regular'}
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
          <div className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">Username</label>
              <input
                type="text"
                placeholder="Pilih username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">Email</label>
              <input
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">Password</label>
              <input
                type="password"
                placeholder="Buat password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Warnet Selection (Member Only) */}
            {selectedRole === 'member' && (
              <div className="relative z-10">
                <label className="block text-slate-300 text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  Pilih Warnet Anda
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
                  disabled={loadingWarnets}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <option value="">
                    {loadingWarnets ? 'Memuat warnet...' : 'Pilih warnet'}
                  </option>
                  {warnets.map((warnet) => (
                    <option key={warnet.id} value={warnet.id.toString()}>
                      {warnet.name}
                    </option>
                  ))}
                </select>
                <p className="text-slate-400 text-xs mt-2">
                  💡 Anda bisa daftar member di beberapa warnet dengan email yang sama menggunakan username berbeda
                </p>
              </div>
            )}

            {/* Member Rules Info */}
            {selectedRole === 'member' && selectedCafe && (
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4">
                <h4 className="text-blue-300 text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Aturan Membership
                </h4>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>Minimum 2 jam untuk booking pertama member</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>PC akan ditugaskan otomatis dari slot tersedia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>Sesi pertama terkunci minimum 2 jam</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>Perpanjang sesi dengan pembayaran tambahan</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Register Button */}
            <button
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] mt-6"
            >
              Buat Akun
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-slate-800/50">
              <p className="text-slate-400 text-sm mb-2">Sudah punya akun?</p>
              <button
                onClick={() => navigate('/login')}
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}