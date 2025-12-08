import React from 'react';
import { Profile } from '../types';
import {
    ProfileIcon,
    UsersIcon,
    ShareIcon,
    SearchIcon,
    CalendarIcon,
    StarIcon,
    CloseIcon
} from './Icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: Profile | null;
    onNavigateToProfile: () => void;
    onNavigateToFriends: () => void;
    onNavigateToMyGames: () => void;
    onNavigateToCommunity: () => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    currentUser,
    onNavigateToProfile,
    onNavigateToFriends,
    onNavigateToMyGames,
    onNavigateToCommunity,
    onLogout
}) => {

    if (!currentUser) return null;

    const menuItems = [
        {
            icon: <ProfileIcon />,
            title: 'Meu Perfil',
            description: 'Editar informações pessoais, esportes favoritos e preferências.',
            action: () => {
                onNavigateToProfile();
                onClose();
            }
        },
        {
            icon: <UsersIcon />,
            title: 'Amigos',
            description: 'Gerencie vínculos de amizade e solicitações recebidas.',
            action: () => {
                onNavigateToFriends(); // Should ideally open Friends Manager
                onClose();
            }
        },
        {
            icon: <ShareIcon />,
            title: 'Convide um Amigo',
            description: 'Convide pessoas para o FutMatch usando link compartilhável.',
            action: () => {
                const message = `Venha jogar no FutMatch! Crie seu perfil e encontre partidas: https://futmatch.app`;
                if (navigator.share) {
                    navigator.share({
                        title: 'FutMatch',
                        text: message,
                        url: 'https://futmatch.app'
                    }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(message);
                    alert('Link copiado para a área de transferência!');
                }
                onClose();
            }
        },
        {
            icon: <SearchIcon />,
            title: 'Contrate um Jogador/Goleiro',
            description: 'Encontre jogadores disponíveis para completar sua partida.',
            action: () => {
                // Placeholder for now, or use Friends Search
                onNavigateToFriends(); // Redirecting to Friends/Search area for now as it's the closest "Find players" feature
                // In a real scenario this might pass a specific 'tab' param
                onClose();
            }
        },
        {
            icon: <CalendarIcon />,
            title: 'Minhas Partidas',
            description: 'Lista de todas as partidas que você criou ou participa.',
            action: () => {
                onNavigateToMyGames();
                onClose();
            }
        },
        {
            icon: <StarIcon />, // Should be Community Icon? 'UsersIcon' is taken. 
            // In Icons.tsx we have 'UsersIcon' (general) and maybe 'UserIcon'.
            // For Community let's use Star or Heart or maybe reuse Users if appropriate?
            // Wait, Icons.tsx has 'StarIcon' used for Ranking usually. 
            // Let's use 'UsersIcon' for Community as well or check if there is a 'HeartIcon' (Community uses Heart sometimes?).
            // Checking Icons.tsx again... 'HeartIcon' exists (Community).
            // But 'UsersIcon' is better for "Minhas Comunidades" (Groups).
            title: 'Minhas Comunidades',
            description: 'Acesse rapidamente as comunidades que você integra.',
            action: () => {
                onNavigateToCommunity();
                onClose();
            },
            iconComponent: <UsersIcon /> // Overriding since I can't put JSX in 'icon' if I don't import it... wait I imported `UsersIcon`. 
            // I'll just put it in the object.
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            title: 'Configurações',
            description: 'Notificações, privacidade, idioma, conta e preferências gerais.',
            action: () => {
                alert('Configurações em breve!');
                onClose();
            }
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            title: 'Ajuda e Suporte',
            description: 'Acesse tutoriais, FAQ e suporte técnico.',
            action: () => {
                alert('Central de Ajuda em breve!');
                onClose();
            }
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
            title: 'Sair',
            description: 'Encerrar sessão atual.',
            action: () => {
                onLogout();
                onClose();
            },
            isLogout: true
        }
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className={`fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#0a1628] border-r border-white/10 z-[101] shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0d1b30]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden border-2 border-neon-green/30">
                            <img src={currentUser.photoUrl || `https://ui-avatars.com/api/?name=${currentUser.name}`} alt={currentUser.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{currentUser.name}</h3>
                            <p className="text-neon-green text-xs font-semibold">{currentUser.reputation}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="overflow-y-auto h-[calc(100%-88px)] p-4 space-y-2">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all group ${item.isLogout ? 'hover:bg-red-500/10 border border-transparent hover:border-red-500/30' : 'hover:bg-gray-800 border border-transparent hover:border-white/5'}`}
                        >
                            <div className={`${item.isLogout ? 'text-red-500' : 'text-neon-green group-hover:scale-110 transition-transform'}`}>
                                {item.iconComponent || item.icon}
                            </div>
                            <div>
                                <h4 className={`font-bold ${item.isLogout ? 'text-red-400' : 'text-white'}`}>{item.title}</h4>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
