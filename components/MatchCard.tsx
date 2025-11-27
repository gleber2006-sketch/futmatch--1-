
import React, { useState } from 'react';
import { Match, Profile } from '../types';
import { LocationIcon, CalendarIcon, UsersIcon, EditIcon, ChatIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';
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
}

const StatusBadge: React.FC<{ status: Match['status'] }> = ({ status }) => {
    const statusMap = {
        Convocando: { text: 'Convocando', style: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500' },
        Confirmado: { text: 'Confirmada', style: 'bg-green-500/20 text-green-300 border border-green-500' },
        Cancelado: { text: 'Cancelada', style: 'bg-red-500/20 text-red-300 border border-red-500' },
    };
    const currentStatus = statusMap[status] || statusMap.Convocando;

    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentStatus.style}`}>{currentStatus.text}</span>;
};


const MatchCard: React.FC<MatchCardProps> = ({ match, onCardClick, onJoinMatch, onLeaveMatch, joinedMatchIds, currentUser, onEditMatch, onNavigateToDirectChat }) => {
    const [isLoading, setIsLoading] = useState(false);

    const confirmedParticipants = Number(match.filled_slots || 0);
    const totalSlots = Number(match.slots || 0);
    const hasJoined = joinedMatchIds?.has(Number(match.id)) || false;
    const isFull = totalSlots > 0 && confirmedParticipants >= totalSlots;
    const isCanceled = match.status === 'Cancelado';
    const isConfirmed = match.status === 'Confirmado';
    const isCreator = currentUser?.id === match.created_by;

    const isBoosted = match.is_boosted && match.boost_until && new Date(match.boost_until) > new Date();

    const slotsColor = isFull ? 'bg-red-500' : 'bg-green-500';
    const sportEmoji = SPORT_EMOJIS[match.sport] || '🏅';

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(match.date);

    const handleParticipationClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCanceled || isConfirmed || isLoading) return;

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

    const getButtonState = () => {
        if (isCanceled) {
            return { text: 'Partida Cancelada ❌', isDisabled: true, className: 'bg-gradient-to-r from-gray-700 to-gray-600 opacity-50 cursor-not-allowed' };
        }
        if (isConfirmed) {
            return { text: 'Presenças Encerradas ✅', isDisabled: true, className: 'bg-gradient-to-r from-gray-700 to-gray-600 opacity-50 cursor-not-allowed' };
        }
        if (isLoading) {
            const loadingText = hasJoined ? 'Cancelando...' : 'Confirmando...';
            return {
                text: <><LoadingSpinner size={5} /><span className="ml-2">{loadingText}</span></>,
                isDisabled: true,
                className: 'bg-gradient-to-r from-gray-700 to-gray-600 cursor-wait'
            };
        }
        if (hasJoined) {
            return { text: 'Sair da Partida', isDisabled: false, className: 'bg-gradient-to-r from-red-600 to-red-400 hover:brightness-110' };
        }
        if (isFull) {
            return { text: 'Lotado ✅', isDisabled: true, className: 'bg-gradient-to-r from-gray-700 to-gray-600 opacity-50 cursor-not-allowed' };
        }
        return { text: 'Confirmar presença', isDisabled: false, className: 'bg-gradient-to-r from-green-600 to-green-400 hover:brightness-110' };
    };

    const buttonState = getButtonState();

    return (
        <div
            onClick={() => !isCanceled && onCardClick(match)}
            className={`
            relative bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6 transition-all duration-300 
            ${isCanceled ? 'opacity-60 grayscale-[50%]' : 'transform hover:scale-[1.02] cursor-pointer'}
            ${isBoosted && !isCanceled ? 'border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : ''}
        `}
            aria-disabled={isCanceled}
        >
            {isBoosted && !isCanceled && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
                    <span>🔥 Destaque</span>
                </div>
            )}

            {isCanceled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 p-4 text-center">
                    <span className="text-red-400 font-bold text-lg">🚫 Cancelada</span>
                    {match.cancellation_reason && (
                        <p className="text-sm text-red-300 italic mt-1">"{match.cancellation_reason}"</p>
                    )}
                </div>
            )}
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <p className="text-sm font-semibold text-green-400 mb-1">{sportEmoji} {match.sport}</p>
                        <h3 className="text-xl font-bold text-white mt-1">{match.name}</h3>
                    </div>
                    <div className="flex items-start gap-2 ml-2 pt-4">
                        {isCreator && !isCanceled && !isConfirmed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditMatch(match);
                                }}
                                className="p-2 text-gray-400 bg-gray-700/50 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                                aria-label="Editar Partida"
                            >
                                <EditIcon />
                            </button>
                        )}
                        <div className="flex flex-col items-end gap-2">
                            <div className={`text-white px-3 py-1 rounded-full text-sm font-bold ${slotsColor}`}>
                                {confirmedParticipants} / {totalSlots}
                            </div>
                            <StatusBadge status={match.status} />
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-3 text-gray-300">
                    <div className="flex items-center">
                        <LocationIcon />
                        <span className="ml-2">{match.location}</span>
                    </div>
                    <div className="flex items-center">
                        <CalendarIcon />
                        <span className="ml-2">{formattedDate}</span>
                    </div>
                    <div className="flex items-center">
                        <UsersIcon />
                        <span className="ml-2 italic">"{match.rules}"</span>
                    </div>
                </div>

            </div>
            <div className="px-5 pb-5 mt-2">
                {!isCanceled && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleParticipationClick}
                            disabled={buttonState.isDisabled}
                            className={`flex-1 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 flex justify-center items-center ${buttonState.className}`}
                        >
                            {buttonState.text}
                        </button>

                        {(hasJoined || isCreator) && onNavigateToDirectChat && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToDirectChat(match.id);
                                }}
                                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-3 rounded-lg shadow-md hover:brightness-110 transition-all"
                                title="Chat da Partida"
                            >
                                <ChatIcon />
                            </button>
                        )}
                    </div>
                )}
                {isCreator && !isCanceled && (
                    <div className="text-center text-sm text-gray-400 italic pt-2">
                        Você é o organizador desta partida.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchCard;
