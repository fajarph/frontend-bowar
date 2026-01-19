import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import {
    Calendar,
    Users,
    Wallet,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';

export function OperatorManagementScreen() {
    const navigate = useNavigate();
    const context = useContext(AppContext);

    // Statistics for badges
    const pendingBookings = context?.bookings.filter(
        (b) => b.cafeId === context?.operator?.cafeId && b.paymentStatus === 'pending' && b.status !== 'cancelled'
    ).length || 0;

    const pendingTopups = 0;

    const menuItems = [
        {
            id: 'bookings',
            title: 'Manajemen Booking',
            description: 'Kelola reservasi dan konfirmasi pembayaran',
            icon: Calendar,
            path: '/operator/bookings',
            color: 'from-purple-500 to-purple-600',
            badge: pendingBookings > 0 ? `${pendingBookings} pending` : null,
        },
        {
            id: 'topups',
            title: 'Verifikasi Top Up',
            description: 'Konfirmasi bukti transfer saldo member',
            icon: Wallet,
            path: '/operator/topups',
            color: 'from-amber-500 to-amber-600',
            badge: pendingTopups > 0 ? `${pendingTopups} pending` : null,
        },
        {
            id: 'members',
            title: 'Data Member',
            description: 'Kelola akun dan cek saldo pelanggan',
            icon: Users,
            path: '/operator/members',
            color: 'from-teal-500 to-teal-600',
            badge: null,
        },
    ];

    return (
        <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
                <div className="px-6 py-5 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/operator/dashboard')}
                        className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-slate-200">Manajemen</h1>
                        <p className="text-slate-400 text-xs">Pusat kendali operasional</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 px-6 py-8 space-y-6">
                <div className="grid grid-cols-1 gap-5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 hover:border-slate-700/50 rounded-[32px] p-6 text-left transition-all hover:shadow-2xl hover:shadow-black/20 group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`bg-gradient-to-br ${item.color} rounded-2xl p-3.5 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h3 className="text-slate-200 font-semibold">{item.title}</h3>
                                            {item.badge && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-slate-400 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <OperatorBottomNav />
        </div>
    );
}
