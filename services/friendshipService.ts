import { supabase } from './supabaseClient';
import { Friendship, Profile } from '../types';

export const friendshipService = {
    // Send a friend request
    async sendFriendRequest(requesterId: string, receiverId: string) {
        // Check if friendship already exists
        const { data: existing } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
            .single();

        if (existing) {
            if (existing.status === 'accepted') throw new Error('Vocês já são amigos!');
            if (existing.status === 'pending') throw new Error('Já existe uma solicitação pendente.');
        }

        const { error } = await supabase
            .from('friendships')
            .insert({
                requester_id: requesterId,
                receiver_id: receiverId,
                status: 'pending'
            });

        if (error) throw error;
    },

    // Accept or Decline a request
    async respondToFriendRequest(friendshipId: number, action: 'accept' | 'decline') {
        if (action === 'decline') {
            const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('id', friendshipId);
            if (error) throw error;
        }
    },

    // Remove a friend
    async removeFriend(friendshipId: number) {
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

        if (error) throw error;
    },

    // Get accepted friends
    async getFriends(userId: string): Promise<Friendship[]> {
        const { data: friendships, error } = await supabase
            .from('friendships')
            .select('*')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

        if (error) throw error;
        if (!friendships || friendships.length === 0) return [];

        // Collect all unique profile IDs we need to fetch
        const profileIds = Array.from(new Set(friendships.flatMap(f => [f.requester_id, f.receiver_id])));

        // Fetch profiles separately
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, photo_url, reputation')
            .in('id', profileIds);

        if (profilesError) throw profilesError;

        // Map profiles back to friendships
        return friendships.map(f => {
            const reqProfile = profiles?.find(p => p.id === f.requester_id);
            const recProfile = profiles?.find(p => p.id === f.receiver_id);

            return {
                ...f,
                requester: reqProfile ? {
                    name: reqProfile.name,
                    photoUrl: reqProfile.photo_url,
                    reputation: reqProfile.reputation
                } : undefined,
                receiver: recProfile ? {
                    name: recProfile.name,
                    photoUrl: recProfile.photo_url,
                    reputation: recProfile.reputation
                } : undefined
            };
        });
    },

    // Get pending requests (received)
    async getPendingRequests(userId: string): Promise<Friendship[]> {
        const { data: friendships, error } = await supabase
            .from('friendships')
            .select('*')
            .eq('status', 'pending')
            .eq('receiver_id', userId);

        if (error) throw error;
        if (!friendships || friendships.length === 0) return [];

        const requesterIds = friendships.map(f => f.requester_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, photo_url, reputation')
            .in('id', requesterIds);

        if (profilesError) throw profilesError;

        return friendships.map(f => {
            const profile = profiles?.find(p => p.id === f.requester_id);
            return {
                ...f,
                requester: profile ? {
                    name: profile.name,
                    photoUrl: profile.photo_url,
                    reputation: profile.reputation
                } : undefined
            };
        });
    },

    // Get pending requests (sent)
    async getSentRequests(userId: string): Promise<Friendship[]> {
        const { data: friendships, error } = await supabase
            .from('friendships')
            .select('*')
            .eq('status', 'pending')
            .eq('requester_id', userId);

        if (error) throw error;
        if (!friendships || friendships.length === 0) return [];

        const receiverIds = friendships.map(f => f.receiver_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, photo_url, reputation')
            .in('id', receiverIds);

        if (profilesError) throw profilesError;

        return friendships.map(f => {
            const profile = profiles?.find(p => p.id === f.receiver_id);
            return {
                ...f,
                receiver: profile ? {
                    name: profile.name,
                    photoUrl: profile.photo_url,
                    reputation: profile.reputation
                } : undefined
            };
        });
    },

    // Check friendship status between two users
    async getFriendshipStatus(user1Id: string, user2Id: string): Promise<{ id: number, status: 'pending' | 'accepted', isRequester: boolean } | null> {
        const { data } = await supabase
            .from('friendships')
            .select('id, status, requester_id')
            .or(`and(requester_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(requester_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
            .single();

        if (!data) return null;

        return {
            id: data.id,
            status: data.status,
            isRequester: data.requester_id === user1Id
        };
    },

    // Search users to add
    async searchUsers(query: string, currentUserId: string): Promise<Profile[]> {
        if (!query || query.length < 3) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUserId)
            .ilike('name', `%${query}%`)
            .limit(10);

        if (error) throw error;

        // Map DB snake_case to Profile type camelCase
        return data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            photoUrl: user.photo_url,
            dateOfBirth: user.date_of_birth,
            city: user.city,
            state: user.state,
            sport: user.sport,
            position: user.position,
            bio: user.bio,
            points: user.points,
            matchesPlayed: user.matches_played,
            reputation: user.reputation,
            bannerUrl: user.banner_url,
            favoriteTeam: user.favorite_team,
            favoriteTeamLogoUrl: user.favorite_team_logo_url,
            matchCoins: user.match_coins,
            referred_by: user.referred_by,
            signup_bonus_claimed: user.signup_bonus_claimed
        }));
    }
};
