
import React, { useEffect, useState } from 'react';
import { teamService } from '../services/teamService';
import { Team, TeamMember } from '../types';

interface TeamDetailsModalProps {
    teamId: number;
    currentUserId: string;
    onClose: () => void;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ teamId, currentUserId, onClose }) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [pendingRequests, setPendingRequests] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        const link = `${window.location.origin}/?invite_team=${team.invite_code}`;
        navigator.clipboard.writeText(link);
        alert("Link de convite copiado!");
    };

    const handleShareWhatsapp = () => {
        if (!team) return;
        const link = `${window.location.origin}/?invite_team=${team.invite_code}`;
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
                        <div className="w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-700 overflow-hidden shadow-lg flex items-center justify-center">
                            {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">🛡️</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-12 px-6 pb-4">
                    <h2 className="text-2xl font-bold text-white mb-1">{team.name}</h2>
                    {team.description && <p className="text-gray-400 text-sm mb-4">{team.description}</p>}

                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={handleShareWhatsapp}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <span>📲</span> Convidar via Zap
                        </button>
                        <button
                            onClick={handleCopyInvite}
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                            title="Copiar Link"
                        >
                            🔗
                        </button>
                    </div>

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
                <div className="flex-1 overflow-y-auto px-6 pb-6">
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
    );
};

export default TeamDetailsModal;
