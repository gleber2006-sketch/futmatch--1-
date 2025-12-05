import React, { useState } from 'react';
import { Match } from '../types';

interface NextMatchWidgetProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
}

const NextMatchWidget: React.FC<NextMatchWidgetProps> = ({ matches, onMatchClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Get upcoming matches (not canceled or finished)
    const upcomingMatches = matches.filter(
        m => m.status !== 'Cancelado' && m.status !== 'Finalizada'
    ).slice(0, 3); // Show max 3 in carousel

    if (upcomingMatches.length === 0) {
        return null;
    }

    const currentMatch = upcomingMatches[currentIndex];

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="px-4 py-4">
            <div
                onClick={() => onMatchClick(currentMatch)}
                className="relative bg-gradient-to-br from-[#1a2332] to-[#0f1824] rounded-2xl p-4 border-2 border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.3)] cursor-pointer hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all overflow-hidden"
            >
                {/* Soccer Field Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="none">
                        {/* Field outline */}
                        <rect x="10" y="10" width="180" height="100" fill="none" stroke="#00ff88" strokeWidth="1" />
                        {/* Center line */}
                        <line x1="100" y1="10" x2="100" y2="110" stroke="#00ff88" strokeWidth="1" />
                        {/* Center circle */}
                        <circle cx="100" cy="60" r="15" fill="none" stroke="#00ff88" strokeWidth="1" />
                        {/* Penalty areas */}
                        <rect x="10" y="35" width="25" height="50" fill="none" stroke="#00ff88" strokeWidth="1" />
                        <rect x="165" y="35" width="25" height="50" fill="none" stroke="#00ff88" strokeWidth="1" />
                        {/* Goals */}
                        <rect x="5" y="50" width="5" height="20" fill="none" stroke="#00ff88" strokeWidth="1" />
                        <rect x="190" y="50" width="5" height="20" fill="none" stroke="#00ff88" strokeWidth="1" />
                    </svg>
                </div>

                {/* Location Pin */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#00ff88" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h3 className="text-white font-bold text-lg mb-3">Próxima Partida</h3>

                    <div className="space-y-2">
                        {/* Date and Time */}
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>{formatDate(currentMatch.date)}</span>
                        </div>

                        {/* Participants */}
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>{currentMatch.filled_slots}/{currentMatch.max_players} jogadores</span>
                        </div>

                        {/* Sport */}
                        <div className="mt-2">
                            <span className="inline-block bg-[#00ff88]/20 text-[#00ff88] px-3 py-1 rounded-full text-xs font-semibold">
                                {currentMatch.sport}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pagination Indicators */}
                {upcomingMatches.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {upcomingMatches.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(index);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-[#00ff88] w-6'
                                        : 'bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NextMatchWidget;
