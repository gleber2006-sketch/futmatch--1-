import React from 'react';
import { Team } from '../types';
import TeamLogo from './TeamLogo';

interface TeamInviteCardProps {
    team: Team;
    inviteLink: string;
    onClose?: () => void;
}

const TeamInviteCard: React.FC<TeamInviteCardProps> = ({ team, inviteLink, onClose }) => {
    const catchPhrase = "O manto te espera. Venha jogar conosco!";

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        alert("Link de convite copiado!");
    };

    return (
        <div className="flex flex-col items-center animate-fade-in-up">
            {/* The Card */}
            <div className="relative w-full max-w-[320px] bg-gradient-to-br from-[#0a1628] to-[#112240] rounded-[2rem] p-6 sm:p-8 border-2 border-green-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group origin-top scale-[0.85] sm:scale-100 transition-transform duration-300">

                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>

                {/* Badge/Shield Design */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                            <TeamLogo
                                logoUrl={team.logo_url}
                                teamName={team.name}
                                size="large"
                                className="h-24 w-24 border-4 border-[#0a1628] shadow-2xl relative z-10"
                            />
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white text-center mb-2 tracking-tight uppercase">
                        {team.name}
                    </h3>

                    <div className="h-1 w-12 bg-green-500 rounded-full mb-6"></div>

                    <p className="text-gray-300 text-center text-sm font-medium leading-relaxed mb-8 px-2 italic">
                        "{catchPhrase}"
                    </p>

                    {/* QR Code / Visual Link Area */}
                    <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-3">
                        <div className="w-20 h-20 bg-white p-1 rounded-lg">
                            {/* Simulated QR Code for visual flair */}
                            <div className="w-full h-full bg-black flex flex-wrap p-0.5">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div key={i} className={`w-1/4 h-1/4 ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                                ))}
                            </div>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono break-all text-center px-4 opacity-70">
                            {inviteLink.replace('https://', '')}
                        </div>
                    </div>
                </div>

                {/* Card Glow Effect */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
            </div>

            {/* Actions Below Card */}
            <div className="mt-8 flex gap-3 w-full max-w-[320px]">
                <button
                    onClick={handleCopy}
                    className="flex-1 bg-gray-700/50 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                    🔗 Copiar Link
                </button>
                <button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Acesse meu time no FutMatch: ${inviteLink}`)}`, '_blank')}
                    className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-green-900/20"
                >
                    📲
                </button>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="mt-6 text-gray-500 hover:text-white text-sm font-bold transition-colors"
                >
                    VOLTAR
                </button>
            )}
        </div>
    );
};

export default TeamInviteCard;
