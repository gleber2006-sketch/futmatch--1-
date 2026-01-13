import React, { useState, useEffect } from 'react';
import { SearchIcon } from './Icons';
import { supabase } from '../services/supabaseClient';
import { Profile } from '../types';
import ModernLoader from './ModernLoader';
import { CITY_LIST, SPORTS_LIST, SPORT_POSITIONS, AVAILABLE_ROLES, COACH_SPECIALTIES } from '../constants';

interface HirePlayerScreenProps {
    onBack: () => void;
    currentUserId?: string;
    onNavigateToDirectChat: (userId: string) => void;
}

const HirePlayerScreen: React.FC<HirePlayerScreenProps> = ({ onBack, currentUserId, onNavigateToDirectChat }) => {
    const [sport, setSport] = useState('');
    const [position, setPosition] = useState('');
    const [role, setRole] = useState('');
    const [coachSpecialty, setCoachSpecialty] = useState('');
    const [city, setCity] = useState('');
    const [players, setPlayers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Load available positions for the selected sport
    const availablePositions = position ? [] : (SPORT_POSITIONS[sport] || []);

    const handleSearch = async () => {
        setIsLoading(true);
        setHasSearched(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', currentUserId || ''); // Don't show myself

            // Filter by City
            if (city) {
                query = query.eq('city', city);
            }

            // Filter by Sport (Array Clean)
            // Postgres array contains: sport @> {selectedSport}
            if (sport) {
                query = query.contains('sport', [sport]);
            }

            // Filter by Role (Service) or Position
            if (role && role !== 'TODOS') {
                // If a specific role (Juiz, Goleiro, etc) is selected
                query = query.contains('available_roles', [role]);

                // If it's a Coach and a specialty is selected
                if (role === 'Treinador / Coach' && coachSpecialty) {
                    query = query.contains('coach_specialties', [coachSpecialty]);
                }
            } else if (position) {
                // If a specific position is selected
                query = query.contains('position', [position]);
            } else if (role !== 'TODOS') {
                // DEFAULT: Show only users who HAVE at least one service/role
                // This ensures we don't show "normal" players by default
                query = query.not('available_roles', 'is', null)
                    .neq('available_roles', '{}');
            }
            // If role === 'TODOS', don't apply any role/position filter - show all users


            // Order by reputation/points
            query = query.order('points', { ascending: false }).limit(20);

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            setPlayers(data || []);

        } catch (error) {
            console.error("Error fetching players:", error);
            alert(`Erro ao buscar jogadores: ${(error as any).message || 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1b30] text-white p-4 pb-20 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pt-4">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white leading-tight">Contrate & Escale</h1>
            </div>

            <div className="bg-[#0a1628] p-4 rounded-xl border border-white/10 shadow-lg mb-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-neon-green" /> Filtros de Busca
                </h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1 font-bold">Cidade</label>
                            <select
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-neon-green outline-none transition-colors"
                            >
                                <option value="">Todas</option>
                                {CITY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1 font-bold">Esporte</label>
                            <select
                                value={sport}
                                onChange={(e) => {
                                    setSport(e.target.value);
                                    setPosition(''); // Reset position when sport changes
                                }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-neon-green outline-none transition-colors"
                            >
                                <option value="">Todos os Esportes</option>
                                {SPORTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1 font-bold">O que você precisa?</label>
                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                if (e.target.value) setPosition(''); // Clear position if role is selected
                                if (e.target.value !== 'Treinador / Coach') setCoachSpecialty(''); // Reset specialty
                            }}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:border-neon-green outline-none transition-colors mb-2"
                        >
                            <option value="">Buscar Jogador (Por Posição)</option>
                            <option value="TODOS">🔍 Todos os Usuários</option>
                            {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        {/* Special select for Coach Specialties */}
                        {role === 'Treinador / Coach' && (
                            <select
                                value={coachSpecialty}
                                onChange={(e) => setCoachSpecialty(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-neon-green outline-none transition-colors mb-2 animate-fade-in"
                            >
                                <option value="">Qualquer Especialidade</option>
                                {COACH_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}

                        {/* Only show position select if no specific role is selected */}
                        {!role && (
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-neon-green outline-none transition-colors"
                            >
                                <option value="">Qualquer Posição</option>
                                {SPORT_POSITIONS[sport]?.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        )}
                    </div>

                    <button
                        onClick={handleSearch}
                        className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                    >
                        {isLoading ? <ModernLoader /> : (
                            <>
                                <SearchIcon className="w-5 h-5" />
                                {role === 'TODOS' ? 'Buscar Todos os Usuários' : role ? `Buscar ${role}` : 'Buscar Jogadores'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {!hasSearched && (
                    <div className="text-center py-8 text-gray-500 text-sm bg-gray-800/30 rounded-xl border border-white/5">
                        <p>Selecione os filtros acima para encontrar<br />jogadores e profissionais na sua região.</p>
                    </div>
                )}

                {hasSearched && players.length === 0 && !isLoading && (
                    <div className="text-center py-10">
                        <p className="text-gray-400">Nenhum profissional encontrado com esses filtros.</p>
                        <p className="text-gray-600 text-xs mt-2">Tente mudar a cidade ou liberar a posição.</p>
                    </div>
                )}

                {players.map(player => (
                    <div key={player.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-md flex items-center gap-4 animate-fade-in group hover:border-neon-green/30 transition-colors">
                        <div className="relative">
                            <img
                                src={player.photo_url || (player as any).photoUrl || `https://ui-avatars.com/api/?name=${player.name}`}
                                alt={player.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-600 group-hover:border-neon-green transition-colors"
                            />
                            {player.reputation === 'Craque' && (
                                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                    ★
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-white font-bold truncate pr-2 text-lg">{player.name}</h3>
                                {player.points > 0 && <span className="text-neon-green text-xs font-bold bg-green-900/30 px-2 py-0.5 rounded flex items-center gap-1">⚡ {player.points}</span>}
                            </div>

                            <p className="text-gray-400 text-xs truncate">
                                {player.city || 'Cidade não informada'} • {player.reputation}
                            </p>

                            <div className="flex flex-wrap gap-1 mt-2">
                                {/* Prioritize showing the searched role if user has it */}
                                {role && player.available_roles?.includes(role) && (
                                    <>
                                        <span className="bg-yellow-500/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 font-bold uppercase">
                                            {role}
                                        </span>
                                        {role === 'Treinador / Coach' && player.coach_specialties?.map(s => (
                                            <span key={s} className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded border border-blue-500/30 font-bold uppercase ml-1">
                                                {s}
                                            </span>
                                        ))}
                                    </>
                                )}
                                {/* Show positions otherwise */}
                                {!role && player.position?.slice(0, 3).map(p => (
                                    <span key={p} className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded border border-gray-600">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => onNavigateToDirectChat(player.id)}
                            className="bg-[#112240] hover:bg-neon-green hover:text-[#0a1628] text-neon-green border border-neon-green/30 p-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                            title="Conversar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default HirePlayerScreen;
