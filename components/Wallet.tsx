
import React from 'react';
import { Profile } from '../types';

interface WalletProps {
  currentUser: Profile;
  onNavigateBack: () => void;
}

const Wallet: React.FC<WalletProps> = ({ currentUser, onNavigateBack }) => {
  return (
    <div className="bg-gray-900 min-h-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-b-xl shadow-md mb-6 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-white">Carteira FutMatch</h2>
        <button 
            onClick={onNavigateBack}
            className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
        >
            Voltar
        </button>
      </div>

      <div className="px-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-2xl p-6 shadow-xl mb-6 border border-yellow-500/30 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl"></div>
            
            <h3 className="text-yellow-100 font-semibold text-sm uppercase tracking-wider mb-1">Saldo Disponível</h3>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-5xl font-bold text-white">{currentUser.matchCoins}</span>
                <span className="text-4xl">⚡</span>
            </div>
            <p className="text-yellow-100/80 text-sm">
                MatchCoins (MTC)
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 text-xs text-yellow-50">
                Use suas MatchCoins para criar partidas, entrar em jogos e dar BOOST nos seus matches.
            </div>
        </div>

        <div className="space-y-4">
            {/* Buy Action (Placeholder) */}
            <button 
                onClick={() => alert("Em breve: Compra de pacotes de MatchCoins via PIX e Cartão.")}
                className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex items-center justify-between transition-colors group border border-gray-700"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        💰
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-white">Comprar MatchCoins</h4>
                        <p className="text-xs text-gray-400">1 MatchCoin = R$ 1,50</p>
                    </div>
                </div>
                <div className="text-gray-500">›</div>
            </button>

             {/* Refer Action (Placeholder) */}
             <button 
                onClick={() => alert("Em breve: Convide amigos e ganhe +5 MatchCoins por cadastro!")}
                className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex items-center justify-between transition-colors group border border-gray-700"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        🎁
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-white">Indicar Amigo</h4>
                        <p className="text-xs text-gray-400">Ganhe tokens convidando</p>
                    </div>
                </div>
                <div className="text-gray-500">›</div>
            </button>

             {/* History Action (Placeholder) */}
             <button 
                onClick={() => alert("Em breve: Extrato detalhado de uso das suas moedas.")}
                className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex items-center justify-between transition-colors group border border-gray-700"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-600/20 text-gray-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        📜
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-white">Histórico de Uso</h4>
                        <p className="text-xs text-gray-400">Veja suas transações</p>
                    </div>
                </div>
                <div className="text-gray-500">›</div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
