import React, { useEffect, useRef, useState } from 'react';
import { Match, Profile } from '../types';
import { LocationIcon, CalendarIcon, UsersIcon, CloseIcon, EditIcon, ChatIcon, ShareIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../services/supabaseClient';
import MatchParticipantsModal from './MatchParticipantsModal';

declare var L: any;

interface MatchDetailsModalProps {
  match: Match;
  onClose: () => void;
  onJoinMatch: (matchId: number) => Promise<void>;
  onLeaveMatch: (matchId: number) => Promise<void>;
  onCancelMatch: (matchId: number, reason: string) => Promise<void>;
  joinedMatchIds: Set<number>;
  currentUser: Profile;
  onEditMatch: (match: Match) => void;
  onNavigateToDirectChat?: (matchId: number) => void;
  onBalanceUpdate?: () => void;
  onBoostMatch?: (matchId: number) => Promise<boolean>;
  onApproveParticipant?: (matchId: number, userId: string) => Promise<void>;
  onDeclineParticipant?: (matchId: number, userId: string) => Promise<void>;
  onRemoveParticipant?: (matchId: number, userId: string) => Promise<void>;
  onPromoteFromWaitlist?: (matchId: number, userId: string) => Promise<void>;
}

const StatusBadge: React.FC<{ status: Match['status'] }> = ({ status }) => {
  const statusMap = {
    Convocando: { text: 'Convocando', style: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500' },
    Confirmado: { text: 'Confirmada', style: 'bg-green-500/20 text-green-300 border border-green-500' },
    Cancelado: { text: 'Cancelada', style: 'bg-red-500/20 text-red-300 border border-red-500' },
    Finalizada: { text: 'Finalizada', style: 'bg-blue-500/20 text-blue-300 border border-blue-500' },
  };

  const currentStatus = statusMap[status] || statusMap.Convocando;

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentStatus.style}`}>
      {currentStatus.text}
    </span>
  );
};

const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  onClose,
  onJoinMatch,
  onLeaveMatch,
  onCancelMatch,
  onEditMatch,
  joinedMatchIds,
  currentUser,
  onNavigateToDirectChat,
  onBalanceUpdate,
  onBoostMatch,
  onApproveParticipant,
  onDeclineParticipant,
  onRemoveParticipant,
  onPromoteFromWaitlist,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isBoosting, setIsBoosting] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  useEffect(() => {
    if (typeof L === 'undefined' || !mapRef.current || !match.lat || !match.lng) return;

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      try {
        const position: [number, number] = [match.lat, match.lng];
        const map = L.map(mapRef.current).setView(position, 15);
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        const marker = L.marker(position).addTo(map);
        marker.bindPopup(`<b>${match.name}</b>`).openPopup();

        // Force a resize to prevent gray tiles
        map.invalidateSize();
      } catch (e) {
        console.error('Leaflet initialization failed:', e);
      }
    }, 10);

    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [match]);

  const isCreator = currentUser?.id === match.created_by;
  const hasJoined = joinedMatchIds?.has(Number(match.id)) ?? false;
  const isFull = match.filled_slots >= match.slots;
  const isCanceled = match.status === 'Cancelado';
  const isConfirmed = match.status === 'Confirmado';
  const isFinalized = match.status === 'Finalizada';
  const confirmedParticipants = match.filled_slots || 0;
  const totalSlots = match.slots;

  // Track participant count changes
  useEffect(() => {
    console.log('👥 MatchDetailsModal: filled_slots updated to', match.filled_slots);
  }, [match.filled_slots]);

  const formattedDate = new Date(match.date).toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isBoosted = match.is_boosted && match.boost_until && new Date(match.boost_until) > new Date();

  const getButtonState = () => {
    if (isCanceled) return { text: 'Partida Cancelada', isDisabled: true, className: 'bg-gray-700 cursor-not-allowed' };
    if (isConfirmed) return { text: 'Partida Confirmada', isDisabled: true, className: 'bg-gray-700 cursor-not-allowed' };
    if (isFinalized) return { text: 'Partida Finalizada', isDisabled: true, className: 'bg-gray-700 cursor-not-allowed' };
    if (hasJoined) return { text: 'Sair da Partida', isDisabled: false, className: 'bg-red-600 hover:brightness-110' };
    if (isFull) return { text: 'Lotado ✅', isDisabled: true, className: 'bg-gray-700 opacity-50 cursor-not-allowed' };
    return { text: 'Confirmar presença', isDisabled: false, className: 'bg-green-600 hover:brightness-110' };
  };

  const buttonState = getButtonState();

  const handleParticipationClick = async () => {
    if (isCanceled || isConfirmed || isFinalized || isLoading) return;

    setIsLoading(true);
    try {
      if (hasJoined) {
        await onLeaveMatch(match.id);
      } else {
        await onJoinMatch(match.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => setShowCancelInput(true);

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      alert('⚠️ Informe um motivo para o cancelamento.');
      return;
    }

    setIsLoading(true);
    try {
      // Check for participants before cancelling
      const { count, error } = await supabase
        .from('match_participants')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', match.id);

      if (error) throw error;

      const hasParticipants = count !== null && count > 0;

      const confirmed = hasParticipants
        ? window.confirm(
          '⚠️ ATENÇÃO: Existem jogadores inscritos nesta partida.\n\n' +
          'Ao cancelar agora, você NÃO receberá o reembolso dos 2 MatchCoins.\n\n' +
          'Deseja realmente cancelar?',
        )
        : window.confirm(
          'ℹ️ CONFIRMAÇÃO: Não há jogadores inscritos.\n\n' +
          'Ao cancelar, você SERÁ REEMBOLSADO em 2 MatchCoins.\n\n' +
          'Deseja confirmar o cancelamento?',
        );

      if (!confirmed) return;

      await onCancelMatch(match.id, cancelReason.trim());
      onClose();
    } catch (err) {
      console.error('Erro ao cancelar partida:', err);
      alert('❌ Erro ao cancelar a partida.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoostClick = async () => {
    if (isBoosted || isBoosting) return;

    const confirmBoost = window.confirm(
      'Dar BOOST custa 2 MatchCoins e destaca sua partida por 12h. Deseja continuar?',
    );

    if (!confirmBoost) return;

    setIsBoosting(true);
    try {
      if (onBoostMatch) {
        const success = await onBoostMatch(match.id);
        if (!success) return; // If failed (e.g. insufficient funds), stop here
        // If success, maybe close modal or just update UI?
        // For now, let's close to refresh list or keep open if updated via realtime
        onClose();
      }
    } catch (e) {
      console.error("Boost error", e);
    } finally {
      setIsBoosting(false);
    }
  };

  const handleShareClick = () => {
    const message = `Venha jogar no ${match.name}! ⚽\n📅 ${formattedDate}\n📍 ${match.location}\n\nLink: ${window.location.origin}?match=${match.id}\n\nParticipe pelo App FutMatch!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-details-title"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 left-3 text-white hover:text-green-400 z-[110] px-3 py-2 bg-gray-900/90 hover:bg-gray-900 rounded-lg transition-all duration-200 shadow-lg flex items-center gap-1 text-sm font-medium" aria-label="Voltar">
          <span>←</span> Voltar
        </button>
        <button onClick={onClose} className="absolute top-3 right-3 text-white hover:text-red-500 z-[110] p-2 bg-gray-900/90 hover:bg-gray-900 rounded-full transition-all duration-200 shadow-lg" aria-label="Fechar modal">
          <CloseIcon />
        </button>

        {match.lat && match.lng ? (
          <div ref={mapRef} className="w-full h-56 bg-gray-700 rounded-t-xl flex-shrink-0" />
        ) : (
          <div className="w-full h-56 bg-gray-700 rounded-t-xl flex-shrink-0 flex items-center justify-center text-center p-4">
            <p className="text-gray-400">Localização não disponível no mapa.</p>
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-green-400">{match.sport}</p>
              <h3 id="match-details-title" className="text-2xl font-bold text-white mt-1">
                {match.name}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`text-white px-3 py-1 rounded-full text-sm font-bold ${isFull ? 'bg-red-500' : 'bg-green-500'}`}>
                {confirmedParticipants} / {totalSlots}
              </div>
              <StatusBadge status={match.status} />
            </div>
          </div>

          {isCanceled && match.cancellation_reason && (
            <div className="mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/30">
              <p className="font-bold text-red-300">Motivo do Cancelamento:</p>
              <p className="text-red-400 italic">{match.cancellation_reason}</p>
            </div>
          )}

          <div className="mt-4 space-y-3 text-gray-300">
            <div className="flex items-center">
              <LocationIcon />
              <span className="ml-2">{match.location}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon />
              <span className="ml-2">{formattedDate}</span>
            </div>
            <div className="flex items-start">
              <UsersIcon />
              <span className="ml-2 italic">{match.rules || 'Sem regras específicas.'}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleParticipationClick}
              disabled={buttonState.isDisabled || isLoading}
              className={`w-full text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center ${buttonState.className}`}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={5} />
                  <span className="ml-2">{hasJoined ? 'Saindo...' : 'Confirmando...'}</span>
                </>
              ) : (
                buttonState.text
              )}
            </button>

            {/* Organizer Actions */}
            {(hasJoined || isCreator) && !isFinalized && (
              <div className="mt-4 border-t border-gray-700 pt-4">
                {isCreator && !isCanceled && !isConfirmed && (
                  <button
                    onClick={handleBoostClick}
                    disabled={isBoosting}
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-yellow-400"
                  >
                    {isBoosting ? <LoadingSpinner size={5} /> : '🚀 Dar BOOST (2 MatchCoins)'}
                  </button>
                )}

                {isCreator && (
                  <button
                    onClick={() => onEditMatch(match)}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-3"
                  >
                    <EditIcon /> Editar Partida
                  </button>
                )}

                {isCreator && !isCanceled && !isConfirmed && (
                  <div className="mt-3">
                    {!showCancelInput ? (
                      <button
                        onClick={handleCancelClick}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-red-600 to-red-400 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all"
                      >
                        Cancelar Partida
                      </button>
                    ) : (
                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                        <p className="text-white font-bold mb-2">Informe o motivo do cancelamento:</p>
                        <textarea
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          placeholder="Ex: Chuva forte, falta de jogadores..."
                          className="w-full p-2 rounded-md bg-gray-800 text-gray-200 border border-gray-600 mb-3"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelConfirm}
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-400 text-white font-bold py-2 rounded-lg hover:brightness-110 transition-all"
                          >
                            {isLoading ? (
                              <>
                                <LoadingSpinner size={5} />
                                <span className="ml-2">Confirmando...</span>
                              </>
                            ) : (
                              'Confirmar Cancelamento'
                            )}
                          </button>
                          <button
                            onClick={() => setShowCancelInput(false)}
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold py-2 rounded-lg hover:brightness-110 transition-all"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={onNavigateToDirectChat ? () => onNavigateToDirectChat(match.id) : undefined}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-3"
              >
                <ChatIcon /> <span className="inline">Chat da Partida</span>
              </button>
            </div>

            <div className="mt-3">
              <button
                onClick={handleShareClick}
                className="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <ShareIcon /> <span className="inline">Compartilhar no WhatsApp</span>
              </button>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setShowParticipantsModal(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <UsersIcon /> <span className="inline">Ver Participantes ({match.filled_slots})</span>
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        `}</style>
        {/* Modal de Participantes */}
        {showParticipantsModal && (
          <MatchParticipantsModal
            match={match}
            currentUser={currentUser}
            onClose={() => setShowParticipantsModal(false)}
            onApproveParticipant={onApproveParticipant}
            onDeclineParticipant={onDeclineParticipant}
            onRemoveParticipant={onRemoveParticipant}
            onPromoteFromWaitlist={onPromoteFromWaitlist}
          />
        )}

      </div>
    </div>
  );
};

export default MatchDetailsModal;