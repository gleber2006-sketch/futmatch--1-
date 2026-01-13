import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import BottomNav from './components/BottomNav';
import { Page, Feature, Profile, Match, Ranking, DraftMatchData, NewUserRegistrationData, MatchParticipant } from './types';
import { supabase } from './services/supabaseClient';
import { initGemini } from './services/geminiService';
import { AuthError, Session, User } from '@supabase/supabase-js';
import DatabaseSetup from './components/DatabaseSetup';
import ModernLoader from './components/ModernLoader';
import Toast from './components/Toast';
import { generateInviteCode } from './utils/inviteCode';
import Sidebar from './components/Sidebar';

// Lazy load components
const Explore = lazy(() => import('./components/Explore'));
const CreateMatchForm = lazy(() => import('./components/CreateMatchForm'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const RankingList = lazy(() => import('./components/RankingList'));
const ChatBot = lazy(() => import('./components/ChatBot'));
const Home = lazy(() => import('./components/Home'));
const MatchesMap = lazy(() => import('./components/MatchesMap'));
const MyGames = lazy(() => import('./components/MyGames'));
const Community = lazy(() => import('./components/Community'));
const Arenas = lazy(() => import('./components/Arenas'));
const MatchChat = lazy(() => import('./components/MatchChat'));
const Notifications = lazy(() => import('./components/Notifications'));
const Wallet = lazy(() => import('./components/Wallet'));
const InviteFriendScreen = lazy(() => import('./components/InviteFriendScreen'));
const InviteLandingScreen = lazy(() => import('./components/InviteLandingScreen'));
const SettingsScreen = lazy(() => import('./components/SettingsScreen'));
const SupportScreen = lazy(() => import('./components/SupportScreen'));
const HirePlayerScreen = lazy(() => import('./components/HirePlayerScreen'));
const PublicProfileModal = lazy(() => import('./components/PublicProfileModal'));
const DirectChat = lazy(() => import('./components/DirectChat'));
const DirectMessagesList = lazy(() => import('./components/DirectMessagesList'));


const platformFeatures: Feature[] = [
    { icon: '⚽', title: 'Criar Partida', description: 'Crie sua partida em qualquer esporte e personalize regras, local e horário.' },
    { icon: '📍', title: 'Encontre Partidas Próximas', description: 'Busque partidas próximas filtrando por esporte, local, horário ou status.' },
    { icon: '👥', title: 'Meus Jogos', description: 'Acompanhe as partidas que você criou, entrou ou está organizando.' },
    { icon: '🧑‍🤝‍🧑', title: 'Comunidade', description: 'Explore comunidades esportivas e participe de grupos de jogadores.' },
    { icon: '🏅', title: 'Ranking de Jogadores', description: 'Veja sua pontuação, conquistas e posições nos rankings esportivos.' },
    { icon: '🏟️', title: 'Campos e Arenas', description: 'Encontre locais esportivos próximos e visualize avaliações, mapas e modalidades.' },
    { icon: '💬', title: 'Chat das Partidas', description: 'Converse com jogadores, organizadores e grupos esportivos.' },
    { icon: '🔔', title: 'Notificações', description: 'Receba alertas importantes sobre partidas, convites e atualizações.' },
    { icon: '👤', title: 'Meu Perfil', description: 'Atualize suas informações e mostre seu estilo de jogo.' },
    { icon: '💰', title: 'Carteira FutMatch', description: 'Veja seu saldo de MatchCoins e compre mais quando precisar.' },
    { icon: '🎯', title: 'Sugestões de Partidas (IA)', description: 'Deixe a IA te recomendar os melhores jogos baseados no seu perfil' },
    { icon: '🌍', title: 'Mapa das Partidas', description: 'Visualize no mapa todas as partidas próximas, com horários e jogadores em tempo real.' },
];

// Helper function to robustly check for missing tables OR columns.
const isSchemaMismatchError = (error: any): boolean => {
    if (!error) return false;

    const message = String(error.message || '').toLowerCase();

    // Check for missing table errors
    return message.includes('could not find the table') ||
        (message.includes('relation') && message.includes('does not exist')) ||
        error.code === '42P01';
};


const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page | 'invite-landing'>(() => {
        if (window.location.pathname === '/convite') {
            return 'invite-landing';
        }
        return 'explore';
    });
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [joinedMatchIds, setJoinedMatchIds] = useState<Set<number>>(new Set());
    const [isLoadingDbCheck, setIsLoadingDbCheck] = useState(true);
    const [dbSetupRequired, setDbSetupRequired] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [profileInitialSection, setProfileInitialSection] = useState<'details' | 'friends'>('details');
    const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
    const [draftMatchData, setDraftMatchData] = useState<DraftMatchData | null>(null);
    const [rankings, setRankings] = useState<Ranking[]>([]);
    const [session, setSession] = useState<Session | null>(null);
    const [profileError, setProfileError] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [selectedChatMatchId, setSelectedChatMatchId] = useState<number | null>(null);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [showExitToast, setShowExitToast] = useState(false);
    const [viewingPublicProfileId, setViewingPublicProfileId] = useState<string | null>(null);
    const [selectedDirectChatUserId, setSelectedDirectChatUserId] = useState<string | null>(null);
    const [prevPage, setPrevPage] = useState<Page>('explore');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [unreadDMsCount, setUnreadDMsCount] = useState(0);
    const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);
    const exitAttemptRef = useRef(false);
    const isPopping = useRef(false);

    const isAuthenticated = !!currentUser;

    // Sincronizar selectedMatch com updates em matches (Realtime/Otimista)
    // Isso garante que o modal aberto receba as atualizações de participantes e status
    useEffect(() => {
        if (selectedMatch) {
            const matchInList = matches.find(m => m.id === selectedMatch.id);
            // Atualiza apenas se houver diferença para evitar loops
            if (matchInList && matchInList !== selectedMatch) {
                setSelectedMatch(matchInList);
            }
        }
    }, [matches, selectedMatch]);

    const fetchUserPrivateMatches = useCallback(async () => {
        if (!currentUser) return [];

        try {
            // Buscar partidas privadas criadas pelo usuário
            const { data: createdMatches, error: createdError } = await supabase
                .from('matches')
                .select(`
                    *,
                    team:teams(id, name, logo_url),
                    match_participants(user_id, status, joined_at, waitlist_position, profiles(photo_url, name, reputation))
                `)
                .eq('created_by', currentUser.id)
                .eq('is_private', true)
                .neq('status', 'Cancelado')
                .order('date', { ascending: true });

            if (createdError) throw createdError;

            // Buscar partidas privadas em que o usuário participa
            const { data: participantData, error: participantError } = await supabase
                .from('match_participants')
                .select('match_id')
                .eq('user_id', currentUser.id);

            if (participantError) throw participantError;

            const participantMatchIds = participantData?.map(p => p.match_id) || [];

            let participatedMatches: any[] = [];
            if (participantMatchIds.length > 0) {
                const { data, error: participatedError } = await supabase
                    .from('matches')
                    .select(`
                        *,
                        team:teams(id, name, logo_url),
                        match_participants(user_id, status, joined_at, waitlist_position, profiles(photo_url, name, reputation))
                    `)
                    .in('id', participantMatchIds)
                    .eq('is_private', true)
                    .neq('status', 'Cancelado')
                    .order('date', { ascending: true });

                if (participatedError) throw participatedError;
                participatedMatches = data || [];
            }

            // Mesclar e remover duplicatas
            const allPrivateMatches = [...(createdMatches || []), ...participatedMatches];
            const uniqueMatches = Array.from(
                new Map(allPrivateMatches.map(m => [m.id, m])).values()
            );

            return uniqueMatches.map(m => ({
                ...m,
                date: new Date(m.date)
            }));
        } catch (error: any) {
            console.error('Error fetching user private matches:', error.message);
            return [];
        }
    }, [currentUser]);

    const fetchMatches = useCallback(async () => {
        try {
            // Fetch public matches
            const { data: publicData, error: publicError } = await supabase
                .from('matches')
                .select(`
                    *,
                    team:teams(id, name, logo_url),
                    match_participants(user_id, status, joined_at, waitlist_position, profiles(photo_url, name, reputation))
                `)
                .neq('status', 'Cancelado')
                .eq('is_private', false)
                .order('date', { ascending: true });

            if (publicError) {
                if (isSchemaMismatchError(publicError)) {
                    console.warn("Database schema missing or incomplete.");
                    setDbSetupRequired(true);
                    return;
                }
                throw publicError;
            }

            const publicMatches = publicData?.map(m => ({
                ...m,
                date: new Date(m.date)
            })) || [];

            // Fetch user's private matches
            const privateMatches = await fetchUserPrivateMatches();

            // Merge public and private matches
            const allMatches = [...publicMatches, ...privateMatches];

            // Sort with boost priority
            const sortedMatches = allMatches.sort((a, b) => {
                const now = new Date();
                const aIsBoosted = a.is_boosted && a.boost_until && new Date(a.boost_until) > now;
                const bIsBoosted = b.is_boosted && b.boost_until && new Date(b.boost_until) > now;

                if (aIsBoosted && !bIsBoosted) return -1;
                if (!aIsBoosted && bIsBoosted) return 1;
                return a.date.getTime() - b.date.getTime();
            });

            setMatches(sortedMatches);
        } catch (error: any) {
            console.error('Error fetching matches:', error.message);
        }
    }, [fetchUserPrivateMatches]);

    // Back Button & Navigation Handler
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // Prevent default pushState in the effect
            isPopping.current = true;

            if (activePage === 'explore') {
                // We are at root, trying to go back
                if (exitAttemptRef.current) {
                    console.log('[Telemetry] double_back_exit_attempt: success');
                    // Allow exit. We are currently at the state BEFORE the guard.
                    window.history.back();
                } else {
                    console.log('[Telemetry] double_back_exit_attempt: first_press');
                    exitAttemptRef.current = true;
                    setShowExitToast(true);
                    // Restore the guard state so we stay "in app" logically
                    window.history.pushState({ page: 'explore' }, '');

                    setTimeout(() => {
                        exitAttemptRef.current = false;
                        console.log('[Telemetry] double_back_exit_attempt: timeout');
                    }, 2000);
                }
            } else {
                // Normal navigation back
                const targetPage = event.state?.page || 'explore';
                setActivePage(targetPage);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activePage]);

    // Push state on navigation
    useEffect(() => {
        if (isPopping.current) {
            isPopping.current = false;
            return;
        }

        // Push state to record history
        window.history.pushState({ page: activePage }, '');
    }, [activePage]);

    useEffect(() => {
        const checkDb = async () => {
            try {
                const { error } = await supabase.from('matches').select('count', { count: 'exact', head: true });
                if (error && isSchemaMismatchError(error)) {
                    setDbSetupRequired(true);
                } else {
                    await fetchMatches();
                }
            } catch (e) {
                console.error("DB Check failed", e);
                setDbSetupRequired(true);
            } finally {
                setIsLoadingDbCheck(false);
            }
        };
        checkDb();
    }, [fetchMatches]);

    const fetchUserProfile = useCallback(async (user: User): Promise<Profile | null> => {
        // Mapper function to convert snake_case from DB to camelCase for the app
        const mapProfileData = (data: any, balance: number = 0, emailFromAuth?: string): Profile | null => {
            if (!data) return null;
            return {
                id: data.id,
                name: data.name,
                email: data.email || emailFromAuth,
                photoUrl: data.photo_url,
                dateOfBirth: data.date_of_birth,
                city: data.city,
                state: data.state,
                sport: data.sport,
                position: data.position,
                bio: data.bio,
                points: data.points,
                matchesPlayed: data.matches_played,
                reputation: data.reputation,
                bannerUrl: data.banner_url,
                favoriteTeam: data.favorite_team,
                favoriteTeamLogoUrl: data.favorite_team_logo_url,
                matchCoins: balance, // Mapped balance
                available_roles: data.available_roles,
                coach_specialties: data.coach_specialties,
            };
        };

        let profile: Profile | null = null;
        for (let i = 0; i < 4; i++) {
            try {
                try {
                    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

                    if (data) {
                        // Fetch tokens separately (simplest way without view)
                        const { data: tokenData } = await supabase.from('tokens').select('balance').eq('user_id', user.id).single();
                        const balance = tokenData?.balance || 0;

                        profile = mapProfileData(data, balance, user.email);
                        break;
                    }

                    if (error && (error.code === 'PGRST116' || error.message.includes('Failed to fetch'))) {
                        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                    } else if (error) {
                        console.error('Error fetching user profile:', error.message);
                        return null;
                    }
                } catch (fetchError) {
                    console.warn(`Fetch attempt ${i + 1} failed:`, fetchError);
                    await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                }
            } catch (networkError) {
                console.warn(`Network error fetching profile (attempt ${i + 1}):`, networkError);
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
        }

        if (!profile) {
            console.warn('Could not find profile after retries, creating fallback.');
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .insert({ id: user.id, name: user.email?.split('@')[0] || 'Novo Jogador', photo_url: user.user_metadata.avatar_url || `https://picsum.photos/seed/${user.id}/200` })
                    .select()
                    .single();
                if (error) {
                    console.error('Error creating fallback profile:', error.message);
                    return null;
                }
                // Fallback profile usually starts with 10 coins due to trigger, but we can default to 0 safely here
                profile = mapProfileData(data, 10, user.email);
            } catch (fallbackError) {
                console.error("Failed to create fallback profile:", fallbackError);
                setProfileError(true);
                return null;
            }
        }

        // DYNAMIC SCORE CALCULATION
        if (profile) {
            try {
                const { count: createdCount } = await supabase
                    .from('matches')
                    .select('*', { count: 'exact', head: true })
                    .eq('created_by', user.id)
                    .neq('status', 'Cancelado');

                const { count: playedCount } = await supabase
                    .from('match_participants')
                    .select('match_id, matches!inner(status)', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .neq('matches.status', 'Cancelado');

                const cCount = createdCount || 0;
                const pCount = playedCount || 0;

                profile.points = (cCount * 3) + (pCount * 1);
                profile.matchesPlayed = pCount;

            } catch (err) {
                console.error("Error calculating dynamic profile score:", err);
            }
        }

        setProfileError(false);
        setCurrentUser(profile);
        return profile;
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        if (isLoadingDbCheck || dbSetupRequired) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                await fetchUserProfile(session.user);

                // Retry logic for fetching user matches
                for (let i = 0; i < 3; i++) {
                    try {
                        const { data: participantData, error: participantError } = await supabase
                            .from('match_participants')
                            .select('match_id')
                            .eq('user_id', session.user.id);

                        if (participantError) throw participantError;

                        if (participantData) {
                            const ids = new Set<number>(participantData.map(p => p.match_id));
                            setJoinedMatchIds(ids);
                        }
                        break; // Success
                    } catch (error: any) {
                        const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed') || error.name === 'TypeError';
                        if (i === 2 || !isNetworkError) {
                            console.error("Error fetching user's matches:", (error as AuthError)?.message ?? error);
                        } else {
                            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                        }
                    }
                }

            } else {
                setCurrentUser(null);
                setJoinedMatchIds(new Set<number>());
            }
        });

        // Real-time subscription for matches
        const matchesSubscription = supabase
            .channel('public:matches')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'matches' },
                (payload) => {
                    const timestamp = new Date().toLocaleTimeString('pt-BR');
                    console.log(`\n🔔 [${timestamp}] Real-time event:`, payload.eventType);

                    // Log boost-related changes for UPDATE events
                    if (payload.eventType === 'UPDATE' && (payload.old.is_boosted !== payload.new.is_boosted || payload.old.boost_until !== payload.new.boost_until)) {
                        console.log('🚀 BOOST UPDATE:');
                        console.log('  Match ID:', payload.new.id);
                        console.log('  is_boosted:', payload.old.is_boosted, '→', payload.new.is_boosted);
                        console.log('  boost_until:', payload.old.boost_until, '→', payload.new.boost_until);
                    }

                    setMatches(prev => {
                        let updatedMatches = [...prev];

                        if (payload.eventType === 'INSERT') {
                            const newMatch = { ...payload.new, date: new Date(payload.new.date) } as Match;
                            // Avoid duplicates if insert happens twice or locally first
                            if (!updatedMatches.find(m => m.id === newMatch.id)) {
                                updatedMatches.push(newMatch);
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            // Merge strategy: maintain existing object reference/props, overwrite with new data
                            updatedMatches = updatedMatches.map(m => {
                                if (m.id === payload.new.id) {
                                    // CRITICAL FIX: If payload.new.date is missing (partial update), keep existing date.
                                    // Otherwise new Date(undefined) -> Invalid Date -> NaN sort -> broken list.
                                    const newDate = payload.new.date ? new Date(payload.new.date) : m.date;
                                    return { ...m, ...payload.new, date: newDate };
                                }
                                return m;
                            });
                        } else if (payload.eventType === 'DELETE') {
                            updatedMatches = updatedMatches.filter(m => m.id !== payload.old.id);
                        }

                        // Always re-sort after any change to ensure boosted matches jump to top
                        return updatedMatches.sort((a, b) => {
                            const now = new Date();
                            // Check for active boost
                            const aIsBoosted = a.is_boosted && a.boost_until && new Date(a.boost_until) > now;
                            const bIsBoosted = b.is_boosted && b.boost_until && new Date(b.boost_until) > now;

                            // 1. Priority: Boosted (Active)
                            if (aIsBoosted && !bIsBoosted) return -1;
                            if (!aIsBoosted && bIsBoosted) return 1;

                            // 2. Priority: Date (Soonest first)
                            return a.date.getTime() - b.date.getTime();
                        });
                    });
                }
            )
            .subscribe();

        // Real-time subscription for participants to keep filled_slots in sync
        const participantsSubscription = supabase
            .channel('public:match_participants')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'match_participants' },
                async (payload) => {
                    console.log('👥 Participant change:', payload.eventType);

                    // Adicionar delay para garantir consistência do DB (evitar race condition)
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Buscar lista atualizada de participantes para a partida afetada
                    const matchId = payload.eventType === 'DELETE' ? payload.old.match_id : payload.new.match_id;

                    const { data: updatedParticipants } = await supabase
                        .from('match_participants')
                        .select('user_id, status, joined_at, waitlist_position, profiles(photo_url, name, reputation)')
                        .eq('match_id', matchId);

                    setMatches(prev => prev.map(match => {
                        if (match.id === matchId) {
                            const confirmedCount = updatedParticipants?.filter(p => p.status === 'confirmed').length || 0;
                            return {
                                ...match,
                                filled_slots: confirmedCount,
                                match_participants: updatedParticipants || []
                            };
                        }
                        return match;
                    }));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            matchesSubscription.unsubscribe();
            participantsSubscription.unsubscribe();
        };
    }, [isLoadingDbCheck, dbSetupRequired, fetchUserProfile]);

    const fetchRankings = useCallback(async () => {
        // Retry logic for rankings
        for (let i = 0; i < 3; i++) {
            try {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, name, photo_url');

                if (profilesError) throw profilesError;


                const { data: matchesData, error: matchesError } = await supabase
                    .from('matches')
                    .select('id, created_by')
                    .neq('status', 'Cancelado');

                if (matchesError) throw matchesError;

                const { data: participantsData, error: participantsError } = await supabase
                    .from('match_participants')
                    .select('match_id, user_id');

                if (participantsError) throw participantsError;

                const validMatchIds = new Set(matchesData?.map(m => m.id) || []);
                const stats: Record<string, { created: number, played: number }> = {};

                profiles?.forEach(p => {
                    stats[p.id] = { created: 0, played: 0 };
                });

                matchesData?.forEach(m => {
                    if (stats[m.created_by]) {
                        stats[m.created_by].created += 1;
                    }
                });

                participantsData?.forEach(p => {
                    if (validMatchIds.has(p.match_id) && stats[p.user_id]) {
                        stats[p.user_id].played += 1;
                    }
                });

                const formattedRankings: Ranking[] = (profiles || []).map((profile) => {
                    const userStats = stats[profile.id] || { created: 0, played: 0 };
                    const score = (userStats.created * 3) + (userStats.played * 1);

                    return {
                        rank: 0,
                        user: { id: profile.id, name: profile.name, photoUrl: profile.photo_url },
                        points: score,
                        stats: userStats
                    };
                });

                formattedRankings.sort((a, b) => b.points - a.points);
                const finalRankings = formattedRankings.map((r, i) => ({ ...r, rank: i + 1 }));

                setRankings(finalRankings);
                return; // Success
            } catch (error: any) {
                const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed') || error.name === 'TypeError';
                if (i === 2 || !isNetworkError) {
                    console.error('Error fetching rankings:', (error as any)?.message ?? error);
                } else {
                    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                }
            }
        }
    }, []);

    useEffect(() => {
        if (activePage === 'ranking') {
            fetchRankings();
        }
    }, [activePage, fetchRankings]);

    useEffect(() => {
        if (isLoadingDbCheck || dbSetupRequired || !isAuthenticated) return;

        fetchMatches();
        fetchRankings();
    }, [isLoadingDbCheck, dbSetupRequired, isAuthenticated, fetchMatches, fetchRankings]);

    useEffect(() => {
        if (currentUser && activePage === 'invite-landing') {
            // User is already logged in, so just show them the app (Explore)
            // gracefully instead of the invite landing page.
            window.history.replaceState({}, '', '/');
            setActivePage('explore');
            setShowConfirmation("Bem-vindo de volta! ⚽");
            setTimeout(() => setShowConfirmation(null), 3000);
        }
    }, [currentUser, activePage]);

    // Deep linking: Abrir partida específica via URL ou Invite Code
    useEffect(() => {
        const handleDeepLink = async () => {
            if (!isAuthenticated) return;

            const urlParams = new URLSearchParams(window.location.search);
            const matchId = urlParams.get('match');
            const inviteCode = urlParams.get('invite');

            if (matchId) {
                // Check if match is already in the list (public matches)
                const match = matches.find(m => m.id === Number(matchId));
                if (match) {
                    setSelectedMatch(match);
                    window.history.replaceState({}, '', window.location.pathname);
                } else {
                    // Try to fetch it specifically (could be private or not loaded yet)
                    const { data, error } = await supabase
                        .from('matches')
                        .select('*, match_participants(user_id, status, joined_at, waitlist_position, profiles(photo_url, name))')
                        .eq('id', matchId)
                        .single();

                    if (data && !error) {
                        const parsedMatch = { ...data, date: new Date(data.date) };
                        setSelectedMatch(parsedMatch);
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                }
            } else if (inviteCode) {
                // Handle Invite Code
                const { data, error } = await supabase
                    .from('matches')
                    .select('*, match_participants(user_id, status, joined_at, waitlist_position, profiles(photo_url, name))')
                    .eq('invite_code', inviteCode)
                    .single();

                if (data && !error) {
                    const parsedMatch = { ...data, date: new Date(data.date) };
                    setSelectedMatch(parsedMatch);
                    setMatches(prev => {
                        if (!prev.find(m => m.id === parsedMatch.id)) {
                            return [...prev, parsedMatch];
                        }
                        return prev;
                    });
                    window.history.replaceState({}, '', window.location.pathname);
                    setShowConfirmation("Partida encontrada via convite! 🎟️");
                    setTimeout(() => setShowConfirmation(null), 3000);
                } else {
                    alert("Convite inválido ou expirado.");
                    window.history.replaceState({}, '', window.location.pathname);
                }
            }

            // Handle Team Invite
            const teamInviteCode = urlParams.get('invite_team');
            if (teamInviteCode) {
                try {
                    // 1. Get Team
                    const { data: team, error } = await supabase.from('teams').select('id, name').eq('invite_code', teamInviteCode).single();

                    if (team && !error) {
                        if (window.confirm(`Você foi convidado para entrar no time "${team.name}". Deseja entrar?`)) {
                            const { error: joinError } = await supabase.from('team_members').insert({
                                team_id: team.id,
                                user_id: currentUser.id,
                                status: 'approved',
                                role: 'member'
                            });

                            if (joinError) {
                                if (joinError.code === '23505') alert("Você já faz parte deste time.");
                                else alert("Erro ao entrar no time.");
                            } else {
                                setShowConfirmation("Você entrou no time " + team.name + "! 🛡️");
                                setTimeout(() => setShowConfirmation(null), 3000);
                                fetchMatches();
                            }
                        }
                    } else {
                        alert("Convite de time inválido.");
                    }
                } catch (e) {
                    console.error(e);
                }
                window.history.replaceState({}, '', window.location.pathname);
            }
        };

        handleDeepLink();
    }, [isAuthenticated, matches, currentUser]);

    const handleCreateMatch = useCallback(async (newMatch: Omit<Match, 'id' | 'filled_slots' | 'created_by' | 'status' | 'cancellation_reason'>) => {
        if (!currentUser) return;
        try {
            // Generate invite code for private matches
            let invite_code = null;
            if (newMatch.is_private) {
                invite_code = generateInviteCode();
            }

            const { data, error } = await supabase.rpc('create_match_with_tokens', {
                p_name: newMatch.name,
                p_sport: newMatch.sport,
                p_location: newMatch.location,
                p_lat: newMatch.lat,
                p_lng: newMatch.lng,
                p_date: newMatch.date.toISOString(),
                p_slots: newMatch.slots,
                p_rules: newMatch.rules,
                p_is_private: newMatch.is_private,
                p_invite_code: invite_code,
                p_team_id: newMatch.team_id // Add team_id
            });

            if (error) throw error;

            // OPTIMIZATION: Update local state immediately instead of fetching all matches
            if (data) {
                const createdMatch = { ...data, date: new Date(data.date) };
                setMatches(prev => [...prev, createdMatch].sort((a, b) => a.date.getTime() - b.date.getTime()));
            }

            // OPTIMIZATION: Optimistically update user balance (-3 coins, +3 points)
            setCurrentUser(prev => prev ? ({
                ...prev,
                matchCoins: Math.max(0, prev.matchCoins - 3),
                points: prev.points + 3,
                matchesPlayed: prev.matchesPlayed
            }) : null);

            // Sync profile in background without blocking UI
            if (session?.user) fetchUserProfile(session.user).catch(console.error);

            setActivePage('explore');
            setDraftMatchData(null);
            setShowConfirmation("Partida criada! (3 MatchCoins usadas)");
            setTimeout(() => setShowConfirmation(null), 3000);
        } catch (error) {
            const msg = (error as AuthError)?.message ?? 'Unknown error';
            if (msg.includes('INSUFFICIENT_FUNDS')) {
                alert("Saldo insuficiente de MatchCoins. Você precisa de 3 tokens para criar uma partida.");
            } else {
                console.error('Error creating match:', msg);
                alert(`Erro ao criar partida: ${msg}`);
            }
        }
    }, [currentUser, fetchUserProfile, session]);

    const handleNavigateToCreateMatch = useCallback((teamId: number, teamName: string) => {
        setDraftMatchData({
            teamId,
            teamName,
            name: `${teamName} vs ...`,
            sport: 'Futebol', // Default or can be dynamic
            location: '',
            date: '',
            time: '',
            slots: 14 // Default for 7x7
        });
        setActivePage('create');
    }, []);

    const handleJoinMatch = useCallback(async (matchId: number) => {
        if (!currentUser) {
            alert('Faça login para participar da partida.');
            return;
        }

        try {
            // Use new RPC call for atomic transaction (deduct token + join match)
            const { data: status, error } = await supabase.rpc('join_match_with_token', {
                p_match_id: matchId
            });

            if (error) {
                console.error("Error joining match:", error);
                alert("Erro ao entrar na partida. Tente novamente.");
                return;
            }

            if (status === 'OK' || status === 'confirmed') {
                // Success: Update local state optimistically
                setJoinedMatchIds(prev => new Set(prev).add(matchId));

                // Atualiza visualmente adicionando o participante e incrementando contador
                setMatches(prev => prev.map(m => {
                    if (m.id === matchId) {
                        const currentParticipants = m.match_participants || [];
                        const wasAlreadyInList = currentParticipants.some(p => p.user_id === currentUser.id);
                        const filteredParticipants = currentParticipants.filter(p => p.user_id !== currentUser.id);

                        const newParticipant: MatchParticipant = {
                            match_id: matchId,
                            user_id: currentUser.id,
                            joined_at: new Date().toISOString(),
                            status: 'confirmed',
                            profiles: currentUser
                        };

                        return {
                            ...m,
                            // Só incrementa se não estava na lista antes
                            filled_slots: wasAlreadyInList ? m.filled_slots : (m.filled_slots || 0) + 1,
                            match_participants: [...filteredParticipants, newParticipant]
                        };
                    }
                    return m;
                }));

                setCurrentUser(prev => prev ? ({
                    ...prev,
                    matchCoins: Math.max(0, prev.matchCoins - 1),
                    points: prev.points + 1,
                    matchesPlayed: prev.matchesPlayed + 1
                }) : null);

                if (session?.user) fetchUserProfile(session.user).catch(console.error);

                setShowConfirmation("Você entrou na partida! 1 MatchCoin foi utilizado.");
                setTimeout(() => setShowConfirmation(null), 3000);
            } else if (status === 'NO_TOKENS') {
                if (window.confirm("Você não tem MatchCoins suficientes para entrar nessa partida. Deseja ir para sua carteira?")) {
                    setActivePage('wallet');
                }
            } else if (status === 'MATCH_FULL') {
                alert("Essa partida está cheia no momento.");
            } else if (status === 'MATCH_CLOSED') {
                alert("Essa partida não está mais aceitando jogadores.");
            } else if (status === 'ALREADY_IN') {
                // Se já está na partida, apenas sincroniza o estado local
                setJoinedMatchIds(prev => new Set(prev).add(matchId));

                // Atualiza visualmente a lista e contador
                setMatches(prev => prev.map(m => {
                    if (m.id === matchId) {
                        const currentParticipants = m.match_participants || [];
                        const wasAlreadyInList = currentParticipants.some(p => p.user_id === currentUser.id);
                        const filteredParticipants = currentParticipants.filter(p => p.user_id !== currentUser.id);

                        const newParticipant: MatchParticipant = {
                            match_id: matchId,
                            user_id: currentUser.id,
                            joined_at: new Date().toISOString(),
                            status: 'confirmed',
                            profiles: currentUser
                        };

                        return {
                            ...m,
                            // Só incrementa se não estava na lista antes
                            filled_slots: wasAlreadyInList ? m.filled_slots : (m.filled_slots || 0) + 1,
                            match_participants: [...filteredParticipants, newParticipant]
                        };
                    }
                    return m;
                }));

                setShowConfirmation("Você já está confirmado nesta partida!");
                setTimeout(() => setShowConfirmation(null), 3000);
            } else if (status === 'MATCH_NOT_FOUND') {
                alert("Partida não encontrada. Atualize a tela.");
            } else if (status === 'NOT_AUTHENTICATED') {
                alert("Você precisa estar logado para participar da partida.");
            } else {
                alert(`Não foi possível entrar: ${status}`);
            }

        } catch (e) {
            console.error("Exception joining match:", e);
            alert("Erro inesperado ao entrar na partida.");
        }
    }, [currentUser, session, fetchUserProfile]);

    const handleLeaveMatch = useCallback(async (matchId: number) => {
        if (!currentUser) return;

        try {
            // Use new RPC call for atomic transaction (delete participant + refund token)
            const { data: status, error } = await supabase.rpc('leave_match_with_refund', {
                p_match_id: matchId
            });

            if (error) {
                console.error('Error leaving match:', error.message);
                alert(`Erro ao sair da partida. Tente novamente.`);
                return;
            }

            if (status === 'OK') {
                // Success: Update local state optimistically
                setJoinedMatchIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(matchId);
                    return newSet;
                });

                // Atualiza visualmente removendo o participante e decrementando contador
                setMatches(prev => prev.map(m => {
                    if (m.id === matchId) {
                        const wasInList = m.match_participants?.some(p => p.user_id === currentUser.id);
                        return {
                            ...m,
                            // Só decrementa se estava na lista
                            filled_slots: wasInList ? Math.max(0, (m.filled_slots || 0) - 1) : m.filled_slots,
                            match_participants: m.match_participants?.filter(p => p.user_id !== currentUser.id) || []
                        };
                    }
                    return m;
                }));
                // NOTE: filled_slots is updated via realtime subscription to avoid double counting

                setCurrentUser(prev => prev ? ({
                    ...prev,
                    matchCoins: prev.matchCoins + 1,
                    points: Math.max(0, prev.points - 1),
                    matchesPlayed: Math.max(0, prev.matchesPlayed - 1)
                }) : null);

                setShowConfirmation("Você saiu da partida. 1 MatchCoin foi devolvido.");
                setTimeout(() => setShowConfirmation(null), 3000);
            } else if (status === 'NOT_IN_MATCH') {
                alert("Você já não está mais nessa partida.");
                // Sync state anyway to fix UI
                setJoinedMatchIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(matchId);
                    return newSet;
                });

                // Também limpa visualmente e decrementa contador
                setMatches(prev => prev.map(m => {
                    if (m.id === matchId) {
                        const wasInList = m.match_participants?.some(p => p.user_id === currentUser.id);
                        return {
                            ...m,
                            // Só decrementa se estava na lista
                            filled_slots: wasInList ? Math.max(0, (m.filled_slots || 0) - 1) : m.filled_slots,
                            match_participants: m.match_participants?.filter(p => p.user_id !== currentUser.id) || []
                        };
                    }
                    return m;
                }));
            } else if (status === 'NOT_AUTHENTICATED') {
                alert("Você precisa estar logado.");
            } else {
                alert(`Erro ao sair: ${status}`);
            }

        } catch (e) {
            console.error("Exception leaving match:", e);
            alert("Erro inesperado ao sair da partida.");
        }
    }, [currentUser]);

    const handleCancelMatch = useCallback(async (matchId: number, reason: string) => {
        if (!currentUser) {
            alert('Faça login para gerenciar partidas.');
            return;
        }

        // 1. Verificar participantes novamente para garantir integridade (Cenário A vs B)
        let shouldRefund = false;
        try {
            const { count, error: countError } = await supabase
                .from('match_participants')
                .select('*', { count: 'exact', head: true })
                .eq('match_id', matchId);

            if (!countError && count === 0) {
                shouldRefund = true;
            }
        } catch (e) {
            console.error("Error checking participants for refund", e);
        }

        // 2. Cancelar a partida
        const { error } = await supabase.rpc("cancel_match", {
            p_match_id: matchId,
            p_user_id: currentUser.id,
            p_reason: reason,
        });

        if (error) {
            console.error("Erro ao cancelar partida:", error.message);
            alert("❌ Erro ao cancelar a partida: " + error.message);
            return;
        }

        // 3. Processar Reembolso (Cenário B)
        if (shouldRefund) {
            const { error: refundError } = await supabase.rpc('add_tokens', {
                p_user_id: currentUser.id,
                amount: 2
            });

            if (!refundError) {
                // Atualizar saldo localmente
                setCurrentUser(prev => prev ? ({ ...prev, matchCoins: prev.matchCoins + 2 }) : null);
                setShowConfirmation("Partida cancelada e 2 MatchCoins reembolsados");
            } else {
                console.error("Erro no reembolso:", refundError);
                setShowConfirmation("Partida cancelada, mas houve um erro ao processar o reembolso.");
            }
        } else {
            // Cenário A
            setShowConfirmation("Partida cancelada com sucesso.");
        }

        setTimeout(() => setShowConfirmation(null), 4000);

        // 4. Atualizar lista de partidas localmente
        setMatches(prevMatches =>
            prevMatches.map(m =>
                m.id === matchId
                    ? { ...m, status: 'Cancelado', cancellation_reason: reason }
                    : m
            )
        );
    }, [currentUser]);

    const handleBoostMatch = useCallback(async (matchId: number) => {
        if (!currentUser) return false;

        try {
            // 1. Deduct tokens
            const { data: rpcData, error: rpcError } = await supabase.rpc('spend_tokens', {
                p_user_id: currentUser.id,
                amount: 2
            });

            if (rpcError) throw rpcError;
            if (rpcData === 'INSUFFICIENT_FUNDS') {
                alert("Saldo insuficiente de MatchCoins. Você precisa de 2 tokens.");
                return false;
            }

            // 2. Calculate boost_until
            const boostUntil = new Date();
            boostUntil.setHours(boostUntil.getHours() + 12);

            // 3. Update database
            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    is_boosted: true,
                    boost_until: boostUntil.toISOString()
                })
                .eq('id', matchId);

            if (updateError) throw updateError;

            // 4. Update local state
            setMatches(prevMatches => {
                const updated = prevMatches.map(m =>
                    m.id === matchId
                        ? { ...m, is_boosted: true, boost_until: boostUntil.toISOString() }
                        : m
                );

                // Reorder: boosted matches first, then by date
                return updated.sort((a, b) => {
                    const now = new Date();
                    const aIsBoosted = a.is_boosted && a.boost_until && new Date(a.boost_until) > now;
                    const bIsBoosted = b.is_boosted && b.boost_until && new Date(b.boost_until) > now;

                    if (aIsBoosted && !bIsBoosted) return -1;
                    if (!aIsBoosted && bIsBoosted) return 1;
                    return a.date.getTime() - b.date.getTime();
                });
            });

            // 5. Update user balance locally
            setCurrentUser(prev => prev ? ({ ...prev, matchCoins: prev.matchCoins - 2 }) : null);

            setShowConfirmation("🚀 Partida impulsionada com sucesso!");
            setTimeout(() => setShowConfirmation(null), 3000);
            return true;

        } catch (error) {
            console.error('Error boosting match:', error);
            alert('Erro ao impulsionar partida.');
            return false;
        }
    }, [currentUser]);

    // --- Participant Management Handlers ---

    const handleApproveParticipant = useCallback(async (matchId: number, userId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('match_participants')
                .update({ status: 'confirmed' })
                .eq('match_id', matchId)
                .eq('user_id', userId);

            if (error) throw error;

            // Update local state
            setMatches(prev => prev.map(m => {
                if (m.id !== matchId) return m;
                const updatedParticipants = m.match_participants?.map(p =>
                    p.user_id === userId ? { ...p, status: 'confirmed' } : p
                );
                return { ...m, match_participants: updatedParticipants, filled_slots: m.filled_slots + 1 };
            }));

            alert("Participante aprovado!");
        } catch (error: any) {
            console.error("Error approving participant:", error);
            alert("Erro ao aprovar participante.");
        }
    }, [currentUser]);

    const handleDeclineParticipant = useCallback(async (matchId: number, userId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('match_participants')
                .delete()
                .eq('match_id', matchId)
                .eq('user_id', userId);

            if (error) throw error;

            // Update local state
            setMatches(prev => prev.map(m => {
                if (m.id !== matchId) return m;
                const updatedParticipants = m.match_participants?.filter(p => p.user_id !== userId);
                return { ...m, match_participants: updatedParticipants };
            }));

            alert("Participante recusado/removido.");
        } catch (error: any) {
            console.error("Error declining participant:", error);
            alert("Erro ao recusar participante.");
        }
    }, [currentUser]);

    const handleRemoveParticipant = useCallback(async (matchId: number, userId: string) => {
        if (!currentUser) return;
        if (!window.confirm("Tem certeza que deseja remover este jogador?")) return;

        try {
            // We use the same logic as decline, but maybe we want to refund?
            // For now, let's assume manual removal by host might imply refund or not.
            // Let's use the simple delete for now, similar to decline.
            // Ideally, we should use an RPC if we want to handle refunds safely.
            // But for MVP, direct delete is fine, assuming no automatic refund for forced removal (or maybe yes).
            // Let's stick to simple delete for consistency with 'decline'.

            const { error } = await supabase
                .from('match_participants')
                .delete()
                .eq('match_id', matchId)
                .eq('user_id', userId);

            if (error) throw error;

            setMatches(prev => prev.map(m => {
                if (m.id !== matchId) return m;
                const updatedParticipants = m.match_participants?.filter(p => p.user_id !== userId);
                return { ...m, match_participants: updatedParticipants, filled_slots: Math.max(0, m.filled_slots - 1) };
            }));

            alert("Participante removido.");
        } catch (error: any) {
            console.error("Error removing participant:", error);
            alert("Erro ao remover participante.");
        }
    }, [currentUser]);

    const handlePromoteFromWaitlist = useCallback(async (matchId: number, userId: string) => {
        if (!currentUser) return;
        try {
            // Check slots first (optimistic check)
            const match = matches.find(m => m.id === matchId);
            if (match && match.filled_slots >= match.slots) {
                alert("A partida já está cheia!");
                return;
            }

            const { error } = await supabase
                .from('match_participants')
                .update({ status: 'confirmed', waitlist_position: null })
                .eq('match_id', matchId)
                .eq('user_id', userId);

            if (error) throw error;

            setMatches(prev => prev.map(m => {
                if (m.id !== matchId) return m;
                const updatedParticipants = m.match_participants?.map(p =>
                    p.user_id === userId ? { ...p, status: 'confirmed', waitlist_position: null } : p
                );
                return { ...m, match_participants: updatedParticipants, filled_slots: m.filled_slots + 1 };
            }));

            alert("Participante promovido da lista de espera!");
        } catch (error: any) {
            console.error("Error promoting participant:", error);
            alert("Erro ao promover participante.");
        }
    }, [currentUser, matches]);

    const handleLogin = useCallback(async (email?: string, password?: string) => {
        if (!email || !password) return;
        setLoginError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            setActivePage('explore');
        } catch (error: any) {
            let message = error.message || 'An unknown login error occurred.';

            if (message.includes('Invalid login credentials')) {
                message = 'E-mail ou senha incorretos.';
            } else if (message.includes('Email not confirmed')) {
                message = 'E-mail não confirmado. Verifique sua caixa de entrada.';
            }

            setLoginError(message);
            console.error('Login Error:', error);
        }
    }, []);

    const handleGoogleLogin = async () => {
        setLoginError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) setLoginError(error.message);
    }

    const clearLoginError = useCallback(() => {
        setLoginError(null);
    }, []);

    const handleRegister = useCallback(async (newUser: NewUserRegistrationData) => {
        setLoginError(null);
        console.log("Iniciando registro para:", newUser.email);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newUser.email!,
                password: newUser.password!,
                options: {
                    data: {
                        full_name: newUser.name,
                        avatar_url: newUser.photoUrl,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Registration failed, user not created.");

            console.log("Usuário criado:", authData.user.id);

            if (!authData.session) {
                console.log("Sessão não criada. Provavelmente requer confirmação de e-mail.");
                alert("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de fazer login.");
                setActivePage('explore');
                return;
            }

            console.log("Atualizando perfil...");
            const profileUpdateData = {
                date_of_birth: newUser.dateOfBirth,
                city: newUser.city,
                state: newUser.state,
                sport: newUser.sport,
                position: newUser.position,
                bio: newUser.bio,
                available_roles: newUser.available_roles,
                coach_specialties: newUser.coach_specialties,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(profileUpdateData)
                .eq('id', authData.user.id);

            if (updateError) {
                console.warn(`Registration successful, but failed to update profile details: ${updateError.message}`);
            } else {
                console.log("Perfil atualizado com sucesso.");
            }

            setActivePage('profile');
        } catch (error: any) {
            let message = error.message || 'An unknown registration error occurred.';
            if (message.includes('User already registered')) {
                message = 'Este e-mail já está cadastrado. Tente fazer login.';
            }
            setLoginError(message);
            console.error('Registration Error:', error);
            throw error;
        }
    }, []);

    const handleUpdateUser = useCallback(async (updatedUser: Profile) => {
        if (!session?.user) {
            console.error("No user session found. Cannot update profile.");
            return;
        }
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: updatedUser.name,
                    photo_url: updatedUser.photoUrl,
                    date_of_birth: updatedUser.dateOfBirth,
                    city: updatedUser.city,
                    state: updatedUser.state,
                    sport: updatedUser.sport,
                    position: updatedUser.position,
                    bio: updatedUser.bio,
                    banner_url: updatedUser.bannerUrl,
                    favorite_team: updatedUser.favoriteTeam,
                    favorite_team_logo_url: updatedUser.favoriteTeamLogoUrl,
                    available_roles: updatedUser.available_roles,
                    coach_specialties: updatedUser.coach_specialties,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', updatedUser.id);

            if (error) throw error;

            setCurrentUser(updatedUser);

            setShowConfirmation("Perfil atualizado com sucesso!");
            setTimeout(() => setShowConfirmation(null), 3000);
            await fetchRankings();
        } catch (error) {
            console.error('Error updating profile:', (error as AuthError)?.message ?? error);
            throw error;
        }
    }, [session, fetchRankings]);

    const handleBalanceUpdate = useCallback((amount: number) => {
        setCurrentUser(prev => prev ? ({ ...prev, matchCoins: prev.matchCoins + amount }) : null);
    }, []);

    const handleLogout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
            alert(`Erro ao tentar sair: ${error.message}`);
        }
        setActivePage('explore');
    }, []);

    const handleDeleteCanceledMatches = useCallback(async () => {
        if (!currentUser) {
            alert('Faça login para gerenciar suas partidas.');
            return;
        }

        const confirmed = window.confirm(
            "Tem certeza que deseja excluir permanentemente suas partidas CANCELADAS? As partidas ativas não serão afetadas."
        );
        if (!confirmed) {
            return;
        }

        try {
            const { error } = await supabase
                .from('matches')
                .delete()
                .eq('created_by', currentUser.id)
                .eq('status', 'Cancelado');

            if (error) throw error;

            await fetchMatches();
            setShowConfirmation("Suas partidas canceladas foram excluídas!");
            setTimeout(() => setShowConfirmation(null), 3000);
        } catch (error) {
            console.error('Error deleting canceled matches:', (error as AuthError)?.message ?? error);
            alert(`Erro ao excluir partidas canceladas: ${(error as AuthError)?.message ?? error}`);
        }
    }, [currentUser, fetchMatches]);

    const handleStartEditMatch = useCallback((match: Match) => {
        setEditingMatch(match);
        setActivePage('create');
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingMatch(null);
        setDraftMatchData(null);
        setActivePage('explore');
    }, []);

    const handleUpdateMatch = useCallback(async (updatedMatch: Match) => {
        // Optimistic Update: Update UI immediately
        const previousMatches = matches;
        setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
        setEditingMatch(null);
        setActivePage('explore');
        setShowConfirmation("Salvando alterações...");

        try {
            const { error } = await supabase
                .from('matches')
                .update({
                    name: updatedMatch.name,
                    sport: updatedMatch.sport,
                    location: updatedMatch.location,
                    lat: updatedMatch.lat,
                    lng: updatedMatch.lng,
                    date: updatedMatch.date.toISOString(),
                    slots: updatedMatch.slots,
                    rules: updatedMatch.rules,
                })
                .eq('id', updatedMatch.id);

            if (error) throw error;

            setShowConfirmation("Partida atualizada com sucesso!");
            setTimeout(() => setShowConfirmation(null), 3000);
        } catch (error) {
            console.error('Error updating match:', (error as AuthError)?.message ?? error);
            alert(`Erro ao atualizar a partida: ${(error as AuthError)?.message ?? error}`);
            // Revert optimistic update
            setMatches(previousMatches);
        }
    }, [matches]);

    const handleDraftMatch = useCallback((draftData: DraftMatchData) => {
        if (!currentUser) {
            alert("Você precisa estar logado para criar uma partida.");
            return;
        }
        setDraftMatchData(draftData);
        setEditingMatch(null);
        setActivePage('create');
        setShowConfirmation("Dados da partida preenchidos! Revise e salve.");
        setTimeout(() => setShowConfirmation(null), 4000);
    }, [currentUser]);

    const handleNavigateToMatchChat = useCallback((matchId: number) => {
        setSelectedChatMatchId(matchId);
        setActivePage('match-chat');
    }, []);

    const handleNavigateToDirectChat = useCallback((userId: string) => {
        setPrevPage(activePage);
        setSelectedDirectChatUserId(userId);
        setActivePage('direct-chat');
        setViewingPublicProfileId(null); // Close modal if open
    }, [activePage]);

    const handleNavigateToDirectMessagesList = useCallback(() => {
        setActivePage('direct-messages-list');
    }, []);

    useEffect(() => {
        if (isLoadingDbCheck || dbSetupRequired || !isAuthenticated) return;

        fetchMatches();
        fetchRankings();
    }, [isLoadingDbCheck, dbSetupRequired, isAuthenticated, fetchMatches, fetchRankings]);

    // Fetch user location once authenticated
    useEffect(() => {
        if (isAuthenticated && locationStatus === 'idle') {
            setLocationStatus('loading');
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        });
                        setLocationStatus('success');
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        setLocationStatus('error');
                    },
                    { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity }
                );
            } else {
                setLocationStatus('error');
            }
        }
    }, [isAuthenticated, locationStatus]);

    // Notification Listeners
    useEffect(() => {
        if (!currentUser) return;

        const fetchCounts = async () => {
            try {
                // Unread DMs
                const { count: dmCount } = await supabase
                    .from('direct_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('receiver_id', currentUser.id)
                    .is('read_at', null);
                setUnreadDMsCount(dmCount || 0);

                // Pending Friend Requests (where I am the recipient)
                const { count: frCount } = await supabase
                    .from('friendships')
                    .select('*', { count: 'exact', head: true })
                    .eq('friend_id', currentUser.id)
                    .eq('status', 'pending');
                setPendingFriendRequestsCount(frCount || 0);
            } catch (error) {
                console.error("Error fetching notification counts:", error);
            }
        };

        fetchCounts();

        // Listen for new DMs
        const dmChannel = supabase.channel('global-dm-notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `receiver_id=eq.${currentUser.id}`
            }, () => {
                setUnreadDMsCount(prev => prev + 1);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'direct_messages',
                filter: `receiver_id=eq.${currentUser.id}`
            }, (payload) => {
                if (payload.new.read_at) {
                    setUnreadDMsCount(prev => Math.max(0, prev - 1));
                }
            })
            .subscribe();

        // Listen for friend requests
        const frChannel = supabase.channel('global-fr-notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'friendships',
                filter: `friend_id=eq.${currentUser.id}`
            }, () => {
                setPendingFriendRequestsCount(prev => prev + 1);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'friendships',
                filter: `friend_id=eq.${currentUser.id}`
            }, (payload) => {
                if (payload.new.status === 'accepted' || payload.new.status === 'declined') {
                    setPendingFriendRequestsCount(prev => Math.max(0, prev - 1));
                }
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'friendships',
                filter: `friend_id=eq.${currentUser.id}`
            }, () => {
                setPendingFriendRequestsCount(prev => Math.max(0, prev - 1));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(dmChannel);
            supabase.removeChannel(frChannel);
        };
    }, [currentUser]);

    const renderPage = () => {
        switch (activePage) {
            case 'explore':
                return <Explore
                    matches={matches}
                    platformFeatures={platformFeatures}
                    onJoinMatch={handleJoinMatch}
                    onLeaveMatch={handleLeaveMatch}
                    joinedMatchIds={joinedMatchIds}
                    currentUser={currentUser!}
                    onCancelMatch={handleCancelMatch}
                    onDeleteCanceledMatches={handleDeleteCanceledMatches}
                    onEditMatch={handleStartEditMatch}
                    onNavigateToCreate={() => setActivePage('create')}
                    onRefreshMatches={fetchMatches}
                    onNavigateToProfile={() => setActivePage('profile')}
                    onNavigateToMap={() => setActivePage('map')}
                    onNavigateToMyGames={() => setActivePage('my-games')}
                    onNavigateToRanking={() => setActivePage('ranking')}
                    onNavigateToCommunity={() => setActivePage('community')}
                    onNavigateToArenas={() => setActivePage('arenas')}
                    onNavigateToMatchChat={() => setActivePage('match-chat')}
                    onNavigateToDirectChat={handleNavigateToDirectMessagesList}
                    onNavigateToNotifications={() => setActivePage('notifications')}
                    onNavigateToWallet={() => setActivePage('wallet')}
                    onBalanceUpdate={handleBalanceUpdate}
                    onBoostMatch={handleBoostMatch}
                    selectedMatch={selectedMatch}
                    onSelectMatch={setSelectedMatch}
                    onCloseMatchDetails={() => setSelectedMatch(null)}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    onViewPublicProfile={setViewingPublicProfileId}
                    userLocation={userLocation}
                    locationStatus={locationStatus}
                    unreadDMsCount={unreadDMsCount}
                    pendingFriendRequestsCount={pendingFriendRequestsCount}
                />;
            case 'create':
                return <CreateMatchForm
                    onCreateMatch={handleCreateMatch}
                    onUpdateMatch={handleUpdateMatch}
                    onCancelEdit={handleCancelEdit}
                    matchToEdit={editingMatch}
                    initialData={draftMatchData}
                    onNavigateBack={handleCancelEdit}
                />;
            case 'my-games':
                return <MyGames
                    matches={matches}
                    onJoinMatch={handleJoinMatch}
                    onLeaveMatch={handleLeaveMatch}
                    joinedMatchIds={joinedMatchIds}
                    currentUser={currentUser!}
                    onCancelMatch={handleCancelMatch}
                    onDeleteCanceledMatches={handleDeleteCanceledMatches}
                    onEditMatch={handleStartEditMatch}
                    onNavigateBack={() => setActivePage('explore')}
                    onNavigateToCreate={() => setActivePage('create')}
                    onBalanceUpdate={handleBalanceUpdate}
                    onBoostMatch={handleBoostMatch}
                    onNavigateToDirectChat={handleNavigateToMatchChat}
                    onApproveParticipant={handleApproveParticipant}
                    onDeclineParticipant={handleDeclineParticipant}
                    onRemoveParticipant={handleRemoveParticipant}
                    onPromoteFromWaitlist={handlePromoteFromWaitlist}
                    selectedMatch={selectedMatch}
                    onSelectMatch={setSelectedMatch}
                    onCloseMatchDetails={() => setSelectedMatch(null)}
                    onViewPublicProfile={setViewingPublicProfileId}
                    userLocation={userLocation}
                />;
            case 'match-chat':
                return <MatchChat
                    currentUser={currentUser!}
                    onNavigateBack={() => {
                        setSelectedChatMatchId(null);
                        setActivePage('explore');
                    }}
                    initialMatchId={selectedChatMatchId}
                />;
            case 'direct-messages-list':
                return <Suspense fallback={<ModernLoader />}>
                    <DirectMessagesList
                        currentUser={currentUser!}
                        onNavigateBack={() => setActivePage('explore')}
                        onNavigateToChat={handleNavigateToDirectChat}
                    />
                </Suspense>;
            case 'direct-chat':
                return <DirectChat
                    currentUser={currentUser!}
                    recipientId={selectedDirectChatUserId!}
                    onNavigateBack={() => {
                        setSelectedDirectChatUserId(null);
                        setActivePage(prevPage);
                    }}
                />;
            case 'profile':
                return <UserProfile
                    user={currentUser!}
                    onUpdateUser={handleUpdateUser}
                    onLogout={handleLogout}
                    onNavigateBack={() => setActivePage('explore')}
                    onNavigateToCreateMatch={handleNavigateToCreateMatch}
                    onViewPublicProfile={setViewingPublicProfileId}
                    onNavigateToDirectChat={handleNavigateToDirectChat}
                    initialSection={profileInitialSection}
                />;
            case 'ranking':
                return <RankingList
                    rankings={rankings}
                    currentUser={currentUser}
                    onNavigateBack={() => setActivePage('explore')}
                    onViewPublicProfile={setViewingPublicProfileId}
                />;
            case 'hire':
                return <HirePlayerScreen
                    onBack={() => setActivePage('explore')}
                    currentUserId={currentUser?.id}
                    onNavigateToDirectChat={handleNavigateToDirectChat}
                />;
            case 'community':
                return <Community
                    currentUser={currentUser!}
                    onNavigateBack={() => setActivePage('explore')}
                />;
            case 'arenas':
                return <Arenas
                    currentUser={currentUser!}
                    onNavigateBack={() => setActivePage('explore')}
                />;
            case 'notifications':
                return <Notifications
                    currentUser={currentUser!}
                    onNavigateBack={() => setActivePage('explore')}
                />;
            case 'wallet':
                return <Wallet
                    currentUser={currentUser!}
                    onNavigateBack={() => setActivePage('explore')}
                    onBalanceUpdate={handleBalanceUpdate}
                />;
            case 'invite':
                return <InviteFriendScreen onBack={() => setActivePage('explore')} />;
            case 'settings':
                return <SettingsScreen onBack={() => setActivePage('explore')} />;
            case 'support':
                return <SupportScreen onBack={() => setActivePage('explore')} />;
            case 'hire':
                return <HirePlayerScreen onBack={() => setActivePage('explore')} />;
            case 'map':
                return <MatchesMap
                    matches={matches}
                    onJoinMatch={handleJoinMatch}
                    onLeaveMatch={handleLeaveMatch}
                    joinedMatchIds={joinedMatchIds}
                    currentUser={currentUser}
                    onCancelMatch={handleCancelMatch}
                    onEditMatch={handleStartEditMatch}
                    onNavigateBack={() => setActivePage('explore')}
                    onBalanceUpdate={handleBalanceUpdate}
                    onBoostMatch={handleBoostMatch}
                    onNavigateToDirectChat={handleNavigateToMatchChat}
                    onMatchClick={setSelectedMatch}
                    onViewPublicProfile={setViewingPublicProfileId}
                    selectedMatch={selectedMatch}
                    onCloseMatchDetails={() => setSelectedMatch(null)}
                    userLocation={userLocation}
                    locationStatus={locationStatus}
                />;
            default:
                return <Explore
                    matches={matches}
                    platformFeatures={platformFeatures}
                    onJoinMatch={handleJoinMatch}
                    onLeaveMatch={handleLeaveMatch}
                    joinedMatchIds={joinedMatchIds}
                    currentUser={currentUser!}
                    onCancelMatch={handleCancelMatch}
                    onDeleteCanceledMatches={handleDeleteCanceledMatches}
                    onEditMatch={handleStartEditMatch}
                    onNavigateToCreate={() => setActivePage('create')}
                    onRefreshMatches={fetchMatches}
                    onNavigateToProfile={() => setActivePage('profile')}
                    onNavigateToMap={() => setActivePage('map')}
                    onNavigateToMyGames={() => setActivePage('my-games')}
                    onNavigateToRanking={() => setActivePage('ranking')}
                    onNavigateToCommunity={() => setActivePage('community')}
                    onNavigateToArenas={() => setActivePage('arenas')}
                    onNavigateToMatchChat={() => setActivePage('match-chat')}
                    onNavigateToDirectChat={handleNavigateToMatchChat}
                    onNavigateToNotifications={() => setActivePage('notifications')}
                    onNavigateToWallet={() => setActivePage('wallet')}
                    onBalanceUpdate={handleBalanceUpdate}
                    onBoostMatch={handleBoostMatch}
                    selectedMatch={selectedMatch}
                    onSelectMatch={setSelectedMatch}
                    onCloseMatchDetails={() => setSelectedMatch(null)}
                    onOpenSidebar={() => {
                        console.log("App: onOpenSidebar triggered");
                        setIsSidebarOpen(true);
                    }}
                    onViewPublicProfile={setViewingPublicProfileId}
                    userLocation={userLocation}
                    locationStatus={locationStatus}
                />;
        }
    };

    // Periodically check for expired matches and finalize them
    useEffect(() => {
        const finalizeMatches = async () => {
            try {
                const { error } = await supabase.rpc('finalize_expired_matches');
                if (error) {
                    // Ignore error if function doesn't exist yet (migration not run)
                    if (error.code !== '42883') {
                        console.error('Error finalizing matches:', error);
                    }
                }
            } catch (err) {
                console.error('Exception finalizing matches:', err);
            }
        };

        finalizeMatches();
        const interval = setInterval(finalizeMatches, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    if (isLoadingDbCheck) {
        return <ModernLoader />;
    }

    if (dbSetupRequired) {
        return <DatabaseSetup onSetupComplete={() => setDbSetupRequired(false)} />;
    }

    if (!isAuthenticated) {
        if (activePage === 'invite-landing') {
            return (
                <InviteLandingScreen
                    onGoToLogin={() => {
                        window.history.pushState({}, '', '/');
                        setActivePage('explore'); // Will trigger Home render
                    }}
                    onGoToRegister={() => {
                        window.history.pushState({}, '', '/');
                        setActivePage('explore'); // Will trigger Home render
                    }}
                />
            );
        }

        return (
            <Suspense fallback={<ModernLoader />}>
                <Home
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onGoogleLogin={handleGoogleLogin}
                    loginError={loginError}
                    clearLoginError={clearLoginError}
                />
            </Suspense>
        );
    }

    if (!currentUser) {
        if (profileError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-[#0a1628] text-white p-4 text-center">
                    <p className="text-xl font-bold mb-4 text-red-400">Erro ao carregar perfil</p>
                    <p className="mb-6 text-gray-400">Não foi possível carregar seus dados. Verifique sua conexão.</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-neon-green text-[#0a1628] px-6 py-2 rounded-lg font-bold hover:bg-[#00e686] transition-colors shadow-lg"
                        >
                            Tentar Novamente
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-2 rounded-lg font-bold hover:bg-red-500/20 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            );
        }
        return <ModernLoader />;
    }

    return (
        <>
            <div className="app-container">
                <Suspense fallback={<ModernLoader />}>
                    {renderPage()}
                </Suspense>
                {viewingPublicProfileId && (
                    <Suspense fallback={null}>
                        <PublicProfileModal
                            userId={viewingPublicProfileId}
                            currentUser={currentUser}
                            onClose={() => setViewingPublicProfileId(null)}
                            onNavigateToDirectChat={handleNavigateToDirectChat}
                        />
                    </Suspense>
                )}
                {activePage === 'explore' && (
                    <BottomNav
                        activePage={activePage}
                        onNavigate={setActivePage}
                        pendingFriendRequestsCount={pendingFriendRequestsCount}
                    />
                )}
                {showConfirmation && (
                    <div className="confirmation-toast">
                        {showConfirmation}
                    </div>
                )}
                {showExitToast && (
                    <Toast
                        message={exitAttemptRef.current ? "Pressione Voltar novamente para sair" : "Pressione Voltar novamente para sair"}
                        type="info"
                        onClose={() => setShowExitToast(false)}
                    />
                )}
                {activePage === 'invite-landing' ? (
                    <InviteLandingScreen
                        onGoToLogin={() => {
                            window.history.pushState({}, '', '/');
                            setActivePage('explore'); // Trigger Home render logic if not authenticated
                            // Actually, logic below handles "if (!isAuthenticated) return Home".
                            // So we just need to set activePage to explore or clear URL, 
                            // and the main renders (if !isAuthenticated) will show Login/Home.
                        }}
                        onGoToRegister={() => {
                            window.history.pushState({}, '', '/');
                            setActivePage('explore'); // Same here, Home handles registration toggle
                        }}
                    />
                ) : (
                    <ChatBot />
                )}
            </div>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentUser={currentUser}
                onNavigateToProfile={() => {
                    setProfileInitialSection('details');
                    setActivePage('profile');
                }}
                onNavigateToFriends={() => {
                    setProfileInitialSection('friends');
                    setActivePage('profile');
                }}
                onNavigateToInvite={() => setActivePage('invite')}
                onNavigateToHire={() => setActivePage('hire')}
                onNavigateToSettings={() => setActivePage('settings')}
                onNavigateToSupport={() => setActivePage('support')}
                onNavigateToMyGames={() => setActivePage('my-games')}
                onNavigateToCommunity={() => setActivePage('community')}
                onNavigateToNotifications={() => setActivePage('notifications')}
                onNavigateToWallet={() => setActivePage('wallet')}
                onNavigateToRanking={() => setActivePage('ranking')}
                onNavigateToArenas={() => setActivePage('arenas')}
                onNavigateToMatchChat={() => setActivePage('match-chat')}
                onNavigateToDirectChat={handleNavigateToDirectMessagesList}
                onLogout={handleLogout}
                unreadDMsCount={unreadDMsCount}
                pendingFriendRequestsCount={pendingFriendRequestsCount}
            />
        </>
    );
}

export default App;
