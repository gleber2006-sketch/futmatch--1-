import React, { useEffect, useState } from 'react';
import { ShareIcon } from './Icons';
import ModernLoader from './ModernLoader';

interface InviteLandingScreenProps {
    onGoToLogin: () => void;
    onGoToRegister: () => void;
}

const InviteLandingScreen: React.FC<InviteLandingScreenProps> = ({ onGoToLogin, onGoToRegister }) => {
    // Add a small delay/animation to make it feel premium
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsReady(true), 100);
    }, []);

    if (!isReady) return <div className="min-h-screen bg-[#0a1628] flex items-center justify-center"><ModernLoader /></div>;

    return (
        <div className="min-h-screen bg-[#0d1b30] text-white p-6 font-sans flex flex-col items-center justify-center relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-green/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">

                {/* Logo */}
                <div className="mb-10 animate-fade-in-down">
                    <span className="text-4xl font-black italic tracking-tighter text-white drop-shadow-lg">
                        FUT<span className="text-neon-green">MATCH</span>
                    </span>
                </div>

                {/* Main Content Card */}
                <div className="bg-gradient-to-br from-[#112240] to-[#0a1628] p-8 rounded-3xl border border-white/10 shadow-2xl w-full animate-fade-in-up">

                    <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                        <span className="text-4xl">⚽</span>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
                        Você foi convidado para jogar no FutMatch ⚽
                    </h1>

                    <p className="text-gray-300 mb-8 leading-relaxed">
                        Encontre partidas, jogadores e eventos esportivos perto de você.
                    </p>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 mb-8">
                        <p className="text-neon-green font-bold text-sm uppercase tracking-wide">
                            Se cadastre e se aqueça para seu próximo jogo!
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={onGoToRegister}
                            className="w-full bg-neon-green text-[#0a1628] py-4 rounded-xl font-bold text-lg hover:bg-[#bbe000] transition-transform transform hover:scale-[1.02] shadow-lg shadow-neon-green/20"
                        >
                            Criar conta
                        </button>

                        <button
                            onClick={onGoToLogin}
                            className="w-full bg-transparent border-2 border-white/10 text-white py-4 rounded-xl font-bold text-lg hover:bg-white/5 hover:border-white/20 transition-all"
                        >
                            Já tenho conta (Entrar)
                        </button>
                    </div>

                </div>

                <p className="mt-8 text-xs text-gray-500">
                    Junte-se a milhares de jogadores.
                </p>

            </div>
        </div>
    );
};

export default InviteLandingScreen;
