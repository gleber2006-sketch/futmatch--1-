import React, { useEffect, useState } from 'react';
import { Friendship, Profile } from '../../types';
import { friendshipService } from '../../services/friendshipService';

interface FriendRequestsProps {
    currentUser: Profile;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({ currentUser }) => {
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
            {/* Incoming Requests */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Recebidas ({incoming.length})</h3>
                {incoming.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Nenhuma solicitação pendente.</p>
                ) : (
                    <div className="space-y-3">
                        {incoming.map(req => (
                            <div key={req.id} className="bg-[#112240] p-3 rounded-lg flex items-center justify-between border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                        {req.requester?.photoUrl ? (
                                            <img src={req.requester.photoUrl} alt={req.requester.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{req.requester?.name}</h4>
                                        <p className="text-xs text-yellow-400">Quer ser seu amigo</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAccept(req.id)} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors shadow-lg" aria-label="Aceitar">✔️</button>
                                    <button onClick={() => handleDecline(req.id)} className="bg-red-500/30 hover:bg-red-600 text-white p-2 rounded-lg transition-colors border-2 border-red-500/50 shadow-lg" aria-label="Recusar">❌</button>
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
                            <div key={req.id} className="bg-[#112240] p-3 rounded-lg flex items-center justify-between border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                        {req.receiver?.photoUrl ? (
                                            <img src={req.receiver.photoUrl} alt={req.receiver?.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{req.receiver?.name}</h4>
                                    </div>
                                </div>
                                <button onClick={() => handleCancel(req.id)} className="text-gray-300 hover:text-white text-[10px] font-bold uppercase bg-gray-700 hover:bg-gray-600 px-2 py-1.5 rounded border border-white/10 transition-colors">Cancelar</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendRequests;
