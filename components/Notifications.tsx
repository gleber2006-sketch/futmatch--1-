
import React, { useState, useEffect } from 'react';
import { Notification, Profile } from '../types';
import { supabase } from '../services/supabaseClient';
import ModernLoader from './ModernLoader';

interface NotificationsProps {
  currentUser: Profile;
  onNavigateBack: () => void;
  onNavigateToDirectChat: (matchId: number) => void;
  onNavigateToCommunity: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ currentUser, onNavigateBack, onNavigateToDirectChat, onNavigateToCommunity }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser.id]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // 1. Optimistic update
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));

    // 2. Database update
    try {
      if (!notification.is_read) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
      }
    } catch (err) {
      console.warn("Failed to mark notification as read", err);
    }

    // 3. Navigation Logic
    if (notification.data) {
      if (notification.data.match_id) {
        onNavigateToDirectChat(notification.data.match_id);
      } else if (notification.data.post_id) {
        onNavigateToCommunity();
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'agora';
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
    return `há ${Math.floor(diff / 86400)} d`;
  };

  return (
    <div className="bg-gray-900 min-h-full pb-20">
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-b-xl shadow-md mb-4 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-white">Notificações</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
        >
          Voltar
        </button>
      </div>

      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><ModernLoader /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 px-6 bg-gray-800 rounded-xl border border-gray-700 border-dashed">
            <p className="text-5xl mb-4">🔕</p>
            <h3 className="text-lg font-bold text-white mb-2">Tudo limpo por aqui</h3>
            <p className="text-gray-400 text-sm">
              Você ainda não tem notificações. Jogue partidas e participe da comunidade para receber alertas aqui.
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                        p-4 rounded-xl cursor-pointer transition-all hover:bg-gray-700 relative overflow-hidden
                        ${notification.is_read ? 'bg-gray-800/60 text-gray-400' : 'bg-gray-800 border-l-4 border-green-500 shadow-md'}
                    `}
            >
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-sm mb-1 ${notification.is_read ? 'text-gray-400' : 'text-white'}`}>
                  {notification.title}
                </h3>
                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                  {formatDate(notification.created_at)}
                </span>
              </div>
              <p className={`text-xs ${notification.is_read ? 'text-gray-500' : 'text-gray-300'}`}>
                {notification.body}
              </p>

              {!notification.is_read && (
                <div className="absolute top-4 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
