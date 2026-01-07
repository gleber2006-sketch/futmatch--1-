
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../types';
import { supabase } from '../services/supabaseClient';
import { SendIcon } from './Icons';
import ModernLoader from './ModernLoader';

interface DirectMessage {
    id: number;
    sender_id: string;
    receiver_id: string;
    message: string;
    sent_at: string;
    read_at?: string | null;
}

interface DirectChatProps {
    currentUser: Profile;
    recipientId: string;
    onNavigateBack: () => void;
}

const DirectChat: React.FC<DirectChatProps> = ({ currentUser, recipientId, onNavigateBack }) => {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [recipient, setRecipient] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch recipient profile
    useEffect(() => {
        const fetchRecipient = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', recipientId)
                .single();

            if (!error && data) {
                setRecipient({
                    id: data.id,
                    name: data.name,
                    photoUrl: data.photo_url,
                    points: data.points,
                    matchesPlayed: data.matches_played,
                    reputation: data.reputation,
                    dateOfBirth: data.date_of_birth,
                    city: data.city,
                    state: data.state,
                    sport: data.sport,
                    position: data.position,
                    bio: data.bio,
                    matchCoins: 0
                } as Profile);
            }
            setIsLoading(false);
        };
        fetchRecipient();
    }, [recipientId]);

    // Fetch messages and subscribe
    useEffect(() => {
        fetchMessages();

        const channel = supabase
            .channel(`direct-chat:${currentUser.id}:${recipientId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                },
                (payload) => {
                    const msg = payload.new as DirectMessage;
                    if (
                        (msg.sender_id === currentUser.id && msg.receiver_id === recipientId) ||
                        (msg.sender_id === recipientId && msg.receiver_id === currentUser.id)
                    ) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                        setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id, recipientId]);

    const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUser.id})`)
                .order('sent_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error("Error fetching direct messages:", error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: recipientId,
                    message: newMessage.trim()
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setMessages(prev => [...prev, data as DirectMessage]);
                setNewMessage('');
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Error sending direct message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><ModernLoader /></div>;

    return (
        <div className="flex flex-col h-[100dvh] bg-[#0a1628]">
            {/* Header */}
            <div className="flex items-center bg-[#0a1628]/95 backdrop-blur-md p-4 shadow-lg shrink-0 border-b border-white/5 z-10">
                <button
                    onClick={onNavigateBack}
                    className="mr-3 text-gray-400 hover:text-white text-lg transition-colors"
                >
                    ←
                </button>
                <div className="flex items-center gap-3">
                    <img
                        src={recipient?.photoUrl || `https://ui-avatars.com/api/?name=${recipient?.name || 'User'}`}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                        alt={recipient?.name}
                    />
                    <div>
                        <h2 className="text-md font-bold text-white leading-tight drop-shadow-sm">{recipient?.name}</h2>
                        <p className="text-[10px] text-[#00ff88] animate-pulse">Online</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0a1628] to-[#0f1824]">
                {isLoadingMessages && messages.length === 0 ? (
                    <div className="flex justify-center py-10"><ModernLoader /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">
                        <p>Diga oi para {recipient?.name}! 👋</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm relative shadow-sm backdrop-blur-sm ${isMe
                                    ? 'bg-neon-green/10 text-white rounded-br-sm border border-neon-green/30'
                                    : 'bg-[#112240]/80 text-gray-200 rounded-bl-sm border border-white/5'
                                    }`}>
                                    <p className="leading-relaxed">{msg.message}</p>
                                    <p className={`text-[9px] text-right mt-1 opacity-60 ${isMe ? 'text-neon-green' : 'text-gray-400'}`}>
                                        {formatTime(msg.sent_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-[#0a1628]/95 backdrop-blur-md border-t border-white/5 p-3 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Mensagem..."
                        className="flex-1 bg-[#112240] text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neon-green/50 border border-white/10 placeholder-gray-500 transition-all"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className="bg-neon-green hover:bg-[#00e686] text-[#0a1628] p-3 rounded-full shadow-[0_0_15px_rgba(0,255,148,0.3)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 shrink-0"
                    >
                        {isSending ? <div className="animate-pulse">...</div> : <SendIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DirectChat;
