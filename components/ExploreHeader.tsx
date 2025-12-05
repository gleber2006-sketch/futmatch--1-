import React from 'react';
import { Profile } from '../types';

interface ExploreHeaderProps {
    currentUser: Profile;
    onNavigateToProfile: () => void;
    onNavigateToWallet: () => void;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({ currentUser, onNavigateToProfile, onNavigateToWallet }) => {
    return (
        <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0a1628] to-[#162238] px-4 py-3 shadow-lg">
            <div className="max-w-md mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00ff88" />
                        <path d="M2 17L12 22L22 17" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-white font-bold text-xl">FutMatch</span>
                </div>

                {/* Right Side: Profile Icon + MatchCoins */}
                <div className="flex items-center gap-3">
                    {/* Profile Icon */}
                    <button
                        onClick={onNavigateToProfile}
                        className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                    >
                        <img
                            src={currentUser.photoUrl || `https://ui-avatars.com/api/?name=${currentUser.name}`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </button>

                    {/* MatchCoins Badge */}
                    <button
                        onClick={onNavigateToWallet}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg hover:brightness-110 transition-all"
                    >
                        <span className="text-sm">⚡</span>
                        <span>{currentUser.matchCoins}</span>
                        <span className="hidden sm:inline text-[10px]">MatchCoins</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExploreHeader;
