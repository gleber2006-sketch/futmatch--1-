
import React, { useEffect, useState } from 'react';
import { Profile } from '../types';
import { supabase } from '../services/supabaseClient';
import ModernLoader from './ModernLoader';

interface DirectMessagesListProps {
    currentUser: Profile;
    onNavigateBack: () => void;
    onNavigateToChat: (userId: string) => void;
}

interface Conversation {
    partnerId: string;
    partnerName: string;
    partnerPhoto?: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

const DirectMessagesList: React.FC<DirectMessagesListProps> = ({ currentUser, onNavigateBack, onNavigateToChat }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                // Fetch all messages involving the current user
                const { data: messages, error } = await supabase
                    .from('direct_messages')
                    .select('*')
                    .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                    .order('sent_at', { ascending: false });

                if (error) throw error;

                if (!messages) {
                    setLoading(false);
                    return;
                }

                const conversationMap = new Map<string, Conversation>();

                for (const msg of messages) {
                    const isSender = msg.sender_id === currentUser.id;
                    const partnerId = isSender ? msg.receiver_id : msg.sender_id;

                    if (!conversationMap.has(partnerId)) {
                        conversationMap.set(partnerId, {
                            partnerId,
                            partnerName: 'Carregando...', // Will fetch later
                            lastMessage: msg.message,
                            lastMessageTime: msg.sent_at,
                            unreadCount: 0
                        });
                    }

                    const conv = conversationMap.get(partnerId)!;

                    // Increment unread count if message is received and not read
                    if (!isSender && !msg.read_at) {
                        conv.unreadCount += 1;
                    }
                }

                const conversationArray = Array.from(conversationMap.values());

                // Fetch profiles for partners
                if (conversationArray.length > 0) {
                    const partnerIds = conversationArray.map(c => c.partnerId);
                    const { data: profiles, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, name, photo_url')
                        .in('id', partnerIds);

                    if (!profileError && profiles) {
                        conversationArray.forEach(conv => {
                            const profile = profiles.find(p => p.id === conv.partnerId);
                            if (profile) {
                                conv.partnerName = profile.name;
                                conv.partnerPhoto = profile.photo_url;
                            }
                        });
                    }
                }

                setConversations(conversationArray);
            } catch (error) {
                console.error("Error fetching conversations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [currentUser.id]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-screen bg-[#0a1628] text-white">
            {/* Header */}
            <div className="flex items-center p-4 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 shadow-lg">
                <button
                    onClick={onNavigateBack}
                    className="mr-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold">Mensagens</h1>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <ModernLoader />
                ) : conversations.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p>Nenhuma conversa ainda.</p>
                        <p className="text-sm mt-2">Visite o perfil de um amigo para mandar uma mensagem!</p>
                    </div>
                ) : (
                    conversations.map(conv => (
                        <div
                            key={conv.partnerId}
                            onClick={() => onNavigateToChat(conv.partnerId)}
                            className="flex items-center p-3 sm:p-4 bg-[#112240] rounded-xl cursor-pointer hover:bg-[#1a3350] transition-colors border border-white/5 shadow-md"
                        >
                            <img
                                src={conv.partnerPhoto || `https://ui-avatars.com/api/?name=${conv.partnerName}`}
                                alt={conv.partnerName}
                                className="w-12 h-12 rounded-full object-cover border border-white/10"
                            />
                            <div className="ml-4 flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-white truncate">{conv.partnerName}</h3>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                        {formatTime(conv.lastMessageTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-sm truncate pr-2 ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                                        {conv.lastMessage}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-[#00FF94] text-[#0a1628] text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-[0_0_8px_rgba(0,255,148,0.4)]">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DirectMessagesList;
