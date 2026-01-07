import React, { useState, useEffect } from 'react';
import { Profile } from '../../types';
import { friendshipService } from '../../services/friendshipService';
import ModernLoader from '../ModernLoader';
import { UserIcon } from '../Icons';

interface UserSearchProps {
    currentUser: Profile;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUser }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [friendStatuses, setFriendStatuses] = useState<Record<string, { id: number, status: string, isRequester: boolean } | null>>({});

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 3) {
                setIsLoading(true);
                try {
                    const users = await friendshipService.searchUsers(query, currentUser.id);
                    setResults(users);

                    // Fetch status for each found user
                    const statuses: Record<string, any> = {};
                    for (const user of users) {
                        const status = await friendshipService.getFriendshipStatus(currentUser.id, user.id);
                        statuses[user.id] = status;
                    }
                    setFriendStatuses(statuses);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, currentUser.id]);

    const handleAddFriend = async (userId: string) => {
        try {
            await friendshipService.sendFriendRequest(currentUser.id, userId);
            // Optimistically update status
            setFriendStatuses(prev => ({
                ...prev,
                [userId]: { id: 0, status: 'pending', isRequester: true }
            }));
        } catch (error) {
            alert('Erro ao enviar solicitação.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por nome (min. 3 letras)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-[#0a1628] text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:border-neon-green"
                />
            </div>

            {isLoading && <div className="text-center py-4 text-gray-400">Buscando...</div>}

            <div className="space-y-2">
                {results.map(user => {
                    const status = friendStatuses[user.id];

                    return (
                        <div key={user.id} className="bg-[#112240] p-3 rounded-lg flex items-center justify-between border border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                    {user.photoUrl ? (
                                        <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{user.name}</h4>
                                    <p className="text-xs text-gray-400">{user.city} - {user.state}</p>
                                </div>
                            </div>

                            <div>
                                {status ? (
                                    status.status === 'accepted' ? (
                                        <span className="text-green-500 text-xs font-bold px-3 py-1 bg-green-500/10 rounded-full">Amigo</span>
                                    ) : (
                                        <span className="text-yellow-500 text-xs font-bold px-3 py-1 bg-yellow-500/10 rounded-full">
                                            {status.isRequester ? 'Enviada' : 'Recebida'}
                                        </span>
                                    )
                                ) : (
                                    <button
                                        onClick={() => handleAddFriend(user.id)}
                                        className="bg-neon-green text-black text-xs font-black px-4 py-2 rounded-lg hover:bg-white transition-all shadow-lg active:scale-95 uppercase tracking-tight"
                                    >
                                        Adicionar
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {query.length >= 3 && !isLoading && results.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">Nenhum usuário encontrado.</div>
                )}
            </div>
        </div>
    );
};

export default UserSearch;
