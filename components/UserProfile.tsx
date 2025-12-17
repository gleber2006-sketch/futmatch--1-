
import React, { useState, useEffect, useRef } from 'react';
import { Profile, Team } from '../types';
import { StarIcon, TrophyIcon, EditIcon } from './Icons';
import { supabase } from '../services/supabaseClient';
import ModernLoader from './ModernLoader';
import { SPORTS_LIST, SPORT_POSITIONS, BRAZILIAN_TEAMS, CITY_LIST } from '../constants';
import FriendsManager from './Friends/FriendsManager';
import { friendshipService } from '../services/friendshipService';
import { teamService } from '../services/teamService';
import CreateTeamModal from './CreateTeamModal';
import TeamDetailsModal from './TeamDetailsModal';

interface UserProfileProps {
    user: Profile;
    onUpdateUser: (user: Profile) => Promise<void>;
    onLogout: () => void;
    onNavigateBack?: () => void;
    initialSection?: 'details' | 'friends';
}

const calculateAge = (dob: string | null): number | string => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser, onLogout, onNavigateBack, initialSection = 'details' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        ...user,
        city: user.city || 'Sorocaba',
        state: user.state || 'SP',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || '',
        sport: user.sport || [],
        position: user.position || [],
        bannerUrl: user.bannerUrl || '',
        favoriteTeam: user.favoriteTeam || '',
        favoriteTeamLogoUrl: user.favoriteTeamLogoUrl || ''
    });
    const [availablePositions, setAvailablePositions] = useState<string[]>([]);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showFriendsManager, setShowFriendsManager] = useState(initialSection === 'friends');
    const [friendCount, setFriendCount] = useState(0);
    const [myTeams, setMyTeams] = useState<(Team & { role: 'admin' | 'member' })[]>([]);
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

    const isOwnProfile = true;

    useEffect(() => {
        if (user.id) {
            teamService.getUserTeams(user.id).then(setMyTeams).catch(console.error);
        }
    }, [user.id]);

    const handleTeamCreated = () => {
        // Refresh teams list
        if (user.id) {
            teamService.getUserTeams(user.id).then(setMyTeams).catch(console.error);
        }
    };

    useEffect(() => {
        if (initialSection === 'friends') {
            setShowFriendsManager(true);
        } else {
            setShowFriendsManager(false);
        }
    }, [initialSection]);

    useEffect(() => {
        const fetchFriendCount = async () => {
            try {
                const friends = await friendshipService.getFriends(user.id);
                setFriendCount(friends.length);
            } catch (e) {
                console.error("Error fetching friend count", e);
            }
        };
        fetchFriendCount();
    }, [user.id]);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        setFormData({
            ...user,
            city: user.city || 'Sorocaba',
            state: user.state || 'SP',
            dateOfBirth: user.dateOfBirth || '',
            bio: user.bio || '',
            sport: user.sport || [],
            position: user.position || [],
            bannerUrl: user.bannerUrl || '',
            favoriteTeam: user.favoriteTeam || '',
            favoriteTeamLogoUrl: user.favoriteTeamLogoUrl || ''
        });
    }, [user]);

    useEffect(() => {
        const newAvailablePositions = (formData.sport || []).flatMap(s => SPORT_POSITIONS[s] || []);
        setAvailablePositions(Array.from(new Set(newAvailablePositions)));

        setFormData(prev => ({
            ...prev,
            position: (prev.position || []).filter(p => newAvailablePositions.includes(p))
        }));
    }, [formData.sport]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const teamName = e.target.value;
        const teamData = BRAZILIAN_TEAMS.find(t => t.name === teamName);
        setFormData(prev => ({
            ...prev,
            favoriteTeam: teamName,
            favoriteTeamLogoUrl: teamData ? teamData.logo : ''
        }));
    };

    const handleMultiSelectToggle = (field: 'sport' | 'position', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdateUser(formData);
            setIsEditing(false);
        } catch (error) {
            alert("❌ Erro ao salvar o perfil. Por favor, tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            ...user,
            city: user.city || 'Sorocaba',
            state: user.state || 'SP',
            dateOfBirth: user.dateOfBirth || '',
            bio: user.bio || '',
            sport: user.sport || [],
            position: user.position || [],
            bannerUrl: user.bannerUrl || '',
            favoriteTeam: user.favoriteTeam || '',
            favoriteTeamLogoUrl: user.favoriteTeamLogoUrl || ''
        });
    };

    const uploadImage = async (file: File | null, type: 'avatar' | 'banner') => {
        if (!file || !file.type.startsWith('image/')) return;

        const isAvatar = type === 'avatar';
        const setUploading = isAvatar ? setIsUploadingAvatar : setIsUploadingBanner;
        const bucket = 'avatars';

        try {
            setUploading(true);

            const filePath = `${user.id}/${type}_${Date.now()}_${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

            const publicUrl = data?.publicUrl;
            if (!publicUrl) {
                throw new Error("Não foi possível obter a URL pública da imagem enviada.");
            }

            const fieldToUpdate = isAvatar ? 'photoUrl' : 'bannerUrl';
            const updatedFormData = { ...formData, [fieldToUpdate]: publicUrl };
            setFormData(updatedFormData);

            await onUpdateUser(updatedFormData);

        } catch (error: any) {
            alert("Erro ao enviar imagem: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        uploadImage(e.target.files?.[0] || null, 'avatar');
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        uploadImage(e.target.files?.[0] || null, 'banner');
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            avatarInputRef.current?.click();
        }
    };

    const handleBannerClick = () => {
        if (isEditing) {
            bannerInputRef.current?.click();
        }
    };

    const inputClasses = "w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200";
    const labelClasses = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";
    const multiSelectButtonClasses = (isSelected: boolean) =>
        `px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${isSelected
            ? 'bg-green-500 border-green-500 text-white shadow-md'
            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
        }`;


    return (
        <div className="max-w-4xl mx-auto pb-20">
            {onNavigateBack && (
                <div className="mb-4">
                    <button
                        onClick={onNavigateBack}
                        className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
                    >
                        ← Voltar para Explorar
                    </button>
                </div>
            )}

            <div className="bg-[#112240]/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">

                <div
                    className={`relative w-full bg-cover bg-center transition-all duration-500 ease-in-out ${isEditing ? 'h-48 cursor-pointer group' : 'h-[450px]'}`}
                    style={{
                        backgroundImage: formData.bannerUrl
                            ? `url(${formData.bannerUrl})`
                            : 'linear-gradient(to right, #0a1628, #112240)'
                    }}
                    onClick={handleBannerClick}
                >
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/40 to-transparent ${!formData.bannerUrl ? 'bg-black/20' : ''}`}></div>

                    {!isEditing && (
                        <div className="absolute bottom-0 left-0 right-0 pb-8 flex flex-col items-center justify-end z-10 animate-fade-in">
                            <div className="w-36 h-36 rounded-full border-4 border-neon-green/30 shadow-[0_0_30px_rgba(0,255,148,0.3)] mb-4 relative overflow-hidden">
                                <img
                                    src={formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.name}&background=059669&color=fff&size=128`}
                                    alt={formData.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <h2 className="text-3xl font-bold text-white drop-shadow-md text-center px-4">{user.name}</h2>

                            <p className="text-gray-300 text-sm flex items-center justify-center gap-1 mb-3 drop-shadow-md">
                                📍 {user.city || 'Cidade não informada'}, {user.state || 'SP'}
                            </p>

                            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-yellow-500/50 px-4 py-1.5 rounded-full shadow-lg">
                                <TrophyIcon />
                                <span className="text-yellow-400 font-bold text-xs uppercase tracking-wide">
                                    Nível: {user.reputation}
                                </span>
                            </div>
                        </div>
                    )}

                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="text-white text-center bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                                <EditIcon />
                                <span className="text-xs font-bold block mt-1">Alterar Capa</span>
                            </div>
                        </div>
                    )}

                    {isUploadingBanner && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
                            <ModernLoader />
                        </div>
                    )}
                </div>

                <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" disabled={isUploadingBanner} />
                <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" disabled={isUploadingAvatar} />


                <div className="px-6 pb-8 relative">

                    {isEditing && (
                        <div className="relative flex flex-col items-center -mt-16 mb-6 z-10">
                            <div
                                className="relative w-32 h-32 rounded-full border-4 border-[#0a1628] shadow-xl group bg-gray-700 cursor-pointer hover:scale-105 transition-all duration-300"
                                onClick={handleAvatarClick}
                            >
                                <img
                                    src={formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.name}&background=059669&color=fff&size=128`}
                                    alt={formData.name}
                                    className={`w-full h-full rounded-full object-cover transition-opacity duration-300 ${isUploadingAvatar ? 'opacity-50' : ''}`}
                                />

                                {!isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="text-white text-center">
                                            <div className="mx-auto mb-1"><EditIcon /></div>
                                            <span className="text-xs font-bold">Alterar</span>
                                        </div>
                                    </div>
                                )}

                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center z-50">
                                        <ModernLoader />
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-400 text-xs mt-2">Toque na foto para alterar</p>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-8 pt-4">
                        <div className="bg-[#0a1628]/50 rounded-xl p-3 text-center border border-white/5 backdrop-blur-sm">
                            <p className="text-xl sm:text-2xl font-bold text-white">{calculateAge(formData.dateOfBirth)}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wide">Idade</p>
                        </div>
                        <div className="bg-[#0a1628]/50 rounded-xl p-3 text-center border border-white/5 backdrop-blur-sm cursor-pointer hover:bg-[#0a1628]/80 transition-colors" onClick={() => setShowFriendsManager(true)}>
                            <p className="text-xl sm:text-2xl font-bold text-white">{friendCount}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wide">Amigos</p>
                        </div>
                        <div className="bg-[#0a1628]/50 rounded-xl p-3 text-center border border-white/5 backdrop-blur-sm">
                            <p className="text-xl sm:text-2xl font-bold text-white">{user.matchesPlayed}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wide">Partidas</p>
                        </div>
                        <div className="bg-[#0a1628]/50 rounded-xl p-3 text-center border border-neon-green/20 relative overflow-hidden backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,255,148,0.05)]">
                            <div className="absolute top-0 right-0 p-1 opacity-20 text-neon-green"><StarIcon /></div>
                            <p className="text-xl sm:text-2xl font-bold text-neon-green drop-shadow-[0_0_5px_rgba(0,255,148,0.5)]">{user.points}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wide">Pontos</p>
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="bg-[#0a1628]/30 rounded-xl p-4 border border-white/5 text-center mb-8 backdrop-blur-sm">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Time do Coração</p>
                            {user.favoriteTeam ? (
                                <div className="flex items-center justify-center gap-3">
                                    {user.favoriteTeamLogoUrl ? (
                                        <img src={user.favoriteTeamLogoUrl} alt={user.favoriteTeam} className="w-8 h-8 object-contain drop-shadow-md" />
                                    ) : (
                                        <span className="text-2xl">⚽</span>
                                    )}
                                    <span className="text-white font-bold text-lg">{user.favoriteTeam}</span>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm italic">Escolha seu time do coração</p>
                            )}
                        </div>
                    )}


                    {isEditing ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-[#0a1628]/50 p-5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-white font-bold mb-4 border-b border-white/10 pb-2">Dados Pessoais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Nome Completo</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClasses} placeholder="Nome completo" />
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Cidade</label>
                                        <select name="city" value={formData.city || ''} onChange={handleInputChange} className={inputClasses}>
                                            {CITY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Estado</label>
                                        <input type="text" value="SP" className={`${inputClasses} bg-gray-800 cursor-not-allowed opacity-70`} disabled />
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Data de Nascimento</label>
                                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleInputChange} className={inputClasses} />
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Time do Coração</label>
                                        <select name="favoriteTeam" value={formData.favoriteTeam || ''} onChange={handleTeamChange} className={inputClasses}>
                                            <option value="">Selecione...</option>
                                            {BRAZILIAN_TEAMS.map(t => (
                                                <option key={t.name} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className={labelClasses}>Bio / Sobre você</label>
                                    <textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} className={inputClasses} rows={3} placeholder="Conte um pouco sobre seu estilo de jogo..."></textarea>
                                </div>
                            </div>

                            <div className="bg-[#0a1628]/50 p-5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-white font-bold mb-4 border-b border-white/10 pb-2">Perfil Esportivo</h3>

                                <div className="mb-4">
                                    <label className={labelClasses}>Modalidades</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {SPORTS_LIST.map(sport => (
                                            <button key={sport} type="button" onClick={() => handleMultiSelectToggle('sport', sport)} className={multiSelectButtonClasses((formData.sport || []).includes(sport))}>
                                                {sport}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {availablePositions.length > 0 && (
                                    <div>
                                        <label className={labelClasses}>Posições Preferidas</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {availablePositions.map(position => (
                                                <button key={position} type="button" onClick={() => handleMultiSelectToggle('position', position)} className={multiSelectButtonClasses((formData.position || []).includes(position))}>
                                                    {position}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button onClick={handleCancel} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-all" disabled={isUploadingAvatar || isUploadingBanner || isSaving}>
                                    Cancelar
                                </button>
                                <button onClick={handleSave} className="flex-1 bg-neon-green text-[#0a1628] font-bold py-3 rounded-lg hover:bg-[#00e686] hover:shadow-[0_0_15px_rgba(0,255,148,0.4)] transition-all flex justify-center items-center" disabled={isUploadingAvatar || isUploadingBanner || isSaving}>
                                    {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                                </button>
                                {isSaving && <ModernLoader />}
                            </div>
                        </div>
                    ) : (
                        /* Read-Only Mode Content */
                        <div className="space-y-6">
                            {user.bio ? (
                                <div className="text-center px-4">
                                    <p className="text-gray-300 italic text-lg">"{user.bio}"</p>
                                </div>
                            ) : (
                                <div className="text-center px-4">
                                    <p className="text-gray-500 italic text-sm">Adicione uma descrição sobre você.</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {user.sport && user.sport.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">Modalidades</h3>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {user.sport.map(s => (
                                                <span key={s} className="bg-[#0a1628] text-neon-green border border-neon-green/30 px-3 py-1 rounded-full text-sm font-medium shadow-[0_0_10px_rgba(0,255,148,0.1)]">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {user.position && user.position.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">Posições</h3>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {user.position.map(p => (
                                                <span key={p} className="bg-[#0a1628] text-gray-300 border border-white/10 px-3 py-1 rounded-full text-sm">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 space-y-3 border-t border-white/10 mt-6">
                                {/* Seção de Times */}
                                {!isEditing && (
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Meus Times</h3>
                                            <button
                                                onClick={() => setShowCreateTeamModal(true)}
                                                className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded hover:bg-green-500/20 transition-colors"
                                            >
                                                + Criar
                                            </button>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-thin scrollbar-thumb-gray-700">
                                            {myTeams.length === 0 ? (
                                                <div className="text-gray-500 text-sm text-center w-full py-2 bg-gray-800/30 rounded-lg border border-gray-700/30">
                                                    Você ainda não participa de nenhum time.
                                                </div>
                                            ) : (
                                                myTeams.map(team => (
                                                    <div
                                                        key={team.id}
                                                        onClick={() => setSelectedTeamId(team.id)}
                                                        className="flex flex-col items-center gap-2 cursor-pointer group min-w-[80px]"
                                                    >
                                                        <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-gray-600 group-hover:border-green-500 transition-all overflow-hidden relative shadow-lg">
                                                            {team.logo_url ? (
                                                                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="w-full h-full flex items-center justify-center text-2xl">🛡️</span>
                                                            )}
                                                            {team.role === 'admin' && (
                                                                <div className="absolute bottom-0 right-0 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-tl-md">ADM</div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-300 font-medium truncate max-w-[90px] text-center group-hover:text-white">{team.name}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button onClick={() => setShowFriendsManager(true)} className="w-full bg-[#112240] border border-white/10 text-white font-bold py-3 rounded-lg hover:bg-[#1a2f55] transition-all flex justify-center items-center gap-2">
                                    👥 Gerenciar Amigos
                                </button>
                                <button onClick={() => setIsEditing(true)} className="w-full bg-[#112240] border border-white/10 text-white font-bold py-3 rounded-lg hover:bg-[#1a2f55] transition-all flex justify-center items-center gap-2">
                                    <EditIcon /> Editar Informações
                                </button>
                                <button onClick={onLogout} className="w-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold py-3 rounded-lg hover:bg-red-500/20 transition-all">
                                    Sair da Conta
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {showFriendsManager && <FriendsManager currentUser={user} onClose={() => setShowFriendsManager(false)} />}

            {showCreateTeamModal && (
                <CreateTeamModal
                    userId={user.id}
                    onClose={() => setShowCreateTeamModal(false)}
                    onSuccess={handleTeamCreated}
                />
            )}

            {selectedTeamId && (
                <TeamDetailsModal
                    teamId={selectedTeamId}
                    currentUserId={user.id}
                    onClose={() => setSelectedTeamId(null)}
                />
            )}

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

export default UserProfile;
