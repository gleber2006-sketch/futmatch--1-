import React from 'react';
import { MatchParticipant, Profile } from '../types';
import { supabase } from '../services/supabaseClient';

interface MatchParticipantsListProps {
    participants: MatchParticipant[];
    currentUserId: string;
    isCreator: boolean;
    onStatusChange: (userId: string, newStatus: MatchParticipant['status']) => Promise<void>;
    onRemove: (userId: string) => Promise<void>;
}

const ParticipantItem: React.FC<{
    participant: MatchParticipant;
    isCreator: boolean;
    currentUserId: string;
    onStatusChange: (userId: string, newStatus: MatchParticipant['status']) => Promise<void>;
    onRemove: (userId: string) => Promise<void>;
}> = ({ participant, isCreator, currentUserId, onStatusChange, onRemove }) => {
    const isMe = participant.user_id === currentUserId;

    return (
        <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg mb-2">
            <div className="flex items-center gap-3">
                <img
                    src={participant.profile.photoUrl || `https://ui-avatars.com/api/?name=${participant.profile.name}`}
                    alt={participant.profile.name}
                    className="w-10 h-10 rounded-full border-2 border-gray-600"
                />
                <div>
                    <p className="text-white font-semibold text-sm flex items-center gap-2">
                        {participant.profile.name}
                        {isMe && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Você</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                        {new Date(participant.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {isCreator && !isMe && (
                <div className="flex gap-2">
                    {participant.status === 'pending' && (
                        <>
                            <button
                                onClick={() => onStatusChange(participant.user_id, 'confirmed')}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500"
                            >
                                Aceitar
                            </button>
                            <button
                                onClick={() => onStatusChange(participant.user_id, 'declined')}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500"
                            >
                                Recusar
                            </button>
                        </>
                    )}
                    {participant.status === 'confirmed' && (
                        <button
                            onClick={() => onRemove(participant.user_id)}
                            className="text-xs text-red-400 hover:text-red-300"
                            title="Remover jogador"
                        >
                            Remover
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const MatchParticipantsList: React.FC<MatchParticipantsListProps> = ({
    participants,
    currentUserId,
    isCreator,
    onStatusChange,
    onRemove
}) => {
    const confirmed = participants.filter(p => p.status === 'confirmed');
    const pending = participants.filter(p => p.status === 'pending');
    const waitlist = participants.filter(p => p.status === 'waitlist').sort((a, b) => (a.waitlist_position || 0) - (b.waitlist_position || 0));

    return (
        <div className="space-y-6">
            {/* Pending Requests (Host Only) */}
            {isCreator && pending.length > 0 && (
                <div>
                    <h4 className="text-yellow-400 text-sm font-bold mb-2 uppercase">Solicitações Pendentes ({pending.length})</h4>
                    {pending.map(p => (
                        <ParticipantItem
                            key={p.user_id}
                            participant={p}
                            isCreator={isCreator}
                            currentUserId={currentUserId}
                            onStatusChange={onStatusChange}
                            onRemove={onRemove}
                        />
                    ))}
                </div>
            )}

            {/* Confirmed Players */}
            <div>
                <h4 className="text-green-400 text-sm font-bold mb-2 uppercase">Confirmados ({confirmed.length})</h4>
                {confirmed.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Nenhum jogador confirmado ainda.</p>
                ) : (
                    confirmed.map(p => (
                        <ParticipantItem
                            key={p.user_id}
                            participant={p}
                            isCreator={isCreator}
                            currentUserId={currentUserId}
                            onStatusChange={onStatusChange}
                            onRemove={onRemove}
                        />
                    ))
                )}
            </div>

            {/* Waitlist */}
            {waitlist.length > 0 && (
                <div>
                    <h4 className="text-orange-400 text-sm font-bold mb-2 uppercase">Lista de Espera ({waitlist.length})</h4>
                    {waitlist.map((p, index) => (
                        <div key={p.user_id} className="relative">
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full text-orange-500 font-bold text-xs">
                                #{p.waitlist_position || index + 1}
                            </div>
                            <ParticipantItem
                                participant={p}
                                isCreator={isCreator}
                                currentUserId={currentUserId}
                                onStatusChange={onStatusChange}
                                onRemove={onRemove}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatchParticipantsList;
