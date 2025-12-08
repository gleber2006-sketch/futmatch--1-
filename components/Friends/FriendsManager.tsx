import React, { useState } from 'react';
import { Profile } from '../../types';
import FriendList from './FriendList';
import FriendRequests from './FriendRequests';
import UserSearch from './UserSearch';
import { CloseIcon } from '../Icons';

interface FriendsManagerProps {
    currentUser: Profile;
    onClose: () => void;
}

const FriendsManager: React.FC<FriendsManagerProps> = ({ currentUser, onClose }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'requests' | 'search'>('list');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-[#0a1628] border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md h-[80vh] flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#0d1b30]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        👥 Meus Amigos
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-[#0a1628]">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'list'
                                ? 'bg-neon-green text-[#0a1628] shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        Amigos
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'requests'
                                ? 'bg-neon-green text-[#0a1628] shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        Solicitações
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'search'
                                ? 'bg-neon-green text-[#0a1628] shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        Buscar
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#0a1628]">
                    {activeTab === 'list' && <FriendList currentUser={currentUser} />}
                    {activeTab === 'requests' && <FriendRequests currentUser={currentUser} />}
                    {activeTab === 'search' && <UserSearch currentUser={currentUser} />}
                </div>
            </div>
        </div>
    );
};

export default FriendsManager;
