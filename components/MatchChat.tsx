
import React, { useState, useEffect, useRef } from 'react';
import { Match, Profile, MatchMessage } from '../types';
import { supabase } from '../services/supabaseClient';
import { SendIcon, CalendarIcon, LocationIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';
import { SPORT_EMOJIS } from '../constants';

interface MatchChatProps {
    currentUser: Profile;
    onNavigateBack: () => void;
    initialMatchId?: number | null;
}

const MatchChat: React.FC<MatchChatProps> = ({ currentUser, onNavigateBack, initialMatchId }) => {
    const [view, setView] = useState<'list' | 'room'>('list');
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [messages, setMessages] = useState<MatchMessage[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSending, setIsSending] = useState(false);

    // 0. Handle Direct Navigation (Deep link)
    useEffect(() => {
        if (initialMatchId) {
            fetchSingleMatch(initialMatchId);
        } else {
            setView('list');
            setActiveMatch(null);
        }
    }, [initialMatchId]);

    // 1. Fetch matches user is part of (Lobby)
    useEffect(() => {
        if (view === 'list') {
            fetchUserMatches();
        }
    }, [view, currentUser]);

    // 2. Handle chat room logic
    useEffect(() => {
        if (view === 'room' && activeMatch) {
            fetchMessages(activeMatch.id);

            // Subscribe to realtime new messages
            const channel = supabase
                .channel(`match-chat:${activeMatch.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'match_messages',
                        filter: `match_id=eq.${activeMatch.id}`
                    },
                    async (payload) => {
                        const newMessagePayload = payload.new as MatchMessage;

                        // Prevent duplicate if we already added it optimistically via handleSendMessage
                        // We need to check inside the state updater to get the latest state
                        setMessages(prevMessages => {
                            if (prevMessages.some(msg => msg.id === newMessagePayload.id)) {
                                return prevMessages;
                            }

                            // If not found, it means it's from another user, so we fetch profile and add
                            // We fetch profile inside the setter logic wrapper? No, async issue.
                            // We must fetch outside. But we can't block the setter.
                            // Solution: Fetch first, then update.
                            return prevMessages; // Return temporarily, handle async below
                        });

                        // Fetch sender profile to display name/photo if it wasn't me (or if I need to ensure consistency)
                        // Optimization: If sender_id is me, I likely already added it.
                        // But to be safe for the "other user" case:

                        const { data } = await supabase
                            .from('profiles')
                            .select('name, photo_url')
                            .eq('id', newMessagePayload.sender_id)
                            .single();

                        const messageWithProfile: MatchMessage = {
                            ...newMessagePayload,
                            profiles: data ? { name: data.name, photo_url: data.photo_url } : undefined
                        };

                        setMessages(prev => {
                            // Double check again before adding
                            if (prev.some(msg => msg.id === messageWithProfile.id)) return prev;
                            return [...prev, messageWithProfile];
                        });

                        setTimeout(scrollToBottom, 100);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [view, activeMatch]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchSingleMatch = async (matchId: number) => {
        setIsLoadingMatches(true);
        try {
            const { data, error } = await supabase
                .from('matches')
                .select('*')
                .eq('id', matchId)
                .single();

            if (error) throw error;

            const match = { ...data, date: new Date(data.date) };
            setActiveMatch(match);
            setView('room');
        } catch (err) {
            console.error("Error fetching single match for chat:", err);
            // Fallback to list
            setView('list');
        } finally {
            setIsLoadingMatches(false);
        }
    };

    const fetchUserMatches = async () => {
        setIsLoadingMatches(true);
        try {
            // Get matches where user is creator
            const { data: createdMatches, error: createdError } = await supabase
                .from('matches')
                .select('*')
                .eq('created_by', currentUser.id)
                .neq('status', 'Cancelado');

            if (createdError) throw createdError;

            // Get IDs of matches where user is participant
            const { data: participationData, error: participationError } = await supabase
                .from('match_participants')
                .select('match_id')
                .eq('user_id', currentUser.id);

            if (participationError) throw participationError;

            const participantMatchIds = participationData?.map(p => p.match_id) || [];

            // Get matches where user is participant (but not creator to avoid duplicates)
            let participatedMatches: any[] = [];
            if (participantMatchIds.length > 0) {
                const { data, error } = await supabase
                    .from('matches')
                    .select('*')
                    .in('id', participantMatchIds)
                    .neq('created_by', currentUser.id)
                    .neq('status', 'Cancelado');

                if (error) throw error;
                participatedMatches = data || [];
            }

            // Combine and format
            const allMatches = [...(createdMatches || []), ...participatedMatches];
            const formattedMatches = allMatches
                .map(m => ({ ...m, date: new Date(m.date) }))
                .sort((a, b) => b.date.getTime() - a.date.getTime());

            setMatches(formattedMatches);

        } catch (error) {
            console.error("Error fetching chat matches:", error);
        } finally {
            setIsLoadingMatches(false);
        }
    };

    const fetchMessages = async (matchId: number) => {
        setIsLoadingMessages(true);
        try {
            // Reverted to standard join syntax as there is only one relationship
            const { data, error } = await supabase
                .from('match_messages')
                .select('*, profiles(name, photo_url)')
                .eq('match_id', matchId)
                .order('sent_at', { ascending: true });

            if (error) throw error;

            const formattedMessages: MatchMessage[] = (data || []).map((item: any) => ({
                ...item,
                profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
            }));

            setMessages(formattedMessages);
            setTimeout(scrollToBottom, 100);

        } catch (error: any) {
            console.error("Error fetching messages:", error.message);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeMatch) return;

        setIsSending(true);
        try {
            const { data, error } = await supabase
                .from('match_messages')
                .insert({
                    match_id: activeMatch.id,
                    sender_id: currentUser.id,
                    message: newMessage.trim()
                })
                .select()
                .single();

            if (error) throw error;

            // Optimistic UI update: Add message immediately
            if (data) {
                const instantMessage: MatchMessage = {
                    ...data,
                    profiles: {
                        name: currentUser.name,
                        photo_url: currentUser.photoUrl
                    }
                };
                setMessages(prev => [...prev, instantMessage]);
                setNewMessage('');
                setTimeout(scrollToBottom, 100);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            alert("Erro ao enviar mensagem.");
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // VIEW: MATCH LIST (LOBBY)
    if (view === 'list') {
        return (
            <div className="bg-gray-900 h-[100dvh] flex flex-col">
                <div className="flex items-center justify-between bg-gray-800 p-4 shadow-md shrink-0">
                    <h2 className="text-xl font-bold text-white">Chat das Partidas</h2>
                    <button
                        onClick={onNavigateBack}
                        className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
                    >
                        Voltar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {isLoadingMatches ? (
                        <div className="flex justify-center py-10"><LoadingSpinner /></div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-gray-800 rounded-xl">
                            <p>Você ainda não participa de nenhuma partida.</p>
                            <p className="text-sm mt-1">Entre em um jogo para acessar o chat!</p>
                        </div>
                    ) : (
                        matches.map(match => (
                            <div
                                key={match.id}
                                onClick={() => { setActiveMatch(match); setView('room'); }}
                                className="bg-gray-800 p-4 rounded-xl shadow-md cursor-pointer hover:bg-gray-700 transition-colors flex items-center gap-3"
                            >
                                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl shadow-inner">
                                    {SPORT_EMOJIS[match.sport] || '⚽'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-sm">{match.name}</h3>
                                    <div className="flex items-center text-gray-400 text-xs gap-2 mt-1">
                                        <span className="flex items-center gap-1"><CalendarIcon /> {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                        <span>•</span>
                                        <span className="truncate max-w-[120px]">{match.location}</span>
                                    </div>
                                </div>
                                <div className="text-gray-500 text-xl">›</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // VIEW: CHAT ROOM
    return (
        <div className="bg-gray-900 flex flex-col h-[100dvh]">
            {/* Header */}
            <div className="flex items-center bg-gray-800 p-4 shadow-md shrink-0">
                <button
                    onClick={() => {
                        if (initialMatchId) {
                            onNavigateBack(); // If opened directly, go back to previous screen (explore/mygames)
                        } else {
                            setView('list'); setActiveMatch(null);
                        }
                    }}
                    className="mr-3 text-gray-400 hover:text-white text-lg"
                >
                    ←
                </button>
                <div className="flex-1">
                    <h2 className="text-md font-bold text-white leading-tight">{activeMatch?.name}</h2>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <LocationIcon /> {activeMatch?.location} • {activeMatch && new Date(activeMatch.date).toLocaleDateString('pt-BR')}
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
                {isLoadingMessages ? (
                    <div className="flex justify-center py-10"><LoadingSpinner /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 text-sm">
                        <p>Inicie a conversa com seu time! ⚽🗣️</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                                {!isMe && (
                                    <img
                                        src={msg.profiles?.photo_url || `https://ui-avatars.com/api/?name=${msg.profiles?.name || 'User'}`}
                                        className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-700 self-end mb-1"
                                        alt="Sender"
                                    />
                                )}
                                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm relative group ${isMe ? 'bg-green-600/90 text-white rounded-br-sm' : 'bg-gray-700 text-white rounded-bl-sm'}`}>
                                    {!isMe && <p className="text-[10px] font-bold text-green-300 mb-0.5">{msg.profiles?.name}</p>}
                                    <p>{msg.message}</p>
                                    <p className={`text-[9px] text-right mt-1 opacity-70 ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.sent_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="bg-gray-800 border-t border-gray-700 p-3 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escreva uma mensagem..."
                        className="flex-1 bg-gray-700 text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-600 min-w-0"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg disabled:opacity-50 transition-transform active:scale-95 shrink-0"
                    >
                        {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SendIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchChat;
