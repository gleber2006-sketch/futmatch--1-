import React, { useEffect, useState } from 'react';
import { Friendship, Profile } from '../../types';
import { friendshipService } from '../../services/friendshipService';
import { ChatIcon } from '../Icons'; // Assuming ChatIcon exists

interface FriendListProps {
    currentUser: Profile;
}

const FriendList: React.FC<FriendListProps> = ({ currentUser }) => {
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
                // friendProfile might be undefined if join failed, though unlikely with correct foreign keys

                if (!friendProfile) return null;

                return (
                    <div key={friendship.id} className="bg-[#112240] p-3 rounded-lg flex items-center justify-between border border-gray-700 hover:border-gray-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden border-2 border-neon-green/30">
                                {friendProfile.photoUrl ? (
                                    <img src={friendProfile.photoUrl} alt={friendProfile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{friendProfile.name}</h4>
                                <p className="text-xs text-neon-green font-semibold">{friendProfile.reputation}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Future: Chat button */}
                            {/* <button className="text-gray-400 hover:text-white p-2" title="Conversar"><ChatIcon /></button> */}

                            <button
                                onClick={() => handleRemove(friendship.id, friendProfile.name || 'Usuário')}
                                className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-all shadow-lg active:scale-95"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FriendList;
