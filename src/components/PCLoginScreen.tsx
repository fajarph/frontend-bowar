import { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Monitor, User, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export function PCLoginScreen() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const cafe = context?.cafes.find((c) => c.id === cafeId);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Verify credentials
    if (username !== context?.user?.username) {
      toast.error('Invalid username or password');
      return;
    }

    // Start the session - activate wallet countdown for members
    if (context?.user?.role === 'member' && cafeId) {
      const wallet = context.user.cafeWallets?.find((w) => w.cafeId === cafeId);
      
      if (wallet) {
        // Activate wallet countdown
        context.updateWallet(cafeId, wallet.remainingMinutes, true);
        toast.success(`Logged in successfully! Your play time is now running.`);
      } else {
        toast.error('You are not a member of this café');
        return;
      }
    } else {
      toast.success('Logged in successfully!');
    }

    // Navigate to home
    navigate('/home');
  };

  if (!cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-slate-400">Café not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Cafe Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-3xl p-4 mb-4">
            <Monitor className="w-12 h-12 text-cyan-400" />
          </div>
          <h1 className="text-cyan-400 mb-2">{cafe.name}</h1>
          <p className="text-slate-400">PC Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-slate-200 mb-2">Welcome Back</h2>
            <p className="text-slate-400">Login to start your gaming session</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-slate-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Bowar username"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <LogIn className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-cyan-300 text-sm mb-1">Session Start Notice</p>
                  <p className="text-slate-400 text-xs">
                    Logging in will start your play time countdown. For members, your wallet
                    time will begin decreasing in realtime.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Login & Start Session
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Use your Bowar account credentials to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
