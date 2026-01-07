import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { supabase } from '../services/supabaseClient';
import { friendshipService } from '../services/friendshipService';
import { CloseIcon, StarIcon, TrophyIcon, UserIcon } from './Icons';
import ModernLoader from './ModernLoader';

interface PublicProfileModalProps {
    userId: string;
    currentUser: Profile;
    onClose: () => void;
    onNavigateToDirectChat?: (userId: string) => void;
}

const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, currentUser, onClose, onNavigateToDirectChat }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [friendStatus, setFriendStatus] = useState<{ id: number, status: string, isRequester: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                // Fetch Profile
                const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
                if (error) throw error;

                if (data) {
                    const mappedProfile: Profile = {
                        id: data.id,
                        name: data.name,
                        photoUrl: data.photo_url,
                        dateOfBirth: data.date_of_birth,
                        city: data.city,
                        state: data.state,
                        sport: data.sport,
                        position: data.position,
                        bio: data.bio,
                        points: data.points || 0,
                        matchesPlayed: data.matches_played || 0,
                        reputation: data.reputation || 'Iniciante',
                        bannerUrl: data.banner_url,
                        favoriteTeam: data.favorite_team,
                        favoriteTeamLogoUrl: data.favorite_team_logo_url,
                        matchCoins: 0 // Public info doesn't need coins
                    };
                    setProfile(mappedProfile);
                }

                // Fetch Friendship Status
                if (userId !== currentUser.id) {
                    const status = await friendshipService.getFriendshipStatus(currentUser.id, userId);
                    setFriendStatus(status);
                }
            } catch (err) {
                console.error("Error fetching public profile:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();
    }, [userId, currentUser.id]);

    const handleAddFriend = async () => {
        setIsActionLoading(true);
        try {
            await friendshipService.sendFriendRequest(currentUser.id, userId);
            setFriendStatus({ id: 0, status: 'pending', isRequester: true });
        } catch (err) {
            alert("Erro ao enviar solicitação.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAcceptFriend = async () => {
        if (!friendStatus) return;
        setIsActionLoading(true);
        try {
            await friendshipService.respondToFriendRequest(friendStatus.id, 'accept');
            setFriendStatus({ ...friendStatus, status: 'accepted' });
        } catch (err) {
            alert("Erro ao aceitar amizade.");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
                <ModernLoader />
            </div>
        );
    }

    if (!profile) return null;

    const calculateAge = (dob: string | null): number | string => {
        if (!dob) return '-';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="bg-[#0a1628] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]">

                {/* Banner Area */}
                <div
                    className="h-40 w-full bg-cover bg-center relative"
                    style={{
                        backgroundImage: profile.bannerUrl
                            ? `url(${profile.bannerUrl})`
                            : 'linear-gradient(to right, #112240, #0a1628)'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md border border-white/10 transition-all z-20"
                    >
                        <CloseIcon />
                    </button>

                    {/* Avatar positioned on edge */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10">
                        <div className="w-24 h-24 rounded-full border-4 border-[#0a1628] shadow-2xl overflow-hidden bg-gray-800">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">⚽</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-12 px-6 pb-8 overflow-y-auto">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-white">{profile.name}</h2>
                        <p className="text-gray-400 text-sm flex items-center justify-center gap-1 mt-1">
                            📍 {profile.city || 'Brazil'}, {profile.state || 'SP'}
                        </p>

                        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full mt-3">
                            <TrophyIcon />
                            <span className="text-yellow-500 font-black text-[10px] uppercase tracking-widest">
                                {profile.reputation}
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                            <p className="text-lg font-black text-white">{calculateAge(profile.dateOfBirth)}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Idade</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                            <p className="text-lg font-black text-white">{profile.matchesPlayed}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Jogos</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl text-center border border-neon-green/10">
                            <p className="text-lg font-black text-neon-green">{profile.points}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Pontos</p>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <div className="mt-6 text-center">
                            <p className="text-gray-300 italic text-sm px-4">"{profile.bio}"</p>
                        </div>
                    )}

                    {/* Modalities */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {profile.sport?.map(s => (
                            <span key={s} className="bg-[#112240] text-neon-green text-[10px] font-bold px-3 py-1 rounded-full border border-neon-green/20">
                                {s}
                            </span>
                        ))}
                    </div>

                    {/* Favorite Team */}
                    {profile.favoriteTeam && (
                        <div className="mt-6 bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-center gap-3">
                            {profile.favoriteTeamLogoUrl && (
                                <img src={profile.favoriteTeamLogoUrl} alt={profile.favoriteTeam} className="w-8 h-8 object-contain" />
                            )}
                            <div className="text-left">
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Coriente</p>
                                <p className="text-white font-black">{profile.favoriteTeam}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    {userId !== currentUser.id && (
                        <div className="mt-8">
                            {friendStatus?.status === 'accepted' ? (
                                <div className="flex flex-col gap-2">
                                    <div className="w-full bg-green-500/10 text-green-400 font-black text-xs uppercase py-4 rounded-2xl border border-green-500/20 text-center flex items-center justify-center gap-2">
                                        <span>✅ Amigo</span>
                                    </div>
                                    <button
                                        onClick={() => onNavigateToDirectChat?.(userId)}
                                        className="w-full bg-[#00FF94] hover:bg-white text-black font-black text-xs uppercase py-4 rounded-2xl transition-all shadow-xl shadow-[#00FF94]/20 flex items-center justify-center gap-2"
                                    >
                                        💬 Mandar Mensagem
                                    </button>
                                </div>
                            ) : friendStatus?.status === 'pending' ? (
                                friendStatus.isRequester ? (
                                    <div className="w-full bg-yellow-500/10 text-yellow-500 font-black text-xs uppercase py-4 rounded-2xl border border-yellow-500/20 text-center">
                                        ⏳ Solicitação Enviada
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleAcceptFriend}
                                        disabled={isActionLoading}
                                        className="w-full bg-[#00FF94] hover:bg-white text-black font-black text-xs uppercase py-4 rounded-2xl transition-all shadow-xl shadow-[#00FF94]/20 flex items-center justify-center gap-2"
                                    >
                                        {isActionLoading ? 'Processando...' : '🤝 Aceitar Amizade'}
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={handleAddFriend}
                                    disabled={isActionLoading}
                                    className="w-full bg-[#00FF94] hover:bg-white text-black font-black text-xs uppercase py-4 rounded-2xl transition-all shadow-xl shadow-[#00FF94]/20 flex items-center justify-center gap-2"
                                >
                                    {isActionLoading ? 'Enviando...' : '➕ Enviar Solicitação'}
                                </button>
                            )}
                        </div>
                    )}

                    {userId === currentUser.id && (
                        <div className="mt-8 text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Este é o seu perfil público</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PublicProfileModal;
