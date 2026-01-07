import React, { useEffect, useState, useRef } from 'react';
import { teamService } from '../services/teamService';
import { Team, TeamMember } from '../types';
import { supabase } from '../services/supabaseClient';
import TeamInviteCard from './TeamInviteCard';
import TeamLogo from './TeamLogo';

interface TeamDetailsModalProps {
    teamId: number;
    currentUserId: string;
    onClose: () => void;
    onCreateMatchClick: (teamId: number, teamName: string) => void;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ teamId, currentUserId, onClose, onCreateMatchClick }) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [teamMatches, setTeamMatches] = useState<any[]>([]); // New state for matches
    const [pendingRequests, setPendingRequests] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
    const [showInviteCard, setShowInviteCard] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await teamService.getTeamDetails(teamId);
            setTeam(data.team);
            setMembers(data.members);

            // Se for ADM, buscar pendentes
            if (data.members.some(m => m.user_id === currentUserId && m.role === 'admin')) {
                const pendings = await teamService.getPendingRequests(teamId);
                setPendingRequests(pendings || []);
            }

            // Buscar partidas do time
            const matches = await teamService.getTeamMatches(teamId);
            setTeamMatches(matches || []);

        } catch (error) {
            console.error(error);
            alert("Erro ao carregar time");
            onClose();
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [teamId]);

    const isAdmin = members.some(m => m.user_id === currentUserId && m.role === 'admin');

    const handleCopyInvite = () => {
        if (!team) return;
        const link = `${window.location.origin}/time/${team.invite_code}`;
        navigator.clipboard.writeText(link);
        alert("Link de convite copiado!");
    };

    const handleShareWhatsapp = () => {
        if (!team) return;
        const link = `${window.location.origin}/time/${team.invite_code}`;
        const text = `Venha fazer parte do meu time *${team.name}* no FutMatch! ⚽\n\nAcesse: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleApprove = async (memberId: number) => {
        try {
            await teamService.approveMember(memberId);
            setIsRefreshing(true);
            loadData(); // Reload to refresh lists
        } catch (e) {
            alert("Erro ao aprovar");
        }
    };

    const handleReject = async (memberId: number) => {
        if (!window.confirm("Deseja rejeitar/remover este membro?")) return;
        try {
            await teamService.removeMember(memberId);
            setIsRefreshing(true);
            loadData();
        } catch (e) {
            alert("Erro ao remover");
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin || !team) return;
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 2MB.");
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            alert("Formato inválido.");
            return;
        }

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `team_${team.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('team-logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('team-logos').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            await teamService.updateTeam(team.id, { logo_url: publicUrl });
            setTeam(prev => prev ? ({ ...prev, logo_url: publicUrl }) : null);

        } catch (error: any) {
            alert("Erro ao atualizar logo: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };


    const handleLeaveTeam = async () => {
        if (!window.confirm("Tem certeza que deseja sair deste time?")) return;
        try {
            await teamService.leaveTeam(teamId, currentUserId);
            alert("Você saiu do time.");
            onClose();
        } catch (e) {
            alert("Erro ao sair do time.");
        }
    };

    const handleCreateMatch = () => {
        if (team) {
            onCreateMatchClick(team.id, team.name);
        }
    }

    if (loading && !isRefreshing) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!team) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-700 overflow-hidden shadow-xl animate-fade-in-up flex flex-col max-h-[90vh]">

                {/* Header Image/Gradient */}
                <div className="h-32 bg-gradient-to-br from-green-800 to-gray-900 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-all z-10">
                        ✕
                    </button>
                    <div className="absolute -bottom-10 left-6">
                        <div
                            className={`w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-700 overflow-hidden shadow-lg flex items-center justify-center relative group ${isAdmin ? 'cursor-pointer' : ''}`}
                            onClick={() => isAdmin && fileInputRef.current?.click()}
                        >
                            {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : ''}`} />
                            ) : (
                                <span className="text-3xl">🛡️</span>
                            )}

                            {isAdmin && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white font-bold">{isUploading ? '...' : 'Editar'}</span>
                                </div>
                            )}

                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                    <div className="pt-12 px-6 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{team.name}</h2>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Futebol</span>
                                    <span className="text-gray-500 text-xs">• {members.length} Membros</span>
                                </div>
                            </div>
                        </div>

                        {!showInviteCard && (
                            <>
                                {team.description && <p className="text-gray-400 text-sm mb-4">{team.description}</p>}

                                {/* Team Matches Section (Preview) */}
                                {teamMatches.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Próximos Jogos</h3>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {teamMatches.map(match => (
                                                <div key={match.id} className="min-w-[120px] bg-gray-700/50 p-2 rounded-lg border border-gray-600/50 flex flex-col items-center text-center">
                                                    <div className="text-green-400 font-bold text-xs mb-1">
                                                        {/* Format Date: DD/MM - HH:mm */}
                                                        {match.date instanceof Date
                                                            ? `${match.date.getDate()}/${match.date.getMonth() + 1} - ${match.date.getHours()}:${String(match.date.getMinutes()).padStart(2, '0')}`
                                                            : 'Data inválida'}
                                                    </div>
                                                    <div className="text-white text-xs font-semibold truncate w-full">{match.name}</div>
                                                    <div className="text-gray-500 text-[10px] mt-1">{match.filled_slots}/{match.slots} Confirmados</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {showInviteCard ? (
                            <div className="pt-12 pb-6 flex justify-center flex-1 overflow-y-auto min-h-[400px]">
                                <TeamInviteCard
                                    team={team}
                                    inviteLink={`${window.location.origin}/time/${team.invite_code}`}
                                    onClose={() => setShowInviteCard(false)}
                                />
                            </div>
                        ) : (
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={handleShareWhatsapp}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                                >
                                    <span>📲</span> Convidar via Zap
                                </button>
                                <button
                                    onClick={() => setShowInviteCard(true)}
                                    className="bg-[#112240] border border-white/10 hover:bg-[#1a2f55] text-white p-3 rounded-xl transition-all shadow-md active:scale-95"
                                    title="Gerar Card de Convite"
                                >
                                    ✨ Ver Card
                                </button>

                                {isAdmin && (
                                    <button
                                        onClick={handleCreateMatch}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:brightness-110 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95"
                                    >
                                        ⚽ Criar Partida
                                    </button>
                                )}
                                {!isAdmin && (
                                    <button
                                        onClick={handleLeaveTeam}
                                        className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 p-3 rounded-xl transition-all"
                                        title="Sair do Time"
                                    >
                                        🚪
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Tabs if Admin */}
                        {isAdmin && (
                            <div className="flex border-b border-gray-700 mb-4">
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'members' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Membros ({members.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('requests')}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'requests' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400 hover:text-white'} relative`}
                                >
                                    Solicitações
                                    {pendingRequests.length > 0 && (
                                        <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* List Content */}
                    <div className="px-6 pb-6">
                        {isAdmin && activeTab === 'requests' ? (
                            <div className="space-y-3">
                                {pendingRequests.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">Nenhuma solicitação pendente.</p>
                                ) : (
                                    pendingRequests.map(req => (
                                        <div key={req.id} className="flex items-center justify-between bg-gray-700/30 p-3 rounded-xl border border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                                    {req.profiles?.photoUrl ? (
                                                        <img src={req.profiles.photoUrl} alt={req.profiles.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-xs">👤</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white text-sm">{req.profiles?.name}</div>
                                                    <div className="text-xs text-gray-500">{req.profiles?.reputation || 'Novo'}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white p-2 rounded-lg transition-colors text-xs font-bold"
                                                >
                                                    ACEITAR
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors text-xs font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between bg-gray-700/30 p-3 rounded-xl border border-gray-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                                {member.profiles?.photoUrl ? (
                                                    <img src={member.profiles.photoUrl} alt={member.profiles.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-xs">👤</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white text-sm flex items-center gap-2">
                                                    {member.profiles?.name}
                                                    {member.role === 'admin' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded border border-yellow-500/30">ADM</span>}
                                                </div>
                                                <div className="text-xs text-gray-500">{member.profiles?.reputation || 'Jogador'}</div>
                                            </div>
                                        </div>
                                        {isAdmin && member.user_id !== currentUserId && (
                                            <button
                                                onClick={() => handleReject(member.id)}
                                                className="text-gray-500 hover:text-red-400 p-2 transition-colors text-xs"
                                                title="Remover membro"
                                            >
                                                Remover
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetailsModal;
