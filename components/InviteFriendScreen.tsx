import React from 'react';
import { ShareIcon } from './Icons';

interface InviteFriendScreenProps {
    onBack: () => void;
}

const InviteFriendScreen: React.FC<InviteFriendScreenProps> = ({ onBack }) => {
    // URL fixa conforme solicitado
    const appLink = "https://futmatch.app";

    const handleShareWhatsApp = async () => {
        const message = `*Convite para jogar no FutMatch* ⚽\n\nEncontre partidas, jogadores e eventos esportivos perto de você.\n\nSe cadastre e se aqueça para seu próximo jogo!\n${appLink}`;

        // Codifica a mensagem para URL
        const encodedMessage = encodeURIComponent(message);

        // Abre URL do WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

        // Tenta abrir (em mobile deep link, em desktop web)
        window.open(whatsappUrl, '_blank');
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

                    {/* Elemento decorativo de fundo (bola/círculo abstrato) */}
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
                            Convite para jogar no FutMatch
                        </h2>

                        {/* Texto Explicativo */}
                        <p className="text-gray-300 text-sm mb-8 leading-relaxed px-2">
                            Encontre partidas, jogadores e eventos esportivos perto de você.
                        </p>

                        {/* Imagem/Ícone Esportivo Central */}
                        <div className="mb-8 relative">
                            {/* Ícone representando esporte/conexão */}
                            <div className="w-24 h-24 bg-gradient-to-tr from-neon-green to-[#ccff00] rounded-full flex items-center justify-center shadow-lg shadow-neon-green/20 mx-auto">
                                <ShareIcon className="w-10 h-10 text-[#0a1628]" />
                            </div>
                        </div>

                        {/* Call to Action (Texto fixo solicitado) */}
                        <p className="text-neon-green font-bold text-sm uppercase tracking-wide mb-2">
                            Se cadastre e se aqueça para seu próximo jogo!
                        </p>

                        {/* Link Visual */}
                        <div className="text-gray-500 text-xs font-mono bg-black/30 px-3 py-1 rounded-full mb-6">
                            futmatch.app
                        </div>

                    </div>
                </div>

                {/* Botão de Compartilhamento WhatsApp */}
                <button
                    onClick={handleShareWhatsApp}
                    className="mt-8 w-full max-w-sm bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#20bd5a] transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Compartilhar no WhatsApp
                </button>
            </div>
        </div>
    );
};

export default InviteFriendScreen;
