import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, User, Mail, Phone, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile } from '../services/api';

export function EditProfileScreen() {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(context?.user?.username || '');
  const [email, setEmail] = useState(context?.user?.email || '');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(context?.user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(context?.user?.avatar || '');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file harus kurang dari 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Silakan upload file gambar');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!username || !email) {
      toast.error('Silakan isi semua field yang diperlukan');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Silakan masukkan alamat email yang valid');
      return;
    }

    try {
      // Check if user is logged in
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Silakan login terlebih dahulu');
        navigate('/login');
        return;
      }

      // Update profile via API
      const response = await updateProfile({
        username,
        email,
        avatar: avatar || undefined,
      });

      // Update user in context
      if (context?.user && response.data) {
        const updatedUser = {
          ...context.user,
          username: response.data.username || username,
          email: response.data.email || email,
          avatar: response.data.avatar || avatar,
        };
        context.setUser(updatedUser);
        // Update localStorage with latest data
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }

      toast.success('✅ Profil berhasil diperbarui!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
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
            <h1 className="text-slate-200">Edit Profil</h1>
            <p className="text-slate-400 text-sm">Perbarui informasi Anda</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Avatar Upload */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8">
          <h3 className="text-slate-200 mb-6 text-center">Foto Profil</h3>

          <div className="flex flex-col items-center">
            {/* Avatar Preview */}
            <div className="relative mb-6">
              {/* Glow ring */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full blur-xl opacity-40 animate-pulse" />

              {/* Avatar container */}
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-cyan-400" />
                )}
              </div>

              {/* Camera button overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 p-3 rounded-full border-2 border-slate-950 shadow-lg shadow-cyan-500/50 transition-all hover:scale-110"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Upload buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Gambar
              </button>
              {avatarPreview && (
                <button
                  onClick={() => {
                    setAvatar('');
                    setAvatarPreview('');
                  }}
                  className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-red-500/50 text-slate-300 hover:text-red-300 px-4 py-2.5 rounded-2xl transition-all"
                >
                  Hapus
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <p className="text-slate-500 text-xs text-center mt-4">
              Ukuran file maks: 5MB • Didukung: JPG, PNG, GIF
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-6">Informasi Akun</h3>

          <div className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Nomor Telepon <span className="text-slate-500">(opsional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon Anda"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Type Info (Read-only) */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-2">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Tipe Akun</p>
              <p className="text-cyan-300 capitalize">{context?.user?.role}</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs">
            Untuk mengubah tipe akun Anda, silakan hubungi support
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
        <button
          onClick={handleSaveChanges}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]"
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}