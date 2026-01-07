import React, { useEffect, useState } from 'react';
import { Friendship, Profile } from '../../types';
import { friendshipService } from '../../services/friendshipService';
import { ChatIcon } from '../Icons'; // Assuming ChatIcon exists

interface FriendListProps {
    currentUser: Profile;
    onViewPublicProfile?: (userId: string) => void;
    onNavigateToDirectChat?: (userId: string) => void;
}

const FriendList: React.FC<FriendListProps> = ({ currentUser, onViewPublicProfile, onNavigateToDirectChat }) => {
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFriends = async () => {
        setIsLoading(true);
        try {
            const data = await friendshipService.getFriends(currentUser.id);
            setFriends(data);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, [currentUser.id]);

    const handleRemove = async (id: number, name: string) => {
        if (!window.confirm(`Tem certeza que deseja remover ${name} dos seus amigos?`)) return;

        try {
            await friendshipService.removeFriend(id);
            fetchFriends();
        } catch (error) {
            alert('Erro ao remover amigo.');
        }
    };

    if (isLoading) return <div className="text-center py-8 text-gray-400">Carregando amigos...</div>;

    if (friends.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">😢</p>
                <p>Você ainda não tem amigos adicionados.</p>
                <p className="text-sm mt-2">Use a busca para encontrar sua galera!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-2">{friends.length} amigos encontrados</p>
            {friends.map(friendship => {
                // Determine which profile is the friend (not the current user)
                // In getFriends service, we map both. We check against currentUser.id to see who is who.
                // However, the service returns 'requester' and 'receiver' objects.
                // We need to know which ID belongs to the friend.

                const isRequester = friendship.requester_id === currentUser.id;
                const friendProfile = isRequester ? friendship.receiver : friendship.requester;
                const friendId = isRequester ? friendship.receiver_id : friendship.requester_id;

                if (!friendProfile) return null;

                return (
                    <div
                        key={friendship.id}
                        onClick={() => onViewPublicProfile?.(friendId)}
                        className="bg-[#112240] p-3 rounded-lg flex items-center justify-between border border-gray-700 hover:border-neon-green/50 transition-colors cursor-pointer group/item"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden border-2 border-neon-green/30 group-hover/item:border-neon-green transition-all">
                                {friendProfile.photoUrl ? (
                                    <img src={friendProfile.photoUrl} alt={friendProfile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-white group-hover/item:text-neon-green transition-colors">{friendProfile.name}</h4>
                                <p className="text-xs text-neon-green font-semibold">{friendProfile.reputation}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => onNavigateToDirectChat?.(friendId)}
                                className="bg-[#00FF94] hover:bg-[#00e686] text-black text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all shadow-lg active:scale-95 flex items-center gap-1"
                            >
                                <ChatIcon /> Chat
                            </button>
                            <button
                                onClick={() => handleRemove(friendship.id, friendProfile.name || 'Usuário')}
                                className="text-gray-500 hover:text-red-400 p-2 transition-colors"
                                title="Remover amigo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FriendList;
