import { Ranking, Profile } from '../types';
import { friendshipService } from '../services/friendshipService';

interface RankingListProps {
    rankings: Ranking[];
    currentUser?: Profile | null;
    onNavigateBack?: () => void;
}

const RankingList: React.FC<RankingListProps> = ({ rankings, currentUser, onNavigateBack }) => {
    const [friendStatuses, setFriendStatuses] = React.useState<Record<string, { id: number, status: string, isRequester: boolean } | null>>({});

    React.useEffect(() => {
        const fetchStatuses = async () => {
            if (!currentUser || rankings.length === 0) return;
            try {
                const statusPromises = rankings
                    .filter(item => item.user.id !== currentUser.id)
                    .map(async item => {
                        const status = await friendshipService.getFriendshipStatus(currentUser.id, item.user.id);
                        return { userId: item.user.id, status };
                    });

                const results = await Promise.all(statusPromises);
                const statusMap: Record<string, any> = {};
                results.forEach(res => {
                    statusMap[res.userId] = res.status;
                });
                setFriendStatuses(statusMap);
            } catch (err) {
                console.error("Error fetching friendship statuses in ranking:", err);
            }
        };
        fetchStatuses();
    }, [rankings, currentUser]);

    const handleAddFriend = async (userId: string) => {
        if (!currentUser) return;
        try {
            await friendshipService.sendFriendRequest(currentUser.id, userId);
            setFriendStatuses(prev => ({
                ...prev,
                [userId]: { id: 0, status: 'pending', isRequester: true }
            }));
        } catch (error) {
            console.error("Error sending friend request from ranking:", error);
            alert('Erro ao enviar solicitação.');
        }
    };

    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return <span className="text-gray-500 font-bold">{rank}</span>;
    };

    return (
        <div>
            <div className="flex items-center justify-between bg-[#0a1628]/95 backdrop-blur-md p-4 rounded-xl shadow-lg mb-4 border border-white/5 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-neon-green drop-shadow-[0_0_5px_rgba(0,255,148,0.5)]">Ranking</h2>
                {onNavigateBack && (
                    <button
                        onClick={onNavigateBack}
                        className="bg-white/10 text-white py-1 px-3 rounded-lg text-sm hover:bg-white/20 transition-all border border-white/10"
                    >
                        Voltar
                    </button>
                )}
            </div>

            <div className="bg-[#112240]/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/5">
                <h2 className="text-2xl font-bold text-center mb-2 text-white drop-shadow-md">Top Jogadores</h2>
                <p className="text-xs text-gray-400 text-center mb-6">
                    Pontuação: <span className="text-neon-green font-bold">+3</span> por criar partida · <span className="text-neon-blue font-bold">+1</span> por jogar
                </p>
                <div className="space-y-4">
                    {rankings.map((item) => (
                        <div
                            key={item.user.id}
                            className={`flex items-center p-3 rounded-xl transition-all duration-300 border ${item.rank <= 3
                                ? 'bg-gradient-to-r from-[#0a1628] to-[#112240] border-neon-green/30 shadow-[0_0_15px_rgba(0,255,148,0.1)]'
                                : 'bg-[#0a1628]/50 border-white/5 hover:bg-[#0a1628]/80 hover:border-white/20'
                                }`}
                        >
                            <div className={`text-2xl font-bold w-10 text-center ${item.rank === 1 ? 'scale-125 drop-shadow-lg' : ''}`}>
                                {getMedal(item.rank)}
                            </div>
                            <img
                                src={item.user.photoUrl || `https://ui-avatars.com/api/?name=${item.user.name}&background=random`}
                                alt={item.user.name}
                                className={`w-12 h-12 rounded-full ml-4 object-cover ${item.rank === 1 ? 'border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                                    item.rank === 2 ? 'border-2 border-gray-300' :
                                        item.rank === 3 ? 'border-2 border-orange-400' :
                                            'border border-white/10'
                                    }`}
                            />
                            <div className="ml-4 flex-grow">
                                <p className={`font-semibold ${item.rank <= 3 ? 'text-white' : 'text-gray-300'}`}>{item.user.name}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {item.stats
                                        ? <span className="flex gap-2">
                                            <span className="text-neon-green/80">★ {item.stats.created} criadas</span>
                                            <span>·</span>
                                            <span className="text-neon-blue/80">⚽ {item.stats.played} jogadas</span>
                                        </span>
                                        : `${item.points.toLocaleString('pt-BR')} pontos`
                                    }
                                </p>
                            </div>
                            <div className="text-right ml-4">
                                <div className="text-lg font-bold text-neon-green whitespace-nowrap drop-shadow-[0_0_5px_rgba(0,255,148,0.3)]">
                                    {item.points} pts
                                </div>
                                {currentUser && item.user.id !== currentUser.id && (
                                    <div className="mt-2 text-right">
                                        {friendStatuses[item.user.id] ? (
                                            friendStatuses[item.user.id]?.status === 'accepted' ? (
                                                <span className="text-green-400 text-[10px] font-black uppercase tracking-tighter opacity-80">Amigo</span>
                                            ) : (
                                                <span className="text-yellow-500 text-[10px] font-black uppercase tracking-tighter bg-yellow-500/10 px-2 py-1 rounded-lg">
                                                    {friendStatuses[item.user.id]?.isRequester ? 'Enviada' : 'Recebida'}
                                                </span>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => handleAddFriend(item.user.id)}
                                                className="bg-[#00FF94] text-black text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-lg hover:bg-white transition-all shadow-lg active:scale-95"
                                            >
                                                Adicionar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {rankings.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Ainda não há jogadores ranqueados.</p>
                            <p className="text-xs mt-1">Crie ou participe de partidas para pontuar!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RankingList;
