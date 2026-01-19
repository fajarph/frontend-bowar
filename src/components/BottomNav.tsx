import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageCircle, User } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Beranda', path: '/home' },
    { icon: Calendar, label: 'Booking', path: '/booking-history' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profil', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5 min-w-[60px] group"
              >
                <div
                  className={`p-2.5 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50 shadow-lg shadow-blue-500/20'
                      : 'bg-transparent group-hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs transition-colors ${
                    isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}