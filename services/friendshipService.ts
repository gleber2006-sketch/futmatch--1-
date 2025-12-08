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
        const { data, error } = await supabase
            .from('friendships')
            .select(`
        *,
        requester:requester_id(name, photo_url, reputation),
        receiver:receiver_id(name, photo_url, reputation)
      `)
            .eq('status', 'accepted')
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

        if (error) throw error;

        // Map to properly shape the data if needed (profiles names are snake_case in DB usually, but our type expects camelCase if we aliased it or if types match)
        // Actually, in types.ts we defined profile props like photoUrl. Supabase returns columns as they are in DB.
        // We might need to map snake_case to camelCase if the Profile type uses camelCase but DB uses snake_case.
        // 'profiles' table usually has 'photo_url'. Our 'Profile' type has 'photoUrl'.
        // We should be careful with formatting.

        return (data as any[]).map(f => ({
            ...f,
            // Determine which profile is the "other" person
            // But for the UI, we might just want to know who the friend is.
            // Let's keep it raw here and let UI helper handle "who is the friend".
            requester: {
                name: f.requester?.name,
                photoUrl: f.requester?.photo_url,
                reputation: f.requester?.reputation
            },
            receiver: {
                name: f.receiver?.name,
                photoUrl: f.receiver?.photo_url,
                reputation: f.receiver?.reputation
            }
        }));
    },

    // Get pending requests (received)
    async getPendingRequests(userId: string): Promise<Friendship[]> {
        const { data, error } = await supabase
            .from('friendships')
            .select(`
        *,
        requester:requester_id(name, photo_url, reputation)
      `)
            .eq('status', 'pending')
            .eq('receiver_id', userId);

        if (error) throw error;

        return (data as any[]).map(f => ({
            ...f,
            requester: {
                name: f.requester?.name,
                photoUrl: f.requester?.photo_url,
                reputation: f.requester?.reputation
            }
        }));
    },

    // Get pending requests (sent)
    async getSentRequests(userId: string): Promise<Friendship[]> {
        const { data, error } = await supabase
            .from('friendships')
            .select(`
        *,
        receiver:receiver_id(name, photo_url, reputation)
      `)
            .eq('status', 'pending')
            .eq('requester_id', userId);

        if (error) throw error;

        return (data as any[]).map(f => ({
            ...f,
            receiver: {
                name: f.receiver?.name,
                photoUrl: f.receiver?.photo_url,
                reputation: f.receiver?.reputation
            }
        }));
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
