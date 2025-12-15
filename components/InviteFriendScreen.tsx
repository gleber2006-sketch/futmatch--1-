import React, { useState } from 'react';
import { generateInviteCode } from '../utils/inviteCode';
import { ShareIcon, CopyIcon } from './Icons';

interface InviteFriendScreenProps {
    onBack: () => void;
}

const InviteFriendScreen: React.FC<InviteFriendScreenProps> = ({ onBack }) => {
    const [copied, setCopied] = useState(false);
    const inviteLink = `https://futmatch.app/invite?code=${generateInviteCode()}`; // Exemplo de link gerado

    const handleShare = async () => {
        const message = `Venha jogar no FutMatch! Crie seu perfil e encontre partidas: ${inviteLink}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'FutMatch',
                    text: message,
                    url: inviteLink
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            handleCopy();
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0d1b30] text-white p-4 pb-20 animate-fade-in font-sans">
            <div className="flex items-center gap-4 mb-6 pt-4">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-blue-400 bg-clip-text text-transparent">
                    Convide um Amigo
                </h1>
            </div>

            <div className="flex flex-col items-center justify-center space-y-8 mt-10">
                <div className="bg-gradient-to-br from-[#0a1628] to-[#112240] p-8 rounded-2xl border border-white/10 shadow-xl w-full max-w-sm text-center">
                    <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShareIcon className="w-10 h-10 text-neon-green" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Chame a galera!</h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Convide seus amigos para jogar no FutMatch e ganhe reputação na comunidade.
                    </p>

                    <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between mb-6 border border-white/5">
                        <span className="text-xs text-gray-300 truncate w-48">{inviteLink}</span>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                            title="Copiar Link"
                        >
                            {copied ? <span className="text-neon-green text-xs font-bold">Copiado!</span> : <CopyIcon className="w-5 h-5 text-gray-400" />}
                        </button>
                    </div>

                    <button
                        onClick={handleShare}
                        className="w-full bg-neon-green text-[#0a1628] py-3 rounded-xl font-bold hover:bg-[#ccff00] transition-colors flex items-center justify-center gap-2"
                    >
                        <ShareIcon className="w-5 h-5" />
                        Compartilhar Link
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteFriendScreen;
