import React, { useState, useEffect } from 'react';

const ModernLoader: React.FC = () => {
    const [currentBallIndex, setCurrentBallIndex] = useState(0);

    // SVGs otimizados das bolas (Football, Basketball, Volleyball, Futsal, Tennis)
    // Usando cores do tema FutMatch e designs simplificados mas reconhecíveis
    const balls = [
        // 1. Futebol (Clássica P&B ou variação moderna)
        <svg key="football" viewBox="0 0 100 100" className="w-12 h-12 animate-pulse" style={{ animationDuration: '0.6s' }}>
            <circle cx="50" cy="50" r="45" fill="white" stroke="#111827" strokeWidth="2" />
            <path d="M50 50 L50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="#111827" /> {/* Hexagono central */}
            <path d="M50 20 L50 5" stroke="#111827" strokeWidth="2" />
            <path d="M75 35 L90 25" stroke="#111827" strokeWidth="2" />
            <path d="M75 65 L90 75" stroke="#111827" strokeWidth="2" />
            <path d="M50 80 L50 95" stroke="#111827" strokeWidth="2" />
            <path d="M25 65 L10 75" stroke="#111827" strokeWidth="2" />
            <path d="M25 35 L10 25" stroke="#111827" strokeWidth="2" />
        </svg>,

        // 2. Basquete (Laranja com linhas pretas)
        <svg key="basketball" viewBox="0 0 100 100" className="w-12 h-12">
            <circle cx="50" cy="50" r="45" fill="#F97316" stroke="#1F2937" strokeWidth="2" />
            <path d="M50 5 L50 95" fill="none" stroke="#1F2937" strokeWidth="2" />
            <path d="M5 50 L95 50" fill="none" stroke="#1F2937" strokeWidth="2" />
            <path d="M20 20 Q 50 50 80 20" fill="none" stroke="#1F2937" strokeWidth="2" />
            <path d="M20 80 Q 50 50 80 80" fill="none" stroke="#1F2937" strokeWidth="2" />
        </svg>,

        // 3. Vôlei (Amarelo e Azul)
        <svg key="volleyball" viewBox="0 0 100 100" className="w-12 h-12">
            <circle cx="50" cy="50" r="45" fill="#FACC15" stroke="#2563EB" strokeWidth="2" />
            <path d="M50 5 Q 70 30 95 30" fill="none" stroke="#2563EB" strokeWidth="2" />
            <path d="M50 95 Q 30 70 5 70" fill="none" stroke="#2563EB" strokeWidth="2" />
            <path d="M5 30 Q 30 30 50 50" fill="none" stroke="#2563EB" strokeWidth="2" />
            <path d="M95 70 Q 70 70 50 50" fill="none" stroke="#2563EB" strokeWidth="2" />
            <path d="M50 5 L50 95" fill="none" stroke="#2563EB" strokeWidth="2" opacity="0.3" />
        </svg>,

        // 4. Futsal (Branca com detalhes vermelhos/azuis)
        <svg key="futsal" viewBox="0 0 100 100" className="w-12 h-12">
            <circle cx="50" cy="50" r="45" fill="#FFFFFF" stroke="#333" strokeWidth="2" />
            <path d="M35 35 L65 35 L80 60 L50 85 L20 60 Z" fill="none" stroke="#DC2626" strokeWidth="3" />
            <circle cx="50" cy="50" r="10" fill="#2563EB" />
        </svg>,

        // 5. Tênis (Verde limão)
        <svg key="tennis" viewBox="0 0 100 100" className="w-12 h-12">
            <circle cx="50" cy="50" r="45" fill="#A3E635" stroke="white" strokeWidth="1" />
            <path d="M15 50 Q 50 20 85 50" fill="none" stroke="white" strokeWidth="3" />
            <path d="M15 50 Q 50 80 85 50" fill="none" stroke="white" strokeWidth="3" />
        </svg>
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBallIndex((prev) => (prev + 1) % balls.length);
        }, 600); // 0.6s

        return () => clearInterval(interval);
    }, [balls.length]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(10, 22, 40, 0.7)', // Fundo escuro semi-transparente
            zIndex: 9999,
        }}>
            <div className="relative flex items-center justify-center">
                {/* Anel de carregamento giratório */}
                <div className="absolute w-24 h-24 border-4 border-gray-600 rounded-full opacity-20"></div>
                <div className="absolute w-24 h-24 border-4 border-t-green-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>

                {/* Bola trocando no centro */}
                <div className="z-10 transition-all duration-300 transform scale-110">
                    {balls[currentBallIndex]}
                </div>
            </div>
        </div>
    );
};

export default ModernLoader;
