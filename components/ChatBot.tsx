
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, GroundingSource, DraftMatchData } from '../types';
import { getBotResponse } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { ChatIcon, SendIcon, CloseIcon } from './Icons';

interface ChatBotProps {
    onDraftMatch?: (data: DraftMatchData) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onDraftMatch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Olá! 👋 Sou o FutMatchBot. Como posso te ajudar a encontrar uma partida hoje?', sender: 'bot' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                () => {
                    console.warn("Geolocation permission denied.");
                }
            );
        }
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (userInput.trim() === '' || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user'
    };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    const { text, sources, draftData } = await getBotResponse(userInput, userLocation);
    
    const newBotMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: text || (draftData ? "Entendido! Abrindo o formulário para você conferir..." : "Não entendi, pode repetir?"),
      sender: 'bot',
      sources,
    };
    setMessages(prev => [...prev, newBotMessage]);
    
    if (draftData && onDraftMatch) {
        onDraftMatch(draftData);
    }

    setIsLoading(false);
  }, [userInput, isLoading, userLocation, onDraftMatch]);

  const renderMessage = (message: ChatMessage) => {
    const isBot = message.sender === 'bot';
    return (
        <div key={message.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
            <div className={`rounded-2xl p-3 max-w-sm ${isBot ? 'bg-gray-700 text-white rounded-bl-none' : 'bg-green-500 text-white rounded-br-none'}`}>
                <p className="text-sm">{message.text}</p>
                {message.sources && message.sources.length > 0 && (
                     <div className="mt-2 border-t border-gray-600 pt-2">
                         <h4 className="text-xs font-bold text-gray-400 mb-1">Fontes:</h4>
                         {message.sources.map((source: GroundingSource, index: number) => (
                             <a 
                                 href={source.uri} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 key={index}
                                 className="text-xs text-green-400 hover:underline block truncate"
                             >
                                 {source.title || 'Ver no Google Maps'}
                             </a>
                         ))}
                     </div>
                 )}
            </div>
        </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 bg-green-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform z-50"
        aria-label="Open Chat"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {isOpen && (
        <div className="fixed bottom-44 right-4 w-full max-w-sm h-3/5 bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right transform scale-100 opacity-100 sm:max-w-md sm:h-2/3 md:bottom-24">
          <header className="bg-gray-900 p-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">FutMatchBot 🤖</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <CloseIcon />
            </button>
          </header>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map(renderMessage)}
            {isLoading && (
                <div className="flex justify-start mb-4">
                     <div className="rounded-2xl p-3 max-w-sm bg-gray-700 text-white rounded-bl-none flex items-center">
                        <LoadingSpinner size={4}/>
                        <span className="ml-2 text-sm italic">Digitando...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-gray-900 rounded-b-2xl border-t border-gray-700">
            <div className="flex items-center bg-gray-700 rounded-full p-1">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ex: Criar jogo de vôlei amanhã..."
                className="flex-1 bg-transparent text-white px-4 focus:outline-none"
              />
              <button onClick={handleSendMessage} disabled={isLoading} className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50">
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
