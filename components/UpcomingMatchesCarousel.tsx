import React, { useRef } from 'react';
import { Match } from '../types';

interface UpcomingMatchesCarouselProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
}

const UpcomingMatchesCarousel: React.FC<UpcomingMatchesCarouselProps> = ({ matches, onMatchClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const upcomingMatches = matches
        .filter(m => m.status !== 'Cancelado' && m.status !== 'Finalizada')
        .slice(0, 10);

    if (upcomingMatches.length === 0) {
        return null;
    }

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-lg">Partidas Próximas</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {upcomingMatches.map((match) => (
                    <button
                        key={match.id}
                        onClick={() => onMatchClick(match)}
                        className="flex-shrink-0 w-[140px] bg-gradient-to-br from-[#1a2332] to-[#0f1824] rounded-xl p-3 border border-[#00ff88]/30 hover:border-[#00ff88]/60 hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
                    >
                        {/* Team Badges */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {/* Team 1 Badge */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold border-2 border-blue-400">
                                {match.sport.substring(0, 2).toUpperCase()}
                            </div>

                            {/* VS */}
                            <span className="text-gray-400 text-xs font-bold">vs</span>

                            {/* Team 2 Badge */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white text-xs font-bold border-2 border-green-400">
                                {match.sport.substring(0, 2).toUpperCase()}
                            </div>
                        </div>

                        {/* Match Info */}
                        <div className="text-center">
                            <p className="text-white text-xs font-semibold truncate mb-1">{match.name}</p>
                            <p className="text-gray-400 text-[10px]">
                                {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </p>
                            <p className="text-[#00ff88] text-[10px] font-semibold mt-1">
                                {match.filled_slots}/{match.max_players}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
};

export default UpcomingMatchesCarousel;
