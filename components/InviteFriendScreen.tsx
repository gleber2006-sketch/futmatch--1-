import React from 'react';
import { ShareIcon } from './Icons';

interface InviteFriendScreenProps {
    onBack: () => void;
}

const InviteFriendScreen: React.FC<InviteFriendScreenProps> = ({ onBack }) => {
    // URL única e neutra conforme solicitado
    // URL dinâmica baseada na origem atual (ex: localhost ou vercel.app)
    const appLink = typeof window !== 'undefined' ? `${window.location.origin}/convite` : "https://futmatch.vercel.app/convite";

    // Conteúdo refinado
    const shareTitle = "Convite para jogar no FutMatch ⚽";
    const shareText = "Encontre partidas, jogadores e eventos esportivos perto de você.\n\nSe cadastre e se aqueça para seu próximo jogo!";

    const handleShare = async () => {
        const shareData = {
            title: shareTitle,
            text: `${shareText}\n\n`,
            url: appLink,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback para área de transferência
            try {
                await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${appLink}`);
                alert("Link copiado para a área de transferência!");
            } catch (err) {
                prompt("Copie o link:", appLink);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1b30] text-white p-4 pb-20 animate-fade-in font-sans flex flex-col">
            {/* Header com botão voltar */}
            <div className="flex items-center gap-4 mb-6 pt-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white">
                    Convide um Amigo
                </h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">

                {/* CARD VISUAL */}
                <div className="w-full max-w-sm bg-gradient-to-br from-[#112240] to-[#0a1628] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">

                    {/* Elemento decorativo de fundo */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon-green/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

                    {/* Conteúdo do Card */}
                    <div className="p-8 flex flex-col items-center text-center relative z-10">

                        {/* Logo / Identidade */}
                        <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                            <span className="text-3xl font-black italic tracking-tighter text-white">
                                FUT<span className="text-neon-green">MATCH</span>
                            </span>
                        </div>

                        {/* Título em Destaque */}
                        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
                            Convite para jogar no FutMatch ⚽
                        </h2>

                        {/* Texto Explicativo */}
                        <p className="text-gray-300 text-sm mb-8 leading-relaxed px-2">
                            Encontre partidas, jogadores e eventos esportivos perto de você.
                        </p>

                        {/* Call to Action (Texto fixo solicitado) */}
                        <div className="mb-8 p-3 bg-neon-green/10 border border-neon-green/20 rounded-xl w-full">
                            <p className="text-neon-green font-bold text-sm uppercase tracking-wide">
                                Se cadastre e se aqueça para seu próximo jogo!
                            </p>
                        </div>

                        {/* Link Visual */}
                        <div className="text-gray-500 text-xs font-mono bg-black/30 px-3 py-1 rounded-full mb-2">
                            futmatch.app
                        </div>

                    </div>
                </div>

                {/* Botão de Compartilhamento Nativo */}
                <button
                    onClick={handleShare}
                    className="mt-8 w-full max-w-sm bg-neon-green text-[#0a1628] py-4 rounded-xl font-bold text-lg hover:bg-[#00e686] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,148,0.3)] hover:shadow-[0_0_30px_rgba(0,255,148,0.5)] flex items-center justify-center gap-3 opacity-100"
                >
                    <ShareIcon className="w-6 h-6" />
                    Compartilhar Link
                </button>
            </div>
        </div>
    );
};

export default InviteFriendScreen;
