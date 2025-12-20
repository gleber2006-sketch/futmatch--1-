import React from 'react';

interface SettingsScreenProps {
    onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-[#0d1b30] text-white p-4 pb-20 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pt-4">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Configurações</h1>
            </div>

            <div className="space-y-4">
                {/* Placeholder Items */}
                <div className="bg-[#0a1628] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Notificações</h3>
                        <p className="text-xs text-gray-400">Gerenciar alertas e push notifications.</p>
                    </div>
                    <div className="w-10 h-6 bg-neon-green/20 rounded-full border border-neon-green/50 relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-neon-green rounded-full shadow-md"></div>
                    </div>
                </div>

                <div className="bg-[#0a1628] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Privacidade</h3>
                        <p className="text-xs text-gray-400">Quem pode ver seu perfil e seus dados.</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </div>

                <div className="bg-[#0a1628] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Idioma</h3>
                        <p className="text-xs text-gray-400">Português (Brasil)</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </div>

                <div className="bg-[#0a1628] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-red-400">Excluir Conta</h3>
                        <p className="text-xs text-gray-500">Esta ação é irreversível.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsScreen;
