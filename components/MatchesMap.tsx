
import React, { useEffect, useRef, useState } from 'react';
import { Match, Profile } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { LocationIcon, CloseIcon } from './Icons';
import { SPORT_EMOJIS } from '../constants';
import MatchDetailsModal from './MatchDetailsModal';

// Declare Leaflet's 'L' to avoid TypeScript errors
declare var L: any;

interface MatchesMapProps {
  matches: Match[];
  onNavigateBack: () => void;
  onMatchClick?: (match: Match) => void;
  selectedMatch?: Match | null;
  onCloseMatchDetails?: () => void;
  currentUser: Profile | null;
  joinedMatchIds: Set<number>;
  onJoinMatch: (matchId: number) => Promise<void>;
  onLeaveMatch: (matchId: number) => Promise<void>;
  onCancelMatch: (matchId: number, reason: string) => Promise<void>;
  onEditMatch: (match: Match) => void;
  onNavigateToDirectChat?: (matchId: number) => void;
  onBalanceUpdate?: (amount: number) => void;
  onBoostMatch?: (matchId: number) => Promise<boolean>;
}

const MatchesMap: React.FC<MatchesMapProps> = ({
  matches,
  onNavigateBack,
  onMatchClick,
  selectedMatch,
  onCloseMatchDetails,
  currentUser,
  joinedMatchIds,
  onJoinMatch,
  onLeaveMatch,
  onCancelMatch,
  onEditMatch,
  onNavigateToDirectChat,
  onBalanceUpdate,
  onBoostMatch
}) => {
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

          // Always show button per user request to "add button on matches"
          const buttonHtml = `<button id="btn-match-${match.id}" class="mt-2 w-full bg-[#00FF94] text-[#0a1628] text-xs font-bold py-2 px-2 rounded hover:brightness-110 transition-colors shadow-sm">VER DETALHES</button>`;

          const popupContent = `
            <div class="text-gray-900 p-1 min-w-[160px]">
                <p class="text-xs font-bold text-green-600 uppercase mb-1">${match.sport}</p>
                <h3 class="font-bold text-sm mb-1 leading-tight">${match.name}</h3>
                <p class="text-xs text-gray-600 mb-1 truncate">📍 ${match.location}</p>
                <p class="text-xs text-gray-600 mb-2">📅 ${new Date(match.date).toLocaleDateString('pt-BR')} ${new Date(match.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                ${buttonHtml}
            </div>
          `;

          marker.bindPopup(popupContent);
        }
      });

      // Event delegation for popup buttons
      map.on('popupopen', (e: any) => {
        const popup = e.popup;
        const wrapper = popup.getElement();
        if (wrapper) {
          const buttons = wrapper.querySelectorAll('button[id^="btn-match-"]');
          buttons.forEach((btn: any) => {
            const matchId = parseInt(btn.id.replace('btn-match-', ''), 10);
            btn.onclick = (ev: MouseEvent) => {
              ev.preventDefault();
              const match = matches.find(m => m.id === matchId);
              if (match && onMatchClick) {
                onMatchClick(match);
              }
            };
          });
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
  }, [isLoading, userLocation, matches, onMatchClick]);


  return (
    // FULL SCREEN MAP CONTAINER
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header Navigation - Floating on top */}
      <div className="absolute top-0 left-0 right-0 p-4 z-[1000] pointer-events-none">
        <div className="flex items-center justify-between bg-gray-800/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-700 pointer-events-auto">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <LocationIcon /> Mapa das Partidas
          </h2>
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all shadow-md"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Map Container - Full Size */}
      <div className="flex-grow w-full h-full relative z-0">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
            <LoadingSpinner size={10} />
            <p className="mt-4 text-gray-400 animate-pulse">Carregando mapa...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Floating Info Badge - Bottom */}
        {!isLoading && (
          <div className="absolute bottom-6 left-4 right-4 z-[1000] pointer-events-none">
            <div className="bg-gray-900/90 backdrop-blur-md p-3 rounded-xl border border-gray-700 shadow-xl flex justify-between items-center pointer-events-auto">
              <div>
                <p className="text-[#00FF94] text-xs font-bold uppercase tracking-wider">Partidas Ativas</p>
                <p className="text-white text-sm font-medium">
                  {matches.filter(m => m.lat && m.lng && m.status !== 'Cancelado').length} jogos encontrados na região
                </p>
              </div>
              <div className="text-2xl filter drop-shadow-md">🌍</div>
            </div>
          </div>
        )}

        {/* Modal Rendering */}
        {selectedMatch && currentUser && onCloseMatchDetails && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center pointer-events-auto">
            <MatchDetailsModal
              match={matches.find(m => m.id === selectedMatch.id) || selectedMatch}
              onClose={onCloseMatchDetails}
              onJoinMatch={onJoinMatch}
              onLeaveMatch={onLeaveMatch}
              onCancelMatch={onCancelMatch}
              joinedMatchIds={joinedMatchIds}
              currentUser={currentUser}
              onEditMatch={onEditMatch}
              onNavigateToDirectChat={onNavigateToDirectChat}
              onBalanceUpdate={onBalanceUpdate}
              onBoostMatch={onBoostMatch}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default MatchesMap;
