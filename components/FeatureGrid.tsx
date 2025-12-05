import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, subtitle, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="bg-gradient-to-br from-[#1a2332] to-[#0f1824] rounded-xl p-4 border-2 border-[#00ff88]/40 shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.4)] hover:border-[#00ff88]/60 transition-all duration-300 flex flex-col items-start gap-2 min-h-[110px]"
        >
            <div className="text-[#00ff88] mb-1">
                {icon}
            </div>
            <h3 className="text-white font-bold text-sm text-left">{title}</h3>
            <p className="text-gray-400 text-xs text-left line-clamp-2">{subtitle}</p>
        </button>
    );
};

interface FeatureGridProps {
    onNavigateToCreate: () => void;
    onRefreshMatches?: () => Promise<void>;
    onScrollToMatches?: () => void;
    onNavigateToMyGames: () => void;
    onNavigateToCommunity: () => void;
    onNavigateToRanking: () => void;
    onNavigateToArenas: () => void;
    onNavigateToMatchChat: () => void;
    onNavigateToNotifications: () => void;
}

const FeatureGrid: React.FC<FeatureGridProps> = ({
    onNavigateToCreate,
    onRefreshMatches,
    onScrollToMatches,
    onNavigateToMyGames,
    onNavigateToCommunity,
    onNavigateToRanking,
    onNavigateToArenas,
    onNavigateToMatchChat,
    onNavigateToNotifications
}) => {
    const features = [
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="currentColor" strokeWidth="2" />
                    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            title: 'Criar Partida',
            subtitle: 'Criar criar partida ou o Soccer tempo',
            onClick: onNavigateToCreate
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            title: 'Encontre Partidas',
            subtitle: 'Encontre partidas para partidas de encontro',
            onClick: () => {
                onRefreshMatches?.();
                onScrollToMatches?.();
            }
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            title: 'Meus Jogos',
            subtitle: 'Meus uis jogos e nosos jogadores',
            onClick: onNavigateToMyGames
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
                    <circle cx="18" cy="8" r="2" fill="currentColor" />
                </svg>
            ),
            title: 'Comunidade',
            subtitle: 'Comunidade pode as comunidades',
            onClick: onNavigateToCommunity
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="currentColor" strokeWidth="2" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 22h16" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="currentColor" strokeWidth="2" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            title: 'Ranking',
            subtitle: 'Conseguir um pontario de medal e e rankings',
            onClick: onNavigateToRanking
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" />
                    <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            title: 'Campos e Arenas',
            subtitle: 'Completa em campos e arenas e stadiumentos',
            onClick: onNavigateToArenas
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            title: 'Chat',
            subtitle: 'Conseguir uma accos de outros',
            onClick: onNavigateToMatchChat
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            title: 'Notificações',
            subtitle: 'Notificações ao caspa de eventa',
            onClick: onNavigateToNotifications
        }
    ];

    return (
        <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                    <FeatureCard
                        key={index}
                        icon={feature.icon}
                        title={feature.title}
                        subtitle={feature.subtitle}
                        onClick={feature.onClick}
                    />
                ))}
            </div>
        </div>
    );
};

export default FeatureGrid;
