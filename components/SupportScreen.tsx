import React from 'react';

interface SupportScreenProps {
    onBack: () => void;
}

const SupportScreen: React.FC<SupportScreenProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-[#0d1b30] text-white p-4 pb-20 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pt-4">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Ajuda e Suporte</h1>
            </div>

            <div className="bg-[#0a1628] border border-white/10 rounded-xl p-6 text-center shadow-lg">
                <h2 className="text-lg font-bold mb-4">Como podemos ajudar?</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Encontre respostas nas nossas perguntas frequentes ou entre em contato com nosso time de suporte via WhatsApp.
                </p>

                <button
                    className="w-full bg-neon-green text-[#0a1628] py-3 rounded-lg font-bold hover:bg-[#ccff00] transition-colors mb-4 flex items-center justify-center gap-2"
                    onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Falar com Suporte
                </button>

                <button className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors border border-white/5">
                    Perguntas Frequentes (FAQ)
                </button>
            </div>
        </div>
    );
};

export default SupportScreen;
