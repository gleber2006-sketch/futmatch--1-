import React from 'react';
import { Profile } from '../types';

interface ExploreHeaderProps {
    currentUser: Profile;
    onNavigateToProfile: () => void;
    onNavigateToWallet: () => void;
    onOpenSidebar: () => void;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({ currentUser, onNavigateToProfile, onNavigateToWallet, onOpenSidebar }) => {
    return (
        <div className="sticky top-0 z-50 bg-[#0a1628]/95 backdrop-blur-md px-4 py-3 shadow-lg border-b border-white/5">
            <div className="max-w-md mx-auto flex items-center justify-between">
                <div className="flex items-center">
                    {/* Menu Button */}
                    <button
                        onClick={() => {
                            console.log('Hamburger clicked');
                            // window.alert('Menu clicado via ExploreHeader'); // Debug visual for user
                            onOpenSidebar();
                        }}
                        className="mr-3 p-1 rounded-md hover:bg-white/10 transition-colors text-white"
                        aria-label="Menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(0,255,148,0.5)]">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00FF94" />
                            <path d="M2 17L12 22L22 17" stroke="#00FF94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="#00FF94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-white font-bold text-xl tracking-wide">FutMatch</span>
                    </div>
                </div>

                {/* Right Side: Profile Icon + MatchCoins */}
                <div className="flex items-center gap-3">
                    {/* MatchCoins Badge */}
                    <button
                        onClick={onNavigateToWallet}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg hover:brightness-110 transition-all border border-yellow-400/30"
                    >
                        <span className="text-sm drop-shadow-md">⚡</span>
                        <span>{currentUser.matchCoins}</span>
                    </button>

                    {/* Profile Icon */}
                    <button
                        onClick={onNavigateToProfile}
                        className="w-9 h-9 rounded-full bg-gray-800 p-0.5 border border-neon-green/50 hover:border-neon-green transition-all shadow-[0_0_10px_rgba(0,255,148,0.2)]"
                    >
                        <img
                            src={currentUser.photoUrl || `https://ui-avatars.com/api/?name=${currentUser.name}`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExploreHeader;
