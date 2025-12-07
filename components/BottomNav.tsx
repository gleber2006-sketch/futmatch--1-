
import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { ExploreIcon, CreateIcon, RankingIcon, ProfileIcon } from './Icons';

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  // Neon Style Logic
  const activeClasses = 'text-neon-green drop-shadow-[0_0_8px_rgba(0,255,148,0.6)] scale-110';
  const inactiveClasses = 'text-gray-300 hover:text-white hover:scale-105';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${isActive ? activeClasses : inactiveClasses}`}
    >
      <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100 text-neon-green' : 'opacity-85'}`}>
        {label}
      </span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-[#0a1628]/95 backdrop-blur-md border-t border-white/10 h-20 flex justify-around items-center z-50 transition-transform duration-300 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] ${isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
      <NavItem
        label="Explorar"
        icon={<ExploreIcon />}
        isActive={activePage === 'explore'}
        onClick={() => onNavigate('explore')}
      />
      <NavItem
        label="Criar Partida"
        icon={<CreateIcon />}
        isActive={activePage === 'create'}
        onClick={() => onNavigate('create')}
      />
      <NavItem
        label="Ranking"
        icon={<RankingIcon />}
        isActive={activePage === 'ranking'}
        onClick={() => onNavigate('ranking')}
      />
      <NavItem
        label="Meu Perfil"
        icon={<ProfileIcon />}
        isActive={activePage === 'profile'}
        onClick={() => onNavigate('profile')}
      />
    </nav>
  );
};

export default BottomNav;
