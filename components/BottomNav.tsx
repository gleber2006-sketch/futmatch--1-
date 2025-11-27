
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
  const activeClasses = 'text-green-500';
  const inactiveClasses = 'text-gray-400 hover:text-white';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className="text-xs font-medium mt-1">{label}</span>
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
    <nav className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 h-20 flex justify-around items-center z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'
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
