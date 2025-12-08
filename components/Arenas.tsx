
import React, { useState, useEffect, useRef } from 'react';
import { Arena, DraftMatchData } from '../types';
import { supabase } from '../services/supabaseClient';
import { LocationIcon, CloseIcon, CreateIcon } from './Icons';
import ModernLoader from './ModernLoader';
import { SPORTS_LIST, CITY_LIST } from '../constants';
import { findVenueImage, searchLocalVenues } from '../services/geminiService';

declare var L: any;

// Imagem padrão atualizada (Supabase Storage Asset)
const DEFAULT_ARENA_BANNER = "https://healydbigtttfbrorbwy.supabase.co/storage/v1/object/public/futmatch-assets/futmatch-banner.png";

interface ArenasProps {
    onNavigateBack: () => void;
    onDraftFromArena: (data: DraftMatchData) => void;
}

const Arenas: React.FC<ArenasProps> = ({ onNavigateBack, onDraftFromArena }) => {
    const [arenas, setArenas] = useState<Arena[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedArena, setSelectedArena] = useState<Arena | null>(null);

    const [arenaCoords, setArenaCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [viewMode, setViewMode] = useState<'photo' | 'map'>('photo');
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [isLoadingCoords, setIsLoadingCoords] = useState(false);

    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState('all');
    const [sportFilter, setSportFilter] = useState('all');

    useEffect(() => {
        fetchArenas();
    }, []);

    useEffect(() => {
        if (selectedArena) {
            setViewMode('photo');
            setArenaCoords(null);
            fetchArenaCoordinates(selectedArena);
        }
    }, [selectedArena]);

    useEffect(() => {
        if (viewMode === 'map' && arenaCoords && mapRef.current && typeof L !== 'undefined') {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }

            try {
                const map = L.map(mapRef.current).setView([arenaCoords.lat, arenaCoords.lng], 16);
                mapInstance.current = map;

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);

                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-md text-lg">🏟️</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32]
                });

                L.marker([arenaCoords.lat, arenaCoords.lng], { icon }).addTo(map)
                    .bindPopup(`<b>${selectedArena?.name}</b><br>${selectedArena?.address}`).openPopup();

            } catch (e) {
                console.error("Error initializing Leaflet map:", e);
            }
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [viewMode, arenaCoords, selectedArena]);

    const fetchArenaCoordinates = async (arena: Arena) => {
        setIsLoadingCoords(true);
        try {
            const query = `${arena.name}, ${arena.city}`;
            const results = await searchLocalVenues(query, { latitude: -23.55, longitude: -46.63 });

            if (results && results.length > 0) {
                setArenaCoords({ lat: results[0].lat, lng: results[0].lng });
            }
        } catch (e) {
            console.warn("Could not fetch coordinates for arena:", e);
        } finally {
            setIsLoadingCoords(false);
        }
    };

    const fetchArenas = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('arenas')
                .select('*')
                .order('is_partner', { ascending: false })
                .order('name', { ascending: true });

            if (error) throw error;

            if (data) {
                setArenas(data);
                // Optional: You can keep or remove updateMissingImages depending on if you want 
                // the system to try and find real images eventually. 
                // For now, I'll keep it as it improves data quality over time, 
                // but the UI immediately uses the fallback below.
                updateMissingImages(data);
            }
        } catch (error: any) {
            console.error("Error fetching arenas:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const updateMissingImages = async (currentArenas: Arena[]) => {
        const missing = currentArenas.filter(a => !a.banner_url);
        if (missing.length === 0) return;

        for (const arena of missing) {
            try {
                const imageUrl = await findVenueImage(arena.name, arena.city);

                if (imageUrl) {
                    setArenas(prev => prev.map(p => p.id === arena.id ? { ...p, banner_url: imageUrl } : p));

                    await supabase
                        .from('arenas')
                        .update({ banner_url: imageUrl })
                        .eq('id', arena.id);
                }
            } catch (err) {
                console.warn(`Failed to auto-update image for ${arena.name}`, err);
            }
        }
    };

    const handleCardClick = (arena: Arena) => {
        setSelectedArena(arena);
    };

    const handleCreateMatchClick = () => {
        if (!selectedArena) return;

        let sportToUse = '';
        if (sportFilter !== 'all' && selectedArena.sports.includes(sportFilter)) {
            sportToUse = sportFilter;
        } else if (selectedArena.sports.length === 1) {
            sportToUse = selectedArena.sports[0];
        }

        const draftData: DraftMatchData = {
            location: `${selectedArena.name}${selectedArena.address ? ` - ${selectedArena.address}` : ''}`,
            sport: sportToUse,
        };

        onDraftFromArena(draftData);
    };

    const filteredArenas = arenas.filter(arena => {
        const matchesSearch =
            arena.name.toLowerCase().includes(search.toLowerCase()) ||
            (arena.neighborhood && arena.neighborhood.toLowerCase().includes(search.toLowerCase()));
        const matchesCity = cityFilter === 'all' || arena.city === cityFilter;
        const matchesSport = sportFilter === 'all' || (arena.sports && arena.sports.includes(sportFilter));

        return matchesSearch && matchesCity && matchesSport;
    });

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.currentTarget;
        // Prevent infinite loop if default image also fails
        if (target.src !== DEFAULT_ARENA_BANNER) {
            target.onerror = null;
            target.src = DEFAULT_ARENA_BANNER;
        }
    };

    return (
        <div className="bg-gray-900 min-h-full pb-20">
            <div className="flex items-center justify-between bg-gray-800 p-4 rounded-b-xl shadow-md mb-4 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white">Campos & Arenas</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
                >
                    Voltar
                </button>
            </div>

            <div className="px-4 mb-6 space-y-3">
                <input
                    type="text"
                    placeholder="Buscar por nome ou bairro..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="flex-1 bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                        <option value="all">Todas Cidades</option>
                        {CITY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        value={sportFilter}
                        onChange={(e) => setSportFilter(e.target.value)}
                        className="flex-1 bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                        <option value="all">Todas Modalidades</option>
                        {SPORTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-10"><ModernLoader /></div>
                ) : filteredArenas.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        <p>Nenhuma arena encontrada com esses filtros.</p>
                    </div>
                ) : (
                    filteredArenas.map(arena => (
                        <div
                            key={arena.id}
                            onClick={() => handleCardClick(arena)}
                            className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="h-44 w-full relative bg-gray-700">
                                <img
                                    src={arena.banner_url || DEFAULT_ARENA_BANNER}
                                    alt={arena.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={handleImageError}
                                />

                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300"></div>

                                {arena.is_partner && (
                                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                                        <span>★ Parceira</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-white font-bold text-lg mb-1 leading-tight">{arena.name}</h3>
                                <p className="text-gray-400 text-xs mb-3 flex items-start gap-1">
                                    <div className="mt-0.5"><LocationIcon /></div>
                                    <span>
                                        {arena.neighborhood ? `${arena.neighborhood}, ` : ''}{arena.city}
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3 mt-auto">
                                    {arena.sports?.slice(0, 3).map(s => (
                                        <span key={s} className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded-full border border-gray-600">
                                            {s}
                                        </span>
                                    ))}
                                    {arena.sports && arena.sports.length > 3 && (
                                        <span className="text-gray-500 text-[10px] px-1">+{arena.sports.length - 3}</span>
                                    )}
                                </div>
                                {arena.price_info && (
                                    <p className="text-green-400 font-bold text-sm pt-2 border-t border-gray-700">{arena.price_info}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedArena && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
                    onClick={() => setSelectedArena(null)}
                >
                    <div
                        className="bg-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setViewMode(prev => prev === 'photo' ? 'map' : 'photo');
                                }}
                                className={`p-2 rounded-full shadow-md transition-all ${viewMode === 'map' ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-800 hover:bg-white'}`}
                                title={viewMode === 'photo' ? "Ver Mapa" : "Ver Foto"}
                                disabled={!arenaCoords && !isLoadingCoords}
                            >
                                {isLoadingCoords ? '...' : (viewMode === 'photo' ? '🗺️' : '🖼️')}
                            </button>

                            <button
                                onClick={() => setSelectedArena(null)}
                                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="h-56 bg-gray-700 relative">
                            {viewMode === 'map' && arenaCoords ? (
                                <div ref={mapRef} className="w-full h-full z-10" />
                            ) : (
                                <img
                                    src={selectedArena.banner_url || DEFAULT_ARENA_BANNER}
                                    alt={selectedArena.name}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                />
                            )}

                            {viewMode === 'map' && !arenaCoords && !isLoadingCoords && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 text-white z-10 p-4 text-center">
                                    <p>Mapa indisponível para este local.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-1">{selectedArena.name}</h2>
                            <p className="text-gray-400 text-sm mb-4 flex items-start gap-1">
                                <div className="mt-1"><LocationIcon /></div>
                                <span>
                                    {selectedArena.address}, {selectedArena.neighborhood}<br />
                                    {selectedArena.city} - {selectedArena.state}
                                </span>
                            </p>

                            {selectedArena.location_link && (
                                <a
                                    href={selectedArena.location_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold underline mb-6 inline-block"
                                >
                                    Ver no Google Maps ↗
                                </a>
                            )}

                            <div className="mb-6">
                                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Modalidades</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedArena.sports?.map(s => (
                                        <span key={s} className="bg-gray-700 text-white text-xs px-3 py-1 rounded-full border border-gray-600">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Valores</h3>
                                <p className="text-green-400 font-bold text-lg">{selectedArena.price_info || 'Sob consulta'}</p>
                            </div>

                            {selectedArena.phone && (
                                <div className="mb-2">
                                    <p className="text-gray-300 text-sm">📞 {selectedArena.phone}</p>
                                </div>
                            )}

                            {selectedArena.whatsapp && (
                                <a
                                    href={`https://wa.me/${selectedArena.whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all block text-center mb-4"
                                >
                                    Chamar no WhatsApp
                                </a>
                            )}

                            <button
                                onClick={handleCreateMatchClick}
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:brightness-110 transition-all flex justify-center items-center gap-2"
                            >
                                <CreateIcon /> Criar Partida nesta Arena
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
          }
        `}</style>
        </div>
    );
};

export default Arenas;
