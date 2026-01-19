import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import {
  ArrowLeft,
  MapPin,
  Navigation2,
  Map as MapIcon,
} from "lucide-react";

interface CafeMarker {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  regularPrice: number;
  memberPrice: number;
}

export function MapScreen() {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [selectedCafe, setSelectedCafe] = useState<
    string | null
  >(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Jakarta area coordinates for cafes
  const cafeMarkers: CafeMarker[] = [
    {
      id: "cafe1",
      name: "CyberArena Gaming",
      location: "Jl. Sudirman No. 45, Jakarta Pusat",
      lat: -6.2088,
      lng: 106.8456,
      regularPrice: 8000,
      memberPrice: 6000,
    },
    {
      id: "cafe2",
      name: "GameZone Elite",
      location: "Jl. Gatot Subroto No. 12, Jakarta Selatan",
      lat: -6.2297,
      lng: 106.8177,
      regularPrice: 10000,
      memberPrice: 7500,
    },
    {
      id: "cafe3",
      name: "Netplay Station",
      location: "Jl. Thamrin No. 88, Jakarta Pusat",
      lat: -6.1944,
      lng: 106.8229,
      regularPrice: 7000,
      memberPrice: 5500,
    },
    {
      id: "cafe4",
      name: "Warnet Premium",
      location: "Jl. MH Thamrin No. 22, Jakarta Pusat",
      lat: -6.1862,
      lng: 106.8233,
      regularPrice: 9000,
      memberPrice: 7000,
    },
    {
      id: "cafe5",
      name: "Esports Hub",
      location: "Jl. Rasuna Said No. 5, Jakarta Selatan",
      lat: -6.2241,
      lng: 106.8323,
      regularPrice: 12000,
      memberPrice: 9000,
    },
  ];


  // Simulate getting user location
  useEffect(() => {
    setUserLocation({ lat: -6.2088, lng: 106.8456 });
  }, []);

  const handleCafeClick = (cafeId: string) => {
    setSelectedCafe(cafeId === selectedCafe ? null : cafeId);
  };

  const handleNavigateToCafe = (cafeId: string) => {
    navigate(`/cafe/${cafeId}`);
  };

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-slate-200">Peta Warnet</h1>
            <p className="text-slate-400 text-sm">
              Temukan warnet terdekat
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6 pb-16">
        {/* Map Container */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden">
          {/* Map View - Simplified visual representation */}
          <div className="relative h-96 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4">
            {/* Grid background for map effect */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Map markers */}
            <div className="relative w-full h-full">
              {cafeMarkers.map((cafe) => {
                // Position markers based on relative coordinates
                const x = ((cafe.lng - 106.8) / 0.06) * 100;
                const y = ((cafe.lat + 6.18) / 0.06) * 100;

                return (
                  <div
                    key={cafe.id}
                    className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    onClick={() => handleCafeClick(cafe.id)}
                  >
                    {/* Marker pin */}
                    <div className="relative">
                      <div
                        className={`
                          bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full p-2 border-2 border-white shadow-lg
                          transition-all duration-300 hover:scale-110
                          ${selectedCafe === cafe.id ? "scale-125 animate-pulse" : ""}
                        `}
                      >
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      {/* Ping animation */}
                      <div className="absolute inset-0 bg-cyan-400/30 rounded-full animate-ping" />
                    </div>
                  </div>
                );
              })}

              {/* User location marker */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                >
                  <div className="relative">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-2 border-2 border-white shadow-lg">
                      <Navigation2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-green-400/30 rounded-full animate-ping" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cafe List */}
        <div className="space-y-4">
          <h2 className="text-slate-200">Semua Lokasi</h2>
          {cafeMarkers.map((cafe) => {
            const distance = userLocation
              ? calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  cafe.lat,
                  cafe.lng,
                )
              : null;
            const isSelected = selectedCafe === cafe.id;

            return (
              <div
                key={cafe.id}
                onClick={() => handleCafeClick(cafe.id)}
                className={`
                  bg-slate-900/50 backdrop-blur-xl border rounded-3xl p-5 cursor-pointer
                  transition-all duration-300
                  ${
                    isSelected
                      ? "border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                      : "border-slate-800/50 hover:border-slate-700/50"
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 p-3 rounded-2xl">
                    <MapIcon className="w-6 h-6 text-cyan-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 mb-1">
                      {cafe.name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-2">
                      {cafe.location}
                    </p>

                    {/* Distance and pricing */}
                    <div className="flex items-center gap-3 text-sm">
                      {distance && (
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Navigation2 className="w-3.5 h-3.5" />
                          <span>{distance} km</span>
                        </div>
                      )}
                      <div className="text-slate-400">
                        {context?.user?.role === "member" &&
                        context.user.cafeWallets?.some((w) => w.cafeId === cafe.id) ? (
                          <span>
                            Rp{" "}
                            {cafe.memberPrice.toLocaleString()}
                            /jam
                          </span>
                        ) : (
                          <span>
                            Rp{" "}
                            {cafe.regularPrice.toLocaleString()}
                            /jam
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View details button - shown when selected */}
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToCafe(cafe.id);
                        }}
                        className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                      >
                        Lihat Detail
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full" />
              <span className="text-slate-300">
                Lokasi Warnet
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full" />
              <span className="text-slate-300">
                Lokasi Anda
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}