import React from 'react';
import { Profile } from '../types';
import {
    ProfileIcon,
    UsersIcon,
    ShareIcon,
    SearchIcon,
    CalendarIcon,
    StarIcon,
    CloseIcon,
    WalletIcon,
    BellIcon,
    HelpIcon,
    SettingsIcon,
    LogoutIcon,
    ChatIcon,
    LocationIcon,
    LockIcon
} from './Icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: Profile | null;
    onNavigateToProfile: () => void;
    onNavigateToFriends: () => void;
    onNavigateToInvite: () => void;
    onNavigateToHire: () => void;
    onNavigateToSettings: () => void;
    onNavigateToSupport: () => void;
    onNavigateToMyGames: () => void;
    onNavigateToCommunity: () => void;
    onNavigateToNotifications: () => void;
    onNavigateToWallet: () => void;
    onNavigateToRanking: () => void;
    onNavigateToArenas: () => void;
    onNavigateToMatchChat: () => void;
    unreadDMsCount?: number;
    pendingFriendRequestsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    currentUser,
    onNavigateToProfile,
    onNavigateToFriends,
    onNavigateToInvite,
    onNavigateToHire,
    onNavigateToSettings,
    onNavigateToSupport,
    onNavigateToMyGames,
    onNavigateToCommunity,
    onNavigateToNotifications,
    onNavigateToWallet,
    onNavigateToRanking,
    onNavigateToArenas,
    onNavigateToMatchChat,
    onLogout,
    unreadDMsCount = 0,
    pendingFriendRequestsCount = 0
}) => {

    // if (!currentUser) return null; // MOVED CHECK DOWN or REMOVED to debug visibility

    const sections: { title: string; items: { icon: any; title: string; action: () => void; disabled?: boolean; isLogout?: boolean; badge?: number | string; }[] }[] = [
        {
            title: "Conta",
            items: [
                {
                    icon: <ProfileIcon />,
                    title: 'Meu Perfil',
                    action: () => { onNavigateToProfile(); onClose(); }
                },
                /* Temporarily disabled options
                {
                    icon: <CalendarIcon />,
                    title: 'Meus Jogos',
                    action: () => { onNavigateToMyGames(); onClose(); }
                },
                {
                    icon: <LockIcon />,
                    title: 'Minhas Partidas Privadas',
                    action: () => { onNavigateToMyGames(); onClose(); }
                },
                {
                    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                    title: 'Convites Recebidos',
                    action: () => { },
                    disabled: true
                }
                */
            ]
        },
        {
            title: "Social",
            items: [
                {
                    icon: <UsersIcon />,
                    title: 'Amigos',
                    action: () => { onNavigateToFriends(); onClose(); },
                    badge: pendingFriendRequestsCount > 0 ? pendingFriendRequestsCount : undefined
                },
                {
                    icon: <ChatIcon />,
                    title: 'Mensagens',
                    action: () => { onNavigateToMatchChat(); onClose(); },
                    badge: unreadDMsCount > 0 ? unreadDMsCount : undefined
                },
                {
                    icon: <StarIcon />,
                    title: 'Comunidade',
                    action: () => { onNavigateToCommunity(); onClose(); }
                }
            ]
        },
        {
            title: "Serviços",
            items: [
                {
                    icon: <SearchIcon />,
                    title: 'Contrate um Jogador',
                    action: () => { onNavigateToHire(); onClose(); }
                },
                {
                    icon: <LocationIcon />,
                    title: 'Campos e Arenas',
                    action: () => { onNavigateToArenas(); onClose(); }
                }
            ]
        },
        {
            title: "Sistema",
            items: [
                {
                    icon: <BellIcon />,
                    title: 'Notificações',
                    action: () => { onNavigateToNotifications(); onClose(); }
                },
                {
                    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                    title: 'Ranking',
                    action: () => { onNavigateToRanking(); onClose(); }
                },
                {
                    icon: <WalletIcon />,
                    title: 'Carteira FutMatch',
                    action: () => { onNavigateToWallet(); onClose(); }
                }
            ]
        },
        {
            title: "Outros",
            items: [
                {
                    icon: <ShareIcon />,
                    title: 'Convide um Amigo',
                    action: () => { onNavigateToInvite(); onClose(); }
                },
                {
                    icon: <LogoutIcon className="text-red-500" />,
                    title: 'Sair',
                    action: () => { onLogout(); onClose(); },
                    isLogout: true
                }
            ]
        }
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div
                style={{ zIndex: 99999, display: isOpen ? 'flex' : 'none' }}
                className={`fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#0a1628] border-r border-white/10 z-[9999] shadow-2xl transform transition-transform duration-300 overflow-hidden flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0d1b30] flex-shrink-0">
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
                <div className="overflow-y-auto flex-1 p-4 pb-20 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {sections.map((section, secIndex) => (
                        <div key={secIndex} className="mb-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">{section.title}</h4>
                            <div className="space-y-1">
                                {section.items.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={item.disabled ? undefined : item.action}
                                        disabled={item.disabled}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all ${item.disabled
                                            ? 'opacity-40 cursor-not-allowed'
                                            : item.isLogout
                                                ? 'hover:bg-red-500/10 border border-transparent hover:border-red-500/30'
                                                : 'hover:bg-gray-800 border border-transparent hover:border-white/5'
                                            }`}
                                    >
                                        <div className={`${item.isLogout ? 'text-red-500' : 'text-neon-green'}`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <h4 className={`font-medium text-sm ${item.isLogout ? 'text-red-400' : 'text-gray-200'}`}>{item.title}</h4>
                                            {item.badge && (
                                                <span className="bg-[#00FF94] text-[#0a1628] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_0_8px_rgba(0,255,148,0.4)]">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
