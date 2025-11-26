import React, { useState, useCallback, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Explore from './components/Explore';
import CreateMatchForm from './components/CreateMatchForm';
import UserProfile from './components/UserProfile';
import RankingList from './components/RankingList';
import ChatBot from './components/ChatBot';
import Home from './components/Home';
import MatchesMap from './components/MatchesMap';
import MyGames from './components/MyGames';
import Community from './components/Community';
import Arenas from './components/Arenas';
import MatchChat from './components/MatchChat';
import Notifications from './components/Notifications';
import Wallet from './components/Wallet';
import { Page, Feature, Profile, Match, Ranking, DraftMatchData } from './types';
import { supabase } from './services/supabaseClient';
import { initGemini } from './services/geminiService';
import { AuthError, Session, User } from '@supabase/supabase-js';
import DatabaseSetup from './components/DatabaseSetup';
import LoadingSpinner from './components/LoadingSpinner';


const platformFeatures: Feature[] = [
    { icon: '⚽', title: 'Criar Partida', description: 'Monte o jogo do seu jeito! Escolha local, data e número de jogadores.' },
    { icon: '📍', title: 'Encontre Partidas Próximas', description: 'Descubra onde a bola já está rolando perto de você!' },
    { icon: '👥', title: 'Meus Jogos', description: 'Veja as partidas que você confirmou presença e acompanhe as próximas.' },
    { icon: '🧑‍🤝‍🧑', title: 'Comunidade', description: 'Converse com outros jogadores, combine jogos e forme seu time!' },
    { icon: '🏅', title: 'Ranking de Jogadores', description: 'Suba no ranking e mostre que é um craque!' },
    { icon: '🏟️', title: 'Campos e Arenas', description: 'Encontre os melhores lugares pra jogar e reserve seu espaço direto pelo app.' },
    { icon: '💬', title: 'Chat das Partidas', description: 'Troque ideias e zoeiras com o time antes e depois do jogo' },
    { icon: '🔔', title: 'Notificações', description: 'Receba alertas quando surgir uma nova partida na sua região!' },
    { icon: '👤', title: 'Meu Perfil', description: 'Atualize suas informações e mostre seu estilo de jogo.' },
    { icon: '💰', title: 'Carteira FutMatch', description: 'Veja seu saldo de MatchCoins e compre mais quando precisar.' },
    { icon: '🎯', title: 'Sugestões de Partidas (IA)', description: 'Deixe a IA te recomendar os melhores jogos baseados no seu perfil' },
    { icon: '🌍', title: 'Mapa das Partidas', description: 'Veja todas as partidas rolando na sua cidade em tempo real no mapa' },
];

// Helper function to robustly check for missing tables OR columns.
const isSchemaMismatchError = (error: any): boolean => {
    if (!error) return false;

    const message = String(error.message || '').toLowerCase();

    // Check for missing table errors
    const isTableError = message.includes('could not find the table') ||
        (message.includes('relation') && message.includes('does not exist')) ||
        error.code === '42P01';

    // Check for missing column errors
    const isColumnError = (message.includes('column') && message.includes('does not exist')) ||
        error.code === '42703';

    return isTableError || isColumnError;
};

// This type accommodates both form registration (no id, has password) and OAuth (has id, no password).
type NewUserRegistrationData = Omit<Profile, 'id' | 'points' | 'matchesPlayed' | 'reputation' | 'matchCoins'> & {
    password?: string;
};

export default function App() {
    const [activePage, setActivePage] = useState<Page>('explore');
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoadingDbCheck, setIsLoadingDbCheck] = useState(true);
    const [dbSetupRequired, setDbSetupRequired] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [joinedMatchIds, setJoinedMatchIds] = useState<Set<number>>(new Set());
    const [rankings, setRankings] = useState<Ranking[]>([]);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [draftMatchData, setDraftMatchData] = useState<DraftMatchData | null>(null);
    const [selectedChatMatchId, setSelectedChatMatchId] = useState<number | null>(null);
    const [profileError, setProfileError] = useState(false);

    const isAuthenticated = !!session?.user;

    // Initialize Gemini AI on mount
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
            initGemini(apiKey);
        } else {
            console.warn('VITE_GEMINI_API_KEY not found in environment variables');
        }
    }, []);

    // --- Back Button Handling ---
    const activePageRef = React.useRef(activePage);
    const lastBackPressTime = React.useRef(0);

    useEffect(() => {
        activePageRef.current = activePage;
    }, [activePage]);

    useEffect(() => {
        // Push initial state to allow interception
        window.history.pushState(null, '', window.location.pathname);

        const handleBackButton = (event: PopStateEvent) => {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastBackPressTime.current;

            if (activePageRef.current !== 'explore') {
                // If not on home, go back to home
                event.preventDefault();
                setActivePage('explore');
                // Push state again to maintain the "trap"
                window.history.pushState(null, '', window.location.pathname);
            } else {
                // If on home
                if (timeDiff < 2000) {
                    // Double press detected - allow exit (do nothing, history already popped)
                    return;
                } else {
                    // First press - show warning and restore state
                    event.preventDefault();
                    lastBackPressTime.current = currentTime;
                    setShowConfirmation("Pressione voltar novamente para sair");
                    setTimeout(() => setShowConfirmation(null), 2000);
                    // Push state again to maintain the "trap"
                    window.history.pushState(null, '', window.location.pathname);
                }
            }
        };

        window.addEventListener('popstate', handleBackButton);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, []);

    // Fetch matches function
    const fetchMatches = useCallback(async () => {
        for (let i = 3; i > 0; i--) {
            try {
                const { data, error } = await supabase
                    .from('matches')
                    .select('*')
                    .order('date', { ascending: true });

                if (error) throw error;

                // Convert date strings back to Date objects
                const formattedMatches = data.map(m => ({ ...m, date: new Date(m.date) }));
                setMatches(formattedMatches);
                return; // Success, exit loop
            } catch (error: any) {
                const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed') || error.name === 'TypeError';

                if (i === 1 || !isNetworkError) {
                    console.error('Error fetching matches:', (error as AuthError)?.message ?? error);
                } else {
                    // Wait before retrying
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    }, []);

    useEffect(() => {
        const checkDb = async () => {
            try {
                // Check for 'profiles' table
                const { error: profilesError } = await supabase
                    .from('profiles')
                    .select('id')
                    .limit(0);

                // Check for 'matches' table
                const { error: matchesError } = await supabase
                    .from('matches')
                    .select('id')
                    .limit(0);

                // Check for 'match_participants' table
                const { error: participantsError } = await supabase
                    .from('match_participants')
                    .select('match_id')
                    .limit(0);

                // Check for 'tokens' table (New)
                const { error: tokensError } = await supabase
                    .from('tokens')
                    .select('user_id')
                    .limit(0);

                // CRITICAL: Check if the RPC function 'join_match_with_token' exists.
                let functionMissing = false;
                try {
                    // Attempt to call the function with dummy data to check existence
                    const { error: rpcError } = await supabase.rpc('join_match_with_token', {
                        p_match_id: 0
                    });

                    if (rpcError) {
                        const msg = rpcError.message?.toLowerCase() || '';
                        // PostgreSQL error code 42883 is undefined_function
                        if ((msg.includes('function') && msg.includes('does not exist')) || rpcError.code === '42883' || msg.includes('could not find the function')) {
                            functionMissing = true;
                        }
                    }
                } catch (e) {
                    console.warn("Error checking RPC:", e);
                }

                // If any check fails due to a missing table or column OR missing function, require setup.
                if (isSchemaMismatchError(profilesError) || isSchemaMismatchError(matchesError) || isSchemaMismatchError(participantsError) || isSchemaMismatchError(tokensError) || functionMissing) {
                    setDbSetupRequired(true);
                }

                // Load initial matches
                await fetchMatches();
            } catch (error: any) {
                console.error('Error during database check:', (error as AuthError)?.message ?? error);
            }
            setIsLoadingDbCheck(false);
        };
        checkDb();
    }, [fetchMatches]);

    const fetchUserProfile = useCallback(async (user: User): Promise<Profile | null> => {
        // Mapper function to convert snake_case from DB to camelCase for the app
        const mapProfileData = (data: any, balance: number = 0): Profile | null => {
            if (!data) return null;
            return {
                id: data.id,
                name: data.name,
                email: data.email,
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

                        profile = mapProfileData(data, balance);
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
                profile = mapProfileData(data, 10);
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
        return () => subscription.unsubscribe();
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

    const handleCreateMatch = useCallback(async (newMatch: Omit<Match, 'id' | 'filled_slots' | 'created_by' | 'status' | 'cancellation_reason'>) => {
        if (!currentUser) return;
        try {

            const matchPayload = {
                ...newMatch,
                date: newMatch.date.toISOString(),
                created_by: currentUser.id,
                filled_slots: 0
            };

            const { data, error } = await supabase
                .from('matches')
                .insert([matchPayload])
                .select()
                .single();

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
            console.error('Error creating match:', msg);
            alert(`Erro ao criar partida: ${msg}`);
        }
    }, [currentUser, fetchUserProfile, session]);

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

            if (status === 'OK') {
                // Success: Update local state optimistically
                setJoinedMatchIds(prev => new Set(prev).add(matchId));
                setMatches(prevMatches => prevMatches.map(m =>
                    m.id === matchId ? { ...m, filled_slots: m.filled_slots + 1 } : m
                ));

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
                alert("Você já está nessa partida.");
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
                setMatches(prevMatches => prevMatches.map(m =>
                    m.id === matchId ? { ...m, filled_slots: Math.max(0, m.filled_slots - 1) } : m
                ));

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

            setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));

            setEditingMatch(null);
            setActivePage('explore');
            setShowConfirmation("Partida atualizada com sucesso!");
            setTimeout(() => setShowConfirmation(null), 3000);
        } catch (error) {
            console.error('Error updating match:', (error as AuthError)?.message ?? error);
            alert(`Erro ao atualizar a partida: ${(error as AuthError)?.message ?? error}`);
        }
    }, []);

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

    const renderPage = () => {
        if (!currentUser && activePage !== 'explore') {
            // Allow explore without login, but other pages might require it.
            // Actually, Home handles login/register.
            // If activePage is 'explore', we render Explore.
        }

        switch (activePage) {
            case 'explore':
                return <Explore
                    matches={matches}
                    platformFeatures={platformFeatures}
                    onJoinMatch={handleJoinMatch}
                    onLeaveMatch={handleLeaveMatch}
                    joinedMatchIds={joinedMatchIds}
                    currentUser={currentUser}
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
                />;
            case 'create':
                return <CreateMatchForm
                    onCreateMatch={handleCreateMatch}
                    onUpdateMatch={handleUpdateMatch}
                    matchToEdit={editingMatch}
                    onCancelEdit={handleCancelEdit}
                    initialData={draftMatchData}
                    onNavigateBack={handleCancelEdit}
                />;
            case 'profile':
                return <UserProfile
                    user={currentUser}
                    onUpdateUser={handleUpdateUser}
                    onLogout={handleLogout}
                    onNavigateBack={() => setActivePage('explore')}
                />;
            case 'ranking':
                return <RankingList
                    rankings={rankings}
                    onNavigateBack={() => setActivePage('explore')}
                />;
            case 'map':
                return <MatchesMap
                    matches={matches}
                    onNavigateBack={() => setActivePage('explore')}
                />;
            case 'my-games':
                return <MyGames
                    matches={matches}
                    currentUser={currentUser}
                    joinedMatchIds={joinedMatchIds}
                    onJoinMatch={handleJoinMatch}
                    onLeaveMatch={handleLeaveMatch}
                    onCancelMatch={handleCancelMatch}
                    onEditMatch={handleStartEditMatch}
                    onNavigateToCreate={() => setActivePage('create')}
                    onNavigateBack={() => setActivePage('explore')}
                    onNavigateToDirectChat={handleNavigateToMatchChat}
                    onBalanceUpdate={handleBalanceUpdate}
                />;
            case 'arenas':
                return <Arenas
                    onNavigateBack={() => setActivePage('explore')}
                    onDraftFromArena={handleDraftMatch}
                />;
            case 'match-chat':
                return <MatchChat
                    currentUser={currentUser}
                    onNavigateBack={() => setActivePage('explore')}
                    initialMatchId={selectedChatMatchId}
                />;
            case 'notifications':
                return <Notifications
                    currentUser={currentUser}
                    onNavigateBack={() => setActivePage('explore')}
                    onNavigateToDirectChat={handleNavigateToMatchChat}
                    onNavigateToCommunity={() => setActivePage('community')}
                />;
            case 'wallet':
                return <Wallet
                    currentUser={currentUser}
                    onNavigateBack={() => setActivePage('explore')}
                />;
            case 'community':
                return <Community
                    onNavigateBack={() => setActivePage('explore')}
                />;
            default:
                return <Explore
                    matches={matches}
                    platformFeatures={platformFeatures}
                    onJoinMatch={handleJoinMatch}
                    onLeaveMatch={handleLeaveMatch}
                    joinedMatchIds={joinedMatchIds}
                    currentUser={currentUser}
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
                />;
        }
    };

    if (isLoadingDbCheck) {
        return <LoadingSpinner />;
    }

    if (dbSetupRequired) {
        return <DatabaseSetup onSetupComplete={() => setDbSetupRequired(false)} />;
    }

    if (!isAuthenticated) {
        return (
            <Home
                onLogin={handleLogin}
                onRegister={handleRegister}
                onGoogleLogin={handleGoogleLogin}
                loginError={loginError}
                clearLoginError={clearLoginError}
            />
        );
    }

    if (!currentUser) {
        if (profileError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4 text-center">
                    <p className="text-xl font-bold mb-4">Erro ao carregar perfil</p>
                    <p className="mb-6 text-gray-400">Não foi possível carregar seus dados. Verifique sua conexão.</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
                        >
                            Tentar Novamente
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            );
        }
        return <LoadingSpinner />;
    }

    return (
        <div className="app-container">
            {renderPage()}
            {activePage === 'explore' && (
                <BottomNav
                    activePage={activePage}
                    onNavigate={setActivePage}
                />
            )}
            {showConfirmation && (
                <div className="confirmation-toast">
                    {showConfirmation}
                </div>
            )}
            <ChatBot />
        </div>
    );
}