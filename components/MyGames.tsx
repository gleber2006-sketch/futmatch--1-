
import React, { useState } from 'react';
import { Match, Profile } from '../types';
import MatchCard from './MatchCard';
import MatchDetailsModal from './MatchDetailsModal';
import { CreateIcon } from './Icons';

interface MyGamesProps {
  matches: Match[];
  currentUser: Profile;
  joinedMatchIds: Set<number>;
  onJoinMatch: (matchId: number) => Promise<void>;
  onLeaveMatch: (matchId: number) => Promise<void>;
  onEditMatch: (match: Match) => void;
  onNavigateToCreate: () => void;
  onNavigateBack: () => void;
  onNavigateToDirectChat?: (matchId: number) => void;
  onCancelMatch: (matchId: number, reason: string) => Promise<void>;
  onBalanceUpdate?: (amount: number) => void;
  selectedMatch: Match | null;
  onSelectMatch: (match: Match | null) => void;
  onCloseMatchDetails: () => void;
}

const MyGames: React.FC<MyGamesProps> = ({
  matches,
  currentUser,
  joinedMatchIds,
  onJoinMatch,
  onLeaveMatch,
  onEditMatch,
  onNavigateToCreate,
  onNavigateBack,
  onNavigateToDirectChat,
  onCancelMatch,
  onBalanceUpdate,
  selectedMatch,
  onSelectMatch,
  onCloseMatchDetails
}) => {
  const [activeTab, setActiveTab] = useState<'playing' | 'organizing'>('playing');

  const myOrganizedMatches = matches.filter(match => match.created_by === currentUser?.id);

  const myParticipatingMatches = matches.filter(match =>
    joinedMatchIds?.has(match.id) && match.created_by !== currentUser?.id
  );

  const displayedMatches = activeTab === 'organizing' ? myOrganizedMatches : myParticipatingMatches;

  return (
    <div className="bg-gray-900 min-h-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-b-xl shadow-md mb-6 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-white">Meus Jogos</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
        >
          Voltar
        </button>
      </div>

      {/* Main Action Button */}
      <div className="px-4 mb-6">
        <button
          onClick={onNavigateToCreate}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white text-lg font-bold py-4 rounded-xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center"
        >
          <CreateIcon />
          <span className="ml-2">CRIAR PARTIDA</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('playing')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'playing'
            ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border border-gray-500 shadow-md'
            : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
        >
          Jogando ({myParticipatingMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('organizing')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'organizing'
            ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border border-gray-500 shadow-md'
            : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
        >
          Organizando ({myOrganizedMatches.length})
        </button>
      </div>

      {/* Match List */}
      <div className="px-4 space-y-4">
        {displayedMatches.length > 0 ? (
          displayedMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onCardClick={onSelectMatch}
              onJoinMatch={onJoinMatch}
              onLeaveMatch={onLeaveMatch}
              joinedMatchIds={joinedMatchIds}
              currentUser={currentUser}
              onEditMatch={onEditMatch}
              onNavigateToDirectChat={onNavigateToDirectChat}
              className="max-w-md mx-auto"
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-800 border-dashed">
            <p className="text-gray-400 mb-2 text-lg">
              {activeTab === 'organizing'
                ? "Você ainda não organizou nenhuma partida."
                : "Você não está participando de nenhuma partida."}
            </p>
            {activeTab === 'organizing' && (
              <p className="text-sm text-gray-500">
                Clique no botão "Criar Partida" acima para começar!
              </p>
            )}
          </div>
        )}
      </div>

      {selectedMatch && (() => {
        // Always get the latest match data from the matches array
        const currentMatch = matches.find(m => m.id === selectedMatch.id);
        if (!currentMatch) return null;

        return (
          <MatchDetailsModal
            match={currentMatch}
            onClose={onCloseMatchDetails}
            onJoinMatch={onJoinMatch}
            onLeaveMatch={onLeaveMatch}
            onCancelMatch={onCancelMatch}
            joinedMatchIds={joinedMatchIds}
            currentUser={currentUser}
            onEditMatch={onEditMatch}
            onNavigateToDirectChat={onNavigateToDirectChat}
            onBalanceUpdate={onBalanceUpdate}
          />
        );
      })()}
    </div>
  );
};

export default MyGames;
