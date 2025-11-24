
import React, { useEffect, useRef, useState } from 'react';
import { Match } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { LocationIcon, CloseIcon } from './Icons';
import { SPORT_EMOJIS } from '../constants';

// Declare Leaflet's 'L' to avoid TypeScript errors
declare var L: any;

interface MatchesMapProps {
  matches: Match[];
  onNavigateBack: () => void;
  onMatchClick?: (match: Match) => void;
}

const MatchesMap: React.FC<MatchesMapProps> = ({ matches, onNavigateBack, onMatchClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location for map", error);
          // Default location (Sao Paulo center) if permission denied
          setUserLocation({ lat: -23.5505, lng: -46.6333 });
          setIsLoading(false);
        }
      );
    } else {
      setUserLocation({ lat: -23.5505, lng: -46.6333 });
      setIsLoading(false);
    }
  }, []);

  // 2. Initialize Map
  useEffect(() => {
    if (isLoading || !userLocation || !mapRef.current || typeof L === 'undefined') return;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    try {
      const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // User Marker
      const userIcon = L.divIcon({
        className: 'bg-transparent',
        html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map).bindPopup("Você está aqui");

      // Match Markers
      matches.forEach(match => {
        if (match.lat && match.lng && match.status !== 'Cancelado') {
          const emoji = SPORT_EMOJIS[match.sport] || '⚽';
          
          const matchIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-md text-lg">${emoji}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          const marker = L.marker([match.lat, match.lng], { icon: matchIcon }).addTo(map);
          
          const popupContent = `
            <div class="text-gray-900 p-1 min-w-[150px]">
                <p class="text-xs font-bold text-green-600 uppercase">${match.sport}</p>
                <h3 class="font-bold text-sm mb-1">${match.name}</h3>
                <p class="text-xs text-gray-600 mb-1">📍 ${match.location}</p>
                <p class="text-xs text-gray-600">📅 ${new Date(match.date).toLocaleDateString('pt-BR')}</p>
            </div>
          `;
          
          marker.bindPopup(popupContent);
        }
      });

    } catch (e) {
      console.error("Error initializing map:", e);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isLoading, userLocation, matches]);


  return (
    <div className="bg-gray-900 min-h-full flex flex-col h-[calc(100vh-160px)]">
      {/* Header Navigation */}
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-t-xl shadow-md z-10">
        <div className="flex items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LocationIcon /> Mapa das Partidas
            </h2>
        </div>
        <button 
            onClick={onNavigateBack}
            className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
        >
            Voltar para Lista
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-grow relative bg-gray-800 rounded-b-xl overflow-hidden shadow-inner border border-gray-700">
        {isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
                <LoadingSpinner size={10} />
                <p className="mt-4 text-gray-400">Carregando mapa...</p>
             </div>
        )}
        <div ref={mapRef} className="w-full h-full z-0" />
        
        {/* Floating Info Badge */}
        {!isLoading && (
            <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700 z-10 shadow-lg pointer-events-none">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-green-400 text-xs font-bold uppercase">Partidas Ativas</p>
                        <p className="text-white text-sm">Mostrando {matches.filter(m => m.lat && m.lng && m.status !== 'Cancelado').length} jogos no mapa</p>
                    </div>
                    <div className="text-2xl">🌍</div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MatchesMap;
