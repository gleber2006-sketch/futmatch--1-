
import React from 'react';
import { Ranking } from '../types';

interface RankingListProps {
  rankings: Ranking[];
  onNavigateBack?: () => void;
}

const RankingList: React.FC<RankingListProps> = ({ rankings, onNavigateBack }) => {
    
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="text-gray-500 font-bold">{rank}</span>;
  };

  return (
    <div>
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl shadow-lg mb-4">
            <h2 className="text-xl font-bold text-green-400">Ranking</h2>
            {onNavigateBack && (
                 <button 
                    onClick={onNavigateBack}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
                >
                    Voltar
                </button>
            )}
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-2 text-green-400">Top Jogadores</h2>
        <p className="text-xs text-gray-400 text-center mb-6">
            Pontuação: <span className="text-green-300 font-bold">+3</span> por criar partida · <span className="text-blue-300 font-bold">+1</span> por jogar
        </p>
        <div className="space-y-4">
            {rankings.map((item) => (
            <div
                key={item.user.id}
                className="flex items-center bg-gray-700/50 p-3 rounded-lg transition-all duration-300 hover:bg-gray-700 hover:shadow-md"
            >
                <div className="text-2xl font-bold w-10 text-center">{getMedal(item.rank)}</div>
                <img
                src={item.user.photoUrl || `https://ui-avatars.com/api/?name=${item.user.name}&background=random`}
                alt={item.user.name}
                className="w-12 h-12 rounded-full ml-4 border-2 border-gray-600 object-cover"
                />
                <div className="ml-4 flex-grow">
                <p className="font-semibold text-white">{item.user.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                    {item.stats 
                        ? <span className="flex gap-2">
                            <span className="text-green-200/70">★ {item.stats.created} criadas</span>
                            <span>·</span>
                            <span className="text-blue-200/70">⚽ {item.stats.played} jogadas</span>
                        </span>
                        : `${item.points.toLocaleString('pt-BR')} pontos`
                    }
                </p>
                </div>
                <div className="text-lg font-bold text-green-400 whitespace-nowrap">
                {item.points} pts
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
