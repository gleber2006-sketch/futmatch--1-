import React, { useEffect, useState } from 'react';
import { Friendship, Profile } from '../../types';
import { friendshipService } from '../../services/friendshipService';

interface FriendRequestsProps {
    currentUser: Profile;
    onViewPublicProfile?: (userId: string) => void;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({ currentUser, onViewPublicProfile }) => {
    const [incoming, setIncoming] = useState<Friendship[]>([]);
    const [outgoing, setOutgoing] = useState<Friendship[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const [inData, outData] = await Promise.all([
                friendshipService.getPendingRequests(currentUser.id),
                friendshipService.getSentRequests(currentUser.id)
            ]);
            setIncoming(inData);
            setOutgoing(outData);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentUser.id]);

    const handleAccept = async (id: number) => {
        await friendshipService.respondToFriendRequest(id, 'accept');
        fetchRequests();
    };

    const handleDecline = async (id: number) => {
        if (!window.confirm("Deseja recusar esta solicitação?")) return;
        await friendshipService.respondToFriendRequest(id, 'decline');
        fetchRequests();
    };

    const handleCancel = async (id: number) => {
        if (!window.confirm("Cancelar solicitação?")) return;
        await friendshipService.removeFriend(id); // removeFriend deletes the row, working for cancel too
        fetchRequests();
    };

    if (isLoading) return <div className="text-center py-8 text-gray-400">Carregando solicitações...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={fetchRequests}
                    className="text-[10px] font-black uppercase tracking-tighter bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10 transition-all active:scale-95"
                >
                    🔄 Atualizar
                </button>
            </div>
            {/* Incoming Requests */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Recebidas ({incoming.length})</h3>
                {incoming.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Nenhuma solicitação pendente.</p>
                ) : (
                    <div className="space-y-3">
                        {incoming.map(req => (
                            <div
                                key={req.id}
                                onClick={() => onViewPublicProfile?.(req.requester_id)}
                                className="bg-[#112240] p-3 rounded-lg flex items-center justify-between border border-gray-700 hover:border-yellow-500/30 transition-colors cursor-pointer group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/10 group-hover/item:border-yellow-500 transition-all">
                                        {req.requester?.photoUrl ? (
                                            <img src={req.requester.photoUrl} alt={req.requester.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm group-hover/item:text-yellow-400 transition-colors">{req.requester?.name}</h4>
                                        <p className="text-xs text-yellow-400">Quer ser seu amigo</p>
                                    </div>
                                </div>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleAccept(req.id)} className="bg-[#00FF94] hover:bg-white text-black text-[10px] font-black px-3 py-2 rounded-lg transition-all shadow-lg uppercase">ACEITAR</button>
                                    <button onClick={() => handleDecline(req.id)} className="bg-gray-700 hover:bg-red-600 text-white text-[10px] font-black px-3 py-2 rounded-lg transition-all border border-white/20 shadow-lg uppercase">RECUSAR</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Outgoing Requests */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Enviadas ({outgoing.length})</h3>
                {outgoing.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Você não enviou solicitações recentemente.</p>
                ) : (
                    <div className="space-y-3">
                        {outgoing.map(req => (
                            <div
                                key={req.id}
                                onClick={() => onViewPublicProfile?.(req.receiver_id)}
                                className="bg-[#112240] p-3 rounded-lg flex items-center justify-between border border-gray-700 hover:border-neon-green/30 transition-colors cursor-pointer group/item"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/10 group-hover/item:border-neon-green transition-all">
                                        {req.receiver?.photoUrl ? (
                                            <img src={req.receiver.photoUrl} alt={req.receiver?.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm group-hover/item:text-neon-green transition-colors">{req.receiver?.name}</h4>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleCancel(req.id)} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white text-[9px] font-black uppercase px-3 py-1.5 rounded border border-red-500/30 transition-all">Cancelar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendRequests;
