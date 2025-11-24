
import React, { useState, useEffect } from 'react';
import { Match, VenueLocation, DraftMatchData } from '../types';
import { searchLocalVenues } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { SearchIcon, LocationIcon } from './Icons';
import { SPORTS_LIST } from '../constants';
import { supabase } from '../services/supabaseClient';

interface CreateMatchFormProps {
  onCreateMatch: (match: Omit<Match, 'id' | 'filled_slots' | 'created_by' | 'status' | 'cancellation_reason'>) => Promise<void>;
  onUpdateMatch?: (match: Match) => Promise<void>;
  onCancelEdit?: () => void;
  matchToEdit?: Match | null;
  initialData?: DraftMatchData | null;
  onNavigateBack?: () => void;
}

const CreateMatchForm: React.FC<CreateMatchFormProps> = ({ onCreateMatch, onUpdateMatch, onCancelEdit, matchToEdit, initialData, onNavigateBack }) => {
  const isEditMode = !!matchToEdit;
  
  const [name, setName] = useState('');
  const [sport, setSport] = useState(SPORTS_LIST[0]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState(10);
  const [rules, setRules] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [searchedLat, setSearchedLat] = useState<number | null>(null);
  const [searchedLng, setSearchedLng] = useState<number | null>(null);
  
  const [venueCandidates, setVenueCandidates] = useState<VenueLocation[]>([]);
  
  useEffect(() => {
    if (isEditMode && matchToEdit) {
      setName(matchToEdit.name);
      setSport(matchToEdit.sport);
      setLocation(matchToEdit.location);
      setSearchedLat(matchToEdit.lat);
      setSearchedLng(matchToEdit.lng);
      setVenueCandidates([]);
      
      const matchDate = new Date(matchToEdit.date);
      if (!isNaN(matchDate.getTime())) {
          setDate(matchDate.toISOString().split('T')[0]);
          setTime(matchDate.toTimeString().slice(0, 5));
      }
      
      setSlots(matchToEdit.slots);
      setRules(matchToEdit.rules || '');
    } else if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.sport && SPORTS_LIST.includes(initialData.sport)) setSport(initialData.sport);
      if (initialData.location) setLocation(initialData.location);
      if (initialData.date) setDate(initialData.date);
      if (initialData.time) setTime(initialData.time);
      if (initialData.slots) setSlots(initialData.slots);
      if (initialData.rules) setRules(initialData.rules);
      
      setSearchedLat(null);
      setSearchedLng(null);
      setVenueCandidates([]);
    }
  }, [matchToEdit, isEditMode, initialData]);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => console.log("Error getting location for form", error)
        );
    }
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocation(e.target.value);
      setVenueCandidates([]);
  };

  const handleManualSearch = async () => {
      if (!location) return;
      
      setIsSearching(true);
      setVenueCandidates([]);
      
      try {
          const baseLocation = userLocation 
            ? { latitude: userLocation.lat, longitude: userLocation.lng }
            : { latitude: 0, longitude: 0 };

          const venues = await searchLocalVenues(location, baseLocation);
          
          if (venues && venues.length > 0) {
              setVenueCandidates(venues);
          } else {
             setVenueCandidates([]);
             setSearchedLat(null);
             setSearchedLng(null);
             alert("⚠️ Nenhum local encontrado com esse nome na região.");
          }
      } catch (error) {
          console.error("Erro na busca manual:", error);
      } finally {
          setIsSearching(false);
      }
  };
  
  const selectVenue = (venue: VenueLocation) => {
      setLocation(venue.name);
      setSearchedLat(venue.lat);
      setSearchedLng(venue.lng);
      setVenueCandidates([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !location || !date || !time) {
        alert("Por favor, preencha todos os campos obrigatórios: Nome, Local, Data e Horário.");
        return;
    }

    setIsSubmitting(true);

    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const combinedDate = new Date(year, month - 1, day, hours, minutes);
        
        if (isNaN(combinedDate.getTime())) {
            alert("Data ou horário inválidos.");
            setIsSubmitting(false);
            return;
        }
        
        // TOKENS CHECK FOR CREATION
        if (!isEditMode) {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                const { data: rpcData, error: rpcError } = await supabase.rpc('spend_tokens', {
                    p_user_id: userData.user.id,
                    amount: 3
                });

                if (rpcError) throw rpcError;
                if (rpcData === 'INSUFFICIENT_FUNDS') {
                    alert("Saldo insuficiente de MatchCoins. Você precisa de 3 tokens para criar uma partida.");
                    setIsSubmitting(false);
                    return;
                }
            }
        }
        
        let finalLat = searchedLat ?? (matchToEdit?.lat ?? null);
        let finalLng = searchedLng ?? (matchToEdit?.lng ?? null);

        const locationChanged = !matchToEdit || matchToEdit.location !== location;
        
        if (locationChanged && finalLat === null && userLocation) {
             try {
                const venues = await searchLocalVenues(location, { latitude: userLocation.lat, longitude: userLocation.lng });
                if (venues && venues.length > 0) {
                    finalLat = venues[0].lat;
                    finalLng = venues[0].lng;
                }
            } catch (err) {
                console.warn("Busca automática de local falhou, prosseguindo sem mapa.", err);
            }
        }

        const newMatchData = {
          name,
          sport,
          location,
          lat: finalLat,
          lng: finalLng,
          date: combinedDate,
          slots: Number(slots),
          rules,
        };

        if (isEditMode && onUpdateMatch && matchToEdit) {
          await onUpdateMatch({
            ...matchToEdit,
            ...newMatchData,
          });
        } else {
          await onCreateMatch(newMatchData);
        }
    } catch (e) {
        console.error("Error submitting form", e);
        alert("Ocorreu um erro inesperado ao salvar a partida. Verifique os dados e tente novamente.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200";

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-20">
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-400">
            {isEditMode ? 'Editar Partida ✏️' : 'Criar Nova Pelada ⚽'}
          </h2>
          {onNavigateBack && (
            <button 
                onClick={onNavigateBack}
                className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
            >
                Voltar
            </button>
          )}
      </div>
      
      {!isEditMode && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm flex items-center gap-2">
              <span>⚡</span>
              <span>Custo para criar: <strong>3 MatchCoins</strong></span>
          </div>
      )}

      {initialData && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm text-center animate-fade-in">
              ✨ Formulário pré-preenchido pelo FutMatchBot. Revise os dados abaixo.
          </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Jogo</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="Ex: Futebol de Quinta" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Esporte</label>
          <select value={sport} onChange={e => setSport(e.target.value)} className={inputClasses}>
            {SPORTS_LIST.map(s => (
                <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Local</label>
           <div className="relative flex items-center">
             <input 
                type="text" 
                value={location} 
                onChange={handleLocationChange}
                className={`${inputClasses} pr-12`} 
                placeholder="Ex: Quadra do Parque, Ginásio Municipal" 
                required 
              />
              <button
                type="button"
                onClick={handleManualSearch}
                disabled={isSearching || !location}
                className="absolute right-2 p-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Verificar local no mapa"
              >
                 {isSearching ? <LoadingSpinner size={4} /> : <SearchIcon />}
              </button>
           </div>
           
           {venueCandidates.length > 0 && (
               <div className="mt-2 bg-gray-700 rounded-lg overflow-hidden shadow-lg border border-gray-600 animate-fade-in">
                   <div className="p-2 bg-gray-900/50 text-xs text-gray-400 font-bold uppercase tracking-wider">
                       Selecione uma opção encontrada:
                   </div>
                   <ul>
                       {venueCandidates.map((venue, index) => (
                           <li key={index} className="border-b border-gray-600 last:border-0">
                               <div className="p-3 hover:bg-gray-600 transition-colors flex justify-between items-center">
                                   <div className="flex-1 mr-2">
                                       <p className="font-bold text-white text-sm">{venue.name}</p>
                                       <p className="text-xs text-gray-400 truncate">{venue.address}</p>
                                       {venue.uri && (
                                           <a 
                                             href={venue.uri} 
                                             target="_blank" 
                                             rel="noopener noreferrer" 
                                             className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1 inline-flex items-center"
                                             onClick={(e) => e.stopPropagation()}
                                           >
                                               <LocationIcon /> Ver no Mapa
                                           </a>
                                       )}
                                   </div>
                                   <button
                                     type="button"
                                     onClick={() => selectVenue(venue)}
                                     className="bg-gradient-to-r from-green-600 to-green-400 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md hover:brightness-110 transition-all"
                                   >
                                       Selecionar
                                   </button>
                               </div>
                           </li>
                       ))}
                   </ul>
               </div>
           )}
           
           {!isSearching && venueCandidates.length === 0 && !searchedLat && (
                <p className="text-xs text-gray-400 mt-1">
                    {userLocation ? "💡 Clique na lupa para buscar opções no mapa." : "📍 Ative a localização para melhorar a busca."}
                </p>
           )}
           {searchedLat && venueCandidates.length === 0 && (
               <p className="text-xs text-green-400 mt-1 flex items-center">
                   ✅ Localização confirmada no mapa!
               </p>
           )}
        </div>

        <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} required />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">Horário</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClasses} required />
            </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Número de Jogadores</label>
          <input type="number" value={slots} onChange={e => setSlots(Number(e.target.value))} className={inputClasses} min="2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Regras (opcional)</label>
          <input type="text" value={rules} onChange={e => setRules(e.target.value)} className={inputClasses} placeholder="Ex: 7x7, 10 min por tempo" />
        </div>
        <div className="flex gap-4 pt-4">
          {isEditMode && onCancelEdit && (
            <button 
              type="button" 
              onClick={onCancelEdit} 
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:brightness-110 transition-all flex justify-center items-center"
          >
            {isSubmitting ? (
                 <><LoadingSpinner size={5} /><span className="ml-2">Processando...</span></>
            ) : (
                isEditMode ? 'Salvar Alterações' : 'Criar Partida (3 Tokens)'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMatchForm;
