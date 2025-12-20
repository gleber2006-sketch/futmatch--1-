import React, { useState } from 'react';
import { Match, Profile } from '../types';
import { LocationIcon, CalendarIcon, UsersIcon, EditIcon, ChatIcon, ShareIcon, LockIcon } from './Icons';
import ModernLoader from './ModernLoader';
import TeamLogo from './TeamLogo';
import ParticipantAvatar from './ParticipantAvatar';
import { SPORT_EMOJIS } from '../constants';

interface MatchCardProps {
    match: Match;
    onCardClick: (match: Match) => void;
    onJoinMatch: (matchId: number) => Promise<void>;
    onLeaveMatch: (matchId: number) => Promise<void>;
    joinedMatchIds: Set<number>;
    currentUser: Profile;
    onEditMatch: (match: Match) => void;
    onNavigateToDirectChat?: (matchId: number) => void;
    className?: string;
}

/** Badge que indica o status da partida (Convocando, Confirmada ou Cancelada) */
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

const MatchCard: React.FC<MatchCardProps> = ({
    match,
    onCardClick,
    onJoinMatch,
    onLeaveMatch,
    joinedMatchIds,
    currentUser,
    onEditMatch,
    onNavigateToDirectChat,
    className = '',
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const confirmedParticipants = Number(match.filled_slots || 0);
    const totalSlots = Number(match.slots || 0);
    const hasJoined = joinedMatchIds?.has(Number(match.id)) || false;
    const isFull = totalSlots > 0 && confirmedParticipants >= totalSlots;
    const isCanceled = match.status === 'Cancelado';
    const isConfirmed = match.status === 'Confirmado';
    const isFinalized = match.status === 'Finalizada';
    const isCreator = currentUser?.id === match.created_by;

    const isBoosted = match.is_boosted && match.boost_until && new Date(match.boost_until) > new Date();

    const slotsColor = isFull ? 'bg-red-500' : 'bg-green-500';
    const sportEmoji = SPORT_EMOJIS[match.sport] || '🏅';

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(match.date);

    const handleParticipationClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCanceled || isConfirmed || isFinalized || isLoading) return;

        setIsLoading(true);
        try {
            if (hasJoined) {
                await onLeaveMatch(match.id);
            } else if (!isFull) {
                await onJoinMatch(match.id);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const formattedDate = new Date(match.date).toLocaleString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
        const message = `⚽ *Convite para Partida no FutMatch* ⚽

*${match.name}*
🏆 Esporte: ${match.sport}
📅 Data: ${formattedDate}
📍 Local: ${match.location}
👥 Vagas: ${match.filled_slots}/${match.slots}

🔗 *Participe aqui:* ${window.location.origin}?match=${match.id}

Bora jogar? 🚀`;

        // Tenta usar a API de compartilhamento nativa (permite escolher entre WhatsApp Pessoal/Business)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Convite FutMatch',
                    text: message,
                });
                return;
            } catch (error) {
                // Se o usuário cancelou, não faz nada. Se for outro erro, tenta o fallback.
                if ((error as Error).name === 'AbortError') return;
                console.error('Erro no compartilhamento nativo:', error);
            }
        }

        // Fallback padrão
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const getButtonState = () => {
        if (isCanceled) {
            return {
                text: 'Partida Cancelada ❌',
                isDisabled: true,
                className: 'bg-gradient-to-r from-gray-700 to-gray-600 opacity-80 text-gray-200 cursor-not-allowed border border-gray-600',
            };
        }
        if (isConfirmed) {
            return {
                text: 'Presenças Encerradas ✅',
                isDisabled: true,
                className: 'bg-gradient-to-r from-gray-700 to-gray-600 opacity-80 text-gray-200 cursor-not-allowed border border-gray-600',
            };
        }
        if (isFinalized) {
            return {
                text: 'Partida Finalizada 🏁',
                isDisabled: true,
                className: 'bg-gradient-to-r from-gray-700 to-gray-600 opacity-80 text-gray-200 cursor-not-allowed border border-gray-600',
            };
        }
        if (isLoading) {
            const loadingText = hasJoined ? 'Cancelando...' : 'Confirmando...';
            return {
                text: (
                    <>
                        <span className="ml-2">{loadingText}</span>
                    </>
                ),
                isDisabled: true,
                className: 'bg-gradient-to-r from-gray-700 to-gray-600 cursor-wait',
            };
        }
        if (hasJoined) {
            return {
                text: 'Sair da Partida',
                isDisabled: false,
                className: 'bg-gradient-to-r from-red-600 to-red-400 hover:brightness-110',
            };
        }
        if (isFull) {
            return {
                text: 'Lotado ✅',
                isDisabled: true,
                className: 'bg-gradient-to-r from-gray-700 to-gray-600 opacity-80 text-gray-200 cursor-not-allowed border border-gray-600',
            };
        }
        return {
            text: 'Confirmar presença',
            isDisabled: false,
            className: 'bg-gradient-to-r from-green-600 to-green-400 hover:brightness-110',
        };
    };

    const buttonState = getButtonState();

    return (
        <div
            onClick={() => !isCanceled && onCardClick(match)}
            className={`relative rounded-xl shadow-lg overflow-hidden mb-4 transition-all duration-300 w-full backdrop-blur-md border ${className}
        ${match.is_private && !isCanceled
                    ? 'bg-gradient-to-br from-purple-900/40 via-[#2e1065]/50 to-purple-800/20 border-purple-500/50 hover:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : !isCanceled
                        ? 'bg-gradient-to-br from-[#022c22]/40 via-[#064e3b]/30 to-[#065f46]/20 border-neon-green/50 shadow-[0_0_15px_rgba(0,255,148,0.2)] hover:border-neon-green hover:shadow-[0_0_25px_rgba(0,255,148,0.3)]'
                        : 'bg-gray-800/50 border-gray-700'}
        ${isCanceled ? 'opacity-60 grayscale-[50%]' : 'transform hover:scale-[1.02] cursor-pointer'}
        ${isBoosted && !isCanceled ? 'border-neon-green shadow-[0_0_25px_rgba(0,255,148,0.5)] ring-1 ring-neon-green/30' : ''}
        `}
            aria-disabled={isCanceled}
        >
            {/* Badge de destaque (booster) */}
            {
                isBoosted && !isCanceled && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[0.6rem] font-bold px-1 py-0.5 rounded-bl-lg z-10 flex items-center gap-0.5 shadow-sm max-w-[120px] overflow-hidden whitespace-nowrap">
                        <span>🔥 Destaque</span>
                    </div>
                )
            }

            {/* Badge de Partida Privada */}
            {
                match.is_private && !isCanceled && (
                    <div className={`absolute top-0 ${isBoosted ? 'right-[4.5rem]' : 'right-0'} bg-purple-600 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm`}>
                        <LockIcon className="h-3 w-3" />
                        <span>PRIVADA</span>
                    </div>
                )
            }

            {/* Overlay quando a partida está cancelada */}
            {
                isCanceled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 p-4 text-center">
                        <span className="text-red-400 font-bold text-lg">🚫 Cancelada</span>
                        {match.cancellation_reason && (
                            <p className="text-sm text-red-300 italic mt-1">{match.cancellation_reason}</p>
                        )}
                    </div>
                )
            }

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex-grow pr-2">
                        <p className="text-xs font-semibold text-green-400 mb-1">
                            {sportEmoji} {match.sport}
                        </p>
                        <h3 className="text-lg font-bold text-white mt-1 leading-tight">{match.name}</h3>

                        {/* Team Logo Display */}
                        {match.team && (
                            <div className="flex items-center gap-2 mt-2">
                                <TeamLogo
                                    logoUrl={match.team.logo_url}
                                    teamName={match.team.name}
                                    size="small"
                                />
                                <span className="text-xs text-gray-400 font-medium">
                                    {match.team.name}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-2 pt-2 flex-shrink-0">
                        {isCreator && !isCanceled && !isConfirmed && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    onEditMatch(match);
                                }}
                                className="p-2 text-white bg-gray-700 rounded-full border border-gray-600 hover:bg-gray-600 transition-colors"
                                aria-label="Editar Partida"
                            >
                                <EditIcon />
                            </button>
                        )}
                        <div className="flex flex-col items-end gap-2">
                            <div className={`text-white px-3 py-1 rounded-full text-sm font-bold ${slotsColor}`}>
                                {confirmedParticipants} / {totalSlots}
                            </div>

                            {/* Avatar Stack */}
                            {match.match_participants && match.match_participants.length > 0 && (
                                <div className="flex -space-x-2 overflow-hidden">
                                    {match.match_participants.slice(0, 3).map((p, i) => (
                                        <ParticipantAvatar
                                            key={p.user_id || i}
                                            photoUrl={p.profile?.photo_url}
                                            name={p.profile?.name || 'Usuário'}
                                            size="small"
                                            className="inline-block"
                                        />
                                    ))}
                                    {match.match_participants.length > 3 && (
                                        <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-gray-800 bg-gray-600 text-[10px] text-white font-bold">
                                            +{match.match_participants.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}

                            <StatusBadge status={match.status} />
                        </div>
                    </div>
                </div>

                <div className="mt-3 space-y-2 text-gray-300 text-sm">
                    <div className="flex items-center">
                        <LocationIcon />
                        <span className="ml-2 truncate">{match.location}</span>
                    </div>
                    <div className="flex items-center">
                        <CalendarIcon />
                        <span className="ml-2">{formattedDate}</span>
                    </div>
                    <div className="flex items-center">
                        <UsersIcon />
                        <span className="ml-2 italic truncate">"{match.rules}"</span>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-4">
                {!isCanceled && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleParticipationClick}
                            disabled={buttonState.isDisabled}
                            className={`flex-1 text-[#0a1628] font-bold py-2.5 rounded-lg shadow-md transition-all duration-200 flex justify-center items-center text-sm ${buttonState.isDisabled
                                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                : hasJoined
                                    ? 'bg-red-500 hover:bg-red-400 text-white'
                                    : 'bg-[#00FF94] hover:bg-[#00e686] hover:shadow-[0_0_15px_rgba(0,255,148,0.4)]'
                                }`}
                        >
                            {buttonState.text}
                        </button>

                        {(hasJoined || isCreator) && onNavigateToDirectChat && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    onNavigateToDirectChat(match.id);
                                }}
                                className="bg-[#00C2FF] text-[#0a1628] p-3 rounded-lg shadow-md hover:brightness-110 transition-all"
                                title="Chat da Partida"
                            >
                                <ChatIcon />
                            </button>
                        )}

                        <button
                            onClick={handleShareClick}
                            className="bg-white/10 text-white border border-white/20 p-3 rounded-lg shadow-md hover:bg-white/20 transition-all backdrop-blur-sm"
                            title="Compartilhar no WhatsApp"
                        >
                            <ShareIcon />
                        </button>
                    </div>
                )}
                {isCreator && !isCanceled && (
                    <div className="text-center text-sm text-gray-400 italic pt-2">
                        Você é o organizador desta partida.
                    </div>
                )}
            </div>
            {isLoading && <ModernLoader />}
        </div >
    );
};

export default MatchCard;
