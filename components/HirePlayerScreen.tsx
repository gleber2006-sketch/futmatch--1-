import React, { useState } from 'react';
import { SearchIcon } from './Icons';

interface HirePlayerScreenProps {
    onBack: () => void;
}

const HirePlayerScreen: React.FC<HirePlayerScreenProps> = ({ onBack }) => {
    const [sport, setSport] = useState('Futebol');
    const [position, setPosition] = useState('');

    return (
        <div className="min-h-screen bg-[#0d1b30] text-white p-4 pb-20 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pt-4">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white leading-tight">Contrate um Jogador</h1>
            </div>

            <div className="bg-[#0a1628] p-4 rounded-xl border border-white/10 shadow-lg mb-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Filtros de Busca</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Esporte</label>
                        <select
                            value={sport}
                            onChange={(e) => setSport(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:border-neon-green outline-none transition-colors"
                        >
                            <option>Futebol</option>
                            <option>Futsal</option>
                            <option>Society</option>
                            <option>Vôlei</option>
                            <option>Basquete</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Posição</label>
                        <select
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:border-neon-green outline-none transition-colors"
                        >
                            <option value="">Qualquer Posição</option>
                            <option value="Goleiro">Goleiro</option>
                            <option value="Zagueiro">Zagueiro</option>
                            <option value="Meia">Meia</option>
                            <option value="Atacante">Atacante</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Disponibilidade</label>
                        <select
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:border-neon-green outline-none transition-colors"
                        >
                            <option>Qualquer dia</option>
                            <option>Hoje</option>
                            <option>Amanhã</option>
                            <option>Fim de Semana</option>
                        </select>
                    </div>

                    <button className="w-full bg-neon-green text-[#0a1628] font-bold py-3 rounded-lg hover:bg-[#ccff00] transition-colors flex items-center justify-center gap-2 mt-2">
                        <SearchIcon className="w-5 h-5" />
                        Buscar Jogadores
                    </button>
                </div>
            </div>

            <div className="text-center py-10">
                <p className="text-gray-500 text-sm">Nenhum jogador encontrado com esses filtros por enquanto.</p>
            </div>
        </div>
    );
};

export default HirePlayerScreen;
