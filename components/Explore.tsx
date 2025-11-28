
import React, { useState, useEffect, useRef } from 'react';
import { Match, Feature, Profile } from '../types';
import MatchCard from './MatchCard';
import LoadingSpinner from './LoadingSpinner';
import PlatformFeatures from './PlatformFeatures';
import MatchDetailsModal from './MatchDetailsModal';
import { SPORTS_LIST } from '../constants';

interface ExploreProps {
  matches: Match[];
  platformFeatures: Feature[];
  onJoinMatch: (matchId: number) => Promise<void>;
  onLeaveMatch: (matchId: number) => Promise<void>;
  onCancelMatch: (matchId: number, reason: string) => Promise<void>;
  onDeleteCanceledMatches: () => Promise<void>;
  joinedMatchIds: Set<number>;
  currentUser: Profile;
  onEditMatch: (match: Match) => void;
  onNavigateToCreate: () => void;
  onRefreshMatches?: () => Promise<void>;
  onNavigateToProfile: () => void;
  onNavigateToMap: () => void;
  onNavigateToMyGames: () => void;
  onNavigateToRanking: () => void;
  onNavigateToCommunity: () => void;
  onNavigateToArenas: () => void;
  onNavigateToMatchChat: () => void;
  onNavigateToDirectChat?: (matchId: number) => void;
  onNavigateToNotifications: () => void;
  onNavigateToWallet: () => void;
  onBalanceUpdate?: (amount: number) => void;
  onBoostMatch?: (matchId: number) => Promise<boolean>;
  selectedMatch: Match | null;
  onSelectMatch: (match: Match | null) => void;
  onCloseMatchDetails: () => void;
}

const haversineDistance = (
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const Explore: React.FC<ExploreProps> = ({ matches, platformFeatures, onJoinMatch, onLeaveMatch, onCancelMatch, onDeleteCanceledMatches, onEditMatch, joinedMatchIds, currentUser, onNavigateToCreate, onRefreshMatches, onNavigateToProfile, onNavigateToMap, onNavigateToMyGames, onNavigateToRanking, onNavigateToCommunity, onNavigateToArenas, onNavigateToMatchChat, onNavigateToDirectChat, onNavigateToNotifications, onNavigateToWallet, onBalanceUpdate, onBoostMatch, selectedMatch, onSelectMatch, onCloseMatchDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [distanceFilter, setDistanceFilter] = useState<number>(Infinity);
  const [statusFilter, setStatusFilter] = useState<Match['status'] | 'all'>('Convocando');
  const [sportFilter, setSportFilter] = useState<string>('all');

  const matchesSectionRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationStatus('success');
        },
        () => {
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  }, []);

  const handleCardClick = (match: Match) => {
    onSelectMatch(match);
  };

  const handleFeatureClick = (title: string) => {
    if (title === 'Criar Partida') {
      onNavigateToCreate();
    } else if (title === 'Encontre Partidas Próximas') {
      if (onRefreshMatches) {
        onRefreshMatches();
      }
      matchesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (title === 'Meus Jogos') {
      onNavigateToMyGames();
    } else if (title === 'Meu Perfil') {
      onNavigateToProfile();
    } else if (title === 'Mapa das Partidas') {
      onNavigateToMap();
    } else if (title === 'Ranking de Jogadores') {
      onNavigateToRanking();
    } else if (title === 'Comunidade') {
      onNavigateToCommunity();
    } else if (title === 'Campos e Arenas') {
      onNavigateToArenas();
    } else if (title === 'Chat das Partidas') {
      onNavigateToMatchChat();
    } else if (title === 'Notificações') {
      onNavigateToNotifications();
    } else if (title === 'Carteira FutMatch') {
      onNavigateToWallet();
    }
  };

  const sortedAndFilteredMatches = matches
    .map(match => {
      const distance = userLocation && match.lat != null && match.lng != null ? haversineDistance(userLocation, { lat: match.lat, lng: match.lng }) : Infinity;
      return { ...match, distance };
    })
    .filter(match => {
      const matchesSearch =
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.sport.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDistance = match.distance <= distanceFilter;

      const matchesStatus = statusFilter === 'all' || match.status === statusFilter;

      const matchesSport = sportFilter === 'all' || match.sport === sportFilter;

      return matchesSearch && matchesDistance && matchesStatus && matchesSport;
    })
    .sort((a, b) => {
      // 1. Priority: Status
      const statusOrder: { [key in Match['status']]: number } = {
        'Convocando': 1,
        'Confirmado': 2,
        'Cancelado': 3,
      };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }

      // 2. Priority: Distance
      return a.distance - b.distance;
    });

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onNavigateToWallet}
          className="bg-gray-900/90 backdrop-blur-sm text-yellow-400 px-4 py-2 rounded-full text-sm font-bold border border-yellow-500/50 shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 animate-fade-in"
        >
          ⚡ {currentUser.matchCoins} <span className="hidden sm:inline">MatchCoins</span>
        </button>
      </div>

      <PlatformFeatures features={platformFeatures} onFeatureClick={handleFeatureClick} />

      <div ref={matchesSectionRef} className="mb-6 bg-gray-900 py-2 max-w-md mx-auto md:max-w-7xl overflow-hidden">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Partidas Próximas</h2>
        <input
          type="text"
          placeholder="Buscar por esporte, nome ou local..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
        />
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1 ml-1">Distância</label>
              <select
                value={distanceFilter}
                onChange={e => setDistanceFilter(Number(e.target.value))}
                className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              >
                <option value="Infinity">Qualquer</option>
                <option value="1">1 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1 ml-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as Match['status'] | 'all')}
                className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              >
                <option value="Convocando">Convocando</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Cancelado">Cancelado</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-400 mb-1 ml-1">Modalidade</label>
              <select
                value={sportFilter}
                onChange={e => setSportFilter(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              >
                <option value="all">Todas</option>
                {SPORTS_LIST.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={onDeleteCanceledMatches}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-400 text-white py-2 px-4 rounded-lg text-sm font-bold hover:brightness-110 transition-all shadow-md"
          >
            Limpar Canceladas
          </button>
        </div>
      </div>

      {locationStatus === 'loading' && <div className="flex justify-center items-center p-4"><LoadingSpinner /> <span className="ml-2">Buscando sua localização...</span></div>}
      {locationStatus === 'error' && <div className="bg-yellow-500/20 text-yellow-300 p-3 rounded-lg mb-4 text-center max-w-md mx-auto">Não foi possível obter sua localização. Mostrando todos os jogos.</div>}

      <div className="max-w-md mx-auto md:max-w-7xl px-4">
        {sortedAndFilteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onCardClick={handleCardClick}
                onJoinMatch={onJoinMatch}
                onLeaveMatch={onLeaveMatch}
                joinedMatchIds={joinedMatchIds}
                currentUser={currentUser}
                onEditMatch={onEditMatch}
                onNavigateToDirectChat={onNavigateToDirectChat}
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10">
            <p>Nenhuma partida encontrada com os filtros atuais.</p>
          </div>
        )}
      </div>

      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
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
      )}
    </div>
  );
};

export default Explore;
