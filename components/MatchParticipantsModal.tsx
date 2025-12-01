import React, { useState } from 'react';
import { Match, Profile, MatchParticipant } from '../types';
import { CloseIcon, UsersIcon } from './Icons';

interface MatchParticipantsModalProps {
    match: Match;
    currentUser: Profile;
    onClose: () => void;
    onApproveParticipant?: (matchId: number, userId: string) => Promise<void>;
    onDeclineParticipant?: (matchId: number, userId: string) => Promise<void>;
    onRemoveParticipant?: (matchId: number, userId: string) => Promise<void>;
    onPromoteFromWaitlist?: (matchId: number, userId: string) => Promise<void>;
}

const MatchParticipantsModal: React.FC<MatchParticipantsModalProps> = ({
    match,
    currentUser,
    onClose,
    onApproveParticipant,
    onDeclineParticipant,
    onRemoveParticipant,
    onPromoteFromWaitlist,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const isHost = match.created_by === currentUser.id;

    // Separar participantes por status
    const confirmedParticipants = match.match_participants?.filter(p => p.status === 'confirmed') || [];
    const pendingParticipants = match.match_participants?.filter(p => p.status === 'pending') || [];
    const waitlistParticipants = match.match_participants?.filter(p => p.status === 'waitlist')
        .sort((a, b) => (a.waitlist_position || 0) - (b.waitlist_position || 0)) || [];

    const handleAction = async (action: () => Promise<void>) => {
        setIsProcessing(true);
        try {
            await action();
        } catch (error) {
            console.error('Erro ao processar ação:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const ParticipantItem: React.FC<{ participant: MatchParticipant; showActions?: boolean; waitlistPosition?: number }> = ({
        participant,
        showActions = false,
        waitlistPosition
    }) => {
        const profile = participant.profiles;
        const joinedDate = participant.joined_at ? new Date(participant.joined_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        return (
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                    {waitlistPosition !== undefined && (
                        <div className="flex items-center justify-center w-8 h-8 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-bold">
                            {waitlistPosition}
                        </div>
                    )}
                    <img
                        src={profile?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=random`}
                        alt={profile?.name || 'Participante'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                    />
                    <div className="flex-1">
                        <p className="font-medium text-white">{profile?.name || 'Jogador'}</p>
                        {joinedDate && (
                            <p className="text-xs text-gray-400">Entrou em {joinedDate}</p>
                        )}
                    </div>
                </div>

                {showActions && isHost && !isProcessing && (
                    <div className="flex gap-2">
                        {participant.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => handleAction(() => onApproveParticipant!(match.id, participant.user_id))}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                                >
                                    Aprovar
                                </button>
                                <button
                                    onClick={() => handleAction(() => onDeclineParticipant!(match.id, participant.user_id))}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                                >
                                    Recusar
                                </button>
                            </>
                        )}
                        {participant.status === 'waitlist' && (
                            <button
                                onClick={() => handleAction(() => onPromoteFromWaitlist!(match.id, participant.user_id))}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                                disabled={match.filled_slots >= match.max_players}
                            >
                                Aceitar
                            </button>
                        )}
                        {participant.status === 'confirmed' && participant.user_id !== match.created_by && (
                            <button
                                onClick={() => handleAction(() => onRemoveParticipant!(match.id, participant.user_id))}
                                className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                        aria-label="Fechar"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-full">
                            <UsersIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Participantes</h2>
                            <p className="text-green-100 text-sm">
                                {match.filled_slots} / {match.max_players} jogadores
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Confirmados */}
                    {confirmedParticipants.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Confirmados ({confirmedParticipants.length})
                            </h3>
                            <div className="space-y-2">
                                {confirmedParticipants.map((participant) => (
                                    <ParticipantItem
                                        key={participant.user_id}
                                        participant={participant}
                                        showActions={isHost}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pendentes (apenas para partidas privadas) */}
                    {pendingParticipants.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                Aguardando Aprovação ({pendingParticipants.length})
                            </h3>
                            <div className="space-y-2">
                                {pendingParticipants.map((participant) => (
                                    <ParticipantItem
                                        key={participant.user_id}
                                        participant={participant}
                                        showActions={isHost}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de Espera */}
                    {waitlistParticipants.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                Lista de Espera ({waitlistParticipants.length})
                            </h3>
                            <div className="space-y-2">
                                {waitlistParticipants.map((participant, index) => (
                                    <ParticipantItem
                                        key={participant.user_id}
                                        participant={participant}
                                        showActions={isHost}
                                        waitlistPosition={index + 1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mensagem quando não há participantes */}
                    {confirmedParticipants.length === 0 && pendingParticipants.length === 0 && waitlistParticipants.length === 0 && (
                        <div className="text-center py-12">
                            <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">Nenhum participante ainda</p>
                            <p className="text-gray-500 text-sm mt-2">Seja o primeiro a entrar nesta partida!</p>
                        </div>
                    )}
                </div>

                {/* Footer com informações */}
                {isHost && (pendingParticipants.length > 0 || waitlistParticipants.length > 0) && (
                    <div className="bg-gray-800/50 p-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400 text-center">
                            💡 Como anfitrião, você pode aprovar, recusar ou remover participantes
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchParticipantsModal;
