import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';

export function MapsScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const context = useContext(AppContext);
  
  const warnet = context?.cafes.find(w => w.id === id);

  if (!warnet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Warnet not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-slate-900/30 backdrop-blur-lg border-b border-slate-800/50">
        <div className="px-6 py-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-slate-200 mb-1">{warnet.name}</h1>
          <p className="text-slate-400">Location & Directions</p>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="relative h-96 bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-400">Map View</p>
            <p className="text-slate-500 text-sm mt-2">
              {warnet.location}
            </p>
          </div>
        </div>
        
        {/* Mock map marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full"></div>
            <div className="relative bg-cyan-500 p-3 rounded-full">
              <MapPin className="w-6 h-6 text-white" fill="white" />
            </div>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3">
              <MapPin className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-200 mb-2">Address</h3>
              <p className="text-slate-400">{warnet.location}</p>
            </div>
          </div>
        </div>

        <button
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
        >
          <Navigation className="w-5 h-5" />
          Get Directions
        </button>

        <button
          onClick={() => navigate(`/warnet/${warnet.id}`)}
          className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 rounded-2xl py-4 transition-all"
        >
          View Warnet Details
        </button>
      </div>
    </div>
  );
}
