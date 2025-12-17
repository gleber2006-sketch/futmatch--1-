
import { supabase } from './supabaseClient';
import { Team, TeamMember } from '../types';

export const teamService = {
    // Criar um novo time
    async createTeam(userId: string, name: string, description: string, logoUrl?: string) {
        const { data, error } = await supabase
            .from('teams')
            .insert({
                created_by: userId,
                name,
                description,
                logo_url: logoUrl
            })
            .select()
            .single();

        if (error) throw error;

        // Adicionar o criador como Admin e Aprovado automaticamente
        if (data) {
            await this.addMember(data.id, userId, 'approved', 'admin');
        }
        return data as Team;
    },

    // Adicionar membro (interno)
    async addMember(teamId: number, userId: string, status: 'pending' | 'approved' | 'rejected', role: 'member' | 'admin' = 'member') {
        const { data, error } = await supabase
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: userId,
                status,
                role
            })
            .select()
            .single();

        if (error) throw error;
        return data as TeamMember;
    },

    // Solicitar entrada no time
    async joinTeam(teamId: number, userId: string) {
        // Verifica se já existe solicitação
        const { data: existing } = await supabase
            .from('team_members')
            .select('id, status')
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            if (existing.status === 'rejected') throw new Error("Sua solicitação foi recusada anteriormente.");
            if (existing.status === 'approved') throw new Error("Você já faz parte deste time.");
            if (existing.status === 'pending') throw new Error("Você já tem uma solicitação pendente.");
        }

        return await this.addMember(teamId, userId, 'pending', 'member');
    },

    // Buscar time por Invite Code
    async getTeamByInviteCode(code: string) {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .eq('invite_code', code)
            .single();

        if (error) throw error;
        return data as Team;
    },

    // Buscar times do usuário
    async getUserTeams(userId: string) {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
        *,
        team:teams(*)
      `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (error) throw error;
        return data.map((d: any) => ({ ...d.team, role: d.role })) as (Team & { role: 'admin' | 'member' })[];
    },

    // Buscar detalhes do time com membros (usando queries separadas para evitar problemas de join)
    async getTeamDetails(teamId: number) {
        // 1. Get Team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

        if (teamError) throw teamError;

        // 2. Get Members
        const { data: membersRaw, error: membersError } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', teamId)
            .eq('status', 'approved');

        if (membersError) throw membersError;

        if (!membersRaw || membersRaw.length === 0) {
            return { team, members: [] };
        }

        // 3. Get Profiles for those members
        const userIds = membersRaw.map((m: any) => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, photo_url, reputation')
            .in('id', userIds);

        if (profilesError) throw profilesError;

        // 4. Map profiles to members
        const members = membersRaw.map((member: any) => {
            const profile = profiles?.find((p: any) => p.id === member.user_id);
            return {
                ...member,
                profiles: profile ? {
                    name: profile.name,
                    photoUrl: profile.photo_url, // Map snake_case to camelCase
                    reputation: profile.reputation
                } : undefined
            };
        });

        return { team, members };
    },

    // Buscar solicitações pendentes (usando queries separadas)
    async getPendingRequests(teamId: number) {
        // 1. Get Pending Members
        const { data: pendingRaw, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', teamId)
            .eq('status', 'pending');

        if (error) throw error;

        if (!pendingRaw || pendingRaw.length === 0) {
            return [];
        }

        // 2. Get Profiles
        const userIds = pendingRaw.map((m: any) => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, photo_url, reputation')
            .in('id', userIds);

        if (profilesError) throw profilesError;

        // 3. Map
        return pendingRaw.map((member: any) => {
            const profile = profiles?.find((p: any) => p.id === member.user_id);
            return {
                ...member,
                profiles: profile ? {
                    name: profile.name,
                    photoUrl: profile.photo_url,
                    reputation: profile.reputation
                } : undefined
            };
        });
    },

    // Aprovar membro
    async approveMember(memberId: number) {
        const { error } = await supabase
            .from('team_members')
            .update({ status: 'approved' })
            .eq('id', memberId);

        if (error) throw error;
    },

    // Recusar/Remover membro
    async removeMember(memberId: number) {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId);

        if (error) throw error;
    },

    // Sair do time (usuário remove a si mesmo)
    async leaveTeam(teamId: number, userId: string) {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    // Atualizar dados do time (logo)
    async updateTeam(teamId: number, data: Partial<Team>) {
        const { error } = await supabase
            .from('teams')
            .update(data)
            .eq('id', teamId);

    },

    // Buscar partidas do time
    async getTeamMatches(teamId: number) {
        const { data, error } = await supabase
            .from('matches')
            .select(`
                *, 
                match_participants(user_id, status, joined_at, waitlist_position, profiles(photo_url, name, reputation))
            `)
            .eq('team_id', teamId)
            .neq('status', 'Cancelado')
            .order('date', { ascending: true });

        if (error) throw error;

        return data.map((m: any) => ({
            ...m,
            date: new Date(m.date) // Ensure date is Date object
        }));
    }
};
