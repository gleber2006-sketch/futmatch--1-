
import React from 'react';
import { Feature } from '../types';

interface PlatformFeaturesProps {
  features: Feature[];
  onFeatureClick?: (title: string) => void;
}

const PlatformFeatures: React.FC<PlatformFeaturesProps> = ({ features, onFeatureClick }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Funcionalidades da Plataforma</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => {
          const isActionable = 
            feature.title === 'Criar Partida' || 
            feature.title === 'Encontre Partidas Próximas' || 
            feature.title === 'Meus Jogos' || 
            feature.title === 'Meu Perfil' ||
            feature.title === 'Mapa das Partidas' ||
            feature.title === 'Ranking de Jogadores' ||
            feature.title === 'Comunidade' ||
            feature.title === 'Campos e Arenas' ||
            feature.title === 'Chat das Partidas' ||
            feature.title === 'Notificações' ||
            feature.title === 'Carteira FutMatch';
          
          return (
            <div 
              key={index} 
              onClick={() => isActionable && onFeatureClick?.(feature.title)}
              className={`bg-gray-800 rounded-lg p-4 text-center flex flex-col items-center justify-start transform hover:scale-105 transition-transform duration-300 h-full ${isActionable ? 'cursor-pointer active:scale-95' : ''}`}
            >
              <div className="text-4xl mb-2">{feature.icon}</div>
              <h3 className="font-bold text-green-400 text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-400 flex-grow">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformFeatures;
