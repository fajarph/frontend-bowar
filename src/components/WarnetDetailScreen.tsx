import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, MapPin, Cpu, Monitor, MemoryStick, Zap } from 'lucide-react';

export function WarnetDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const context = useContext(AppContext);
  
  const warnet = context?.cafes.find((w) => w.id === id);

  if (!warnet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Warnet not found</p>
      </div>
    );
  }

  // Mock specs since Cafe interface doesn't have specs
  const specItems = [
    { icon: Cpu, label: 'CPU', value: 'Intel i7-12700K' },
    { icon: Zap, label: 'GPU', value: 'RTX 3060' },
    { icon: MemoryStick, label: 'RAM', value: '16GB DDR4' },
    { icon: Monitor, label: 'Monitor', value: '24" 144Hz' },
    { icon: Zap, label: 'Refresh Rate', value: '144Hz' }
  ];

  const isMemberCafe = context?.user?.role === 'member' && 
    context.user.cafeWallets?.some((w) => w.cafeId === warnet.id);
    
  const pricePerHour = isMemberCafe
    ? warnet.memberPricePerHour
    : warnet.regularPricePerHour;

  return (
    <div className="min-h-screen pb-16">
      {/* Header with back button */}
      <div className="relative">
        <button
          onClick={() => navigate('/home')}
          className="absolute top-6 left-6 z-20 bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 text-slate-300 p-3 rounded-2xl hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Banner Image */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src={warnet.image} 
            alt={warnet.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          
          {/* Warnet name on banner */}
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-slate-100 mb-2">{warnet.name}</h1>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4" />
              <p>{warnet.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Description Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-3">About</h3>
          <p className="text-slate-400 leading-relaxed">Premium gaming experience with high-end PC specifications and comfortable environment.</p>
        </div>

        {/* Price Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 mb-1">
                {isMemberCafe
                  ? 'Member Price' 
                  : 'Standard Price'}
              </p>
              <p className="text-teal-400 text-2xl">Rp {pricePerHour.toLocaleString()}</p>
              <p className="text-slate-400">per hour</p>
            </div>
            {isMemberCafe && (
              <div className="bg-teal-400/20 text-teal-400 px-4 py-2 rounded-xl">
                Member Discount
              </div>
            )}
          </div>
        </div>

        {/* PC Specs */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">PC Specifications</h3>
          <div className="grid grid-cols-2 gap-4">
            {specItems.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <div 
                  key={index}
                  className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-teal-400" />
                    <p className="text-slate-400 text-sm">{spec.label}</p>
                  </div>
                  <p className="text-slate-200">{spec.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Maps Link */}
        <button
          onClick={() => navigate(`/maps/${warnet.id}`)}
          className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-blue-500/50 rounded-3xl p-5 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
              <MapPin className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-left">
              <p className="text-slate-200 mb-0.5">View Location</p>
              <p className="text-slate-400 text-sm">Open Warnet on Maps</p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-teal-400 rotate-180 transition-colors" />
        </button>

        {/* Book Now Button */}
        <button
          onClick={() => navigate(`/warnet/${warnet.id}/pcs`)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white rounded-3xl py-5 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          BOOK NOW
        </button>
      </div>
    </div>
  );
}
