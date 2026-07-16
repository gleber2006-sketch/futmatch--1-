import React, { useState, useEffect } from 'react';
import { GoogleIcon, EyeIcon, EyeOffIcon } from './Icons';
import { Profile } from '../types';
import ModernLoader from './ModernLoader';
import { SPORTS_LIST, SPORT_POSITIONS, CITY_LIST } from '../constants';

interface HomeProps {
    onLogin: (email?: string, password?: string) => void;
    onGoogleLogin: () => void;
    onRegister: (user: Omit<Profile, 'id' | 'points' | 'matchesPlayed' | 'reputation' | 'matchCoins'> & { password?: string }) => void;
    loginError: string | null;
    clearLoginError: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogin, onRegister, onGoogleLogin, loginError, clearLoginError }) => {
    const [view, setView] = useState<'welcome' | 'login' | 'register'>('welcome');

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [sports, setSports] = useState<string[]>([]);
    const [positions, setPositions] = useState<string[]>([]);
    const [city, setCity] = useState('São Paulo');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [photoUrl, setPhotoUrl] = useState(`https://picsum.photos/seed/${Date.now()}/200`);
    const [isRegistering, setIsRegistering] = useState(false);
    const [availablePositions, setAvailablePositions] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const newAvailablePositions = sports.flatMap(s => SPORT_POSITIONS[s] || []);
        setAvailablePositions([...new Set(newAvailablePositions)]); // Remove duplicates

        // Clean up selected positions if sport is removed
        setPositions(prev => prev.filter(p => newAvailablePositions.includes(p)));
    }, [sports]);

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            alert("A senha deve ter no mínimo 6 caracteres.");
            return;
        }
        if (!dateOfBirth) {
            alert("Por favor, informe sua data de nascimento.");
            return;
        }

        setIsRegistering(true);
        try {
            await onRegister({ name, email, password, photoUrl, dateOfBirth, city, state: 'SP', sport: sports, position: positions, bio: null });
        } catch (error) {
            console.error("Registration failed:", error);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(loginEmail, loginPassword);
    };

    const handleFileSelect = (file: File | undefined) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert("Por favor, selecione um arquivo de imagem válido.");
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0]);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files?.[0]);
    };

    const handleMultiSelectToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev =>
            prev.includes(value)
                ? prev.filter(item => item !== value)
                : [...prev, value]
        );
    };

    // Tech sporty classes overriding defaults
    const inputClasses = "w-full !bg-[#0c0d12] text-white p-3 !rounded-[2px] !border-[#1c2230] focus:outline-none focus:!border-neon-green focus:!ring-1 focus:!ring-neon-green/30 transition-all duration-300 placeholder-gray-600 font-mono text-sm";

    const multiSelectButtonClasses = (isSelected: boolean) =>
        `px-3 py-2 !rounded-[2px] text-xs font-mono uppercase tracking-wider transition-all duration-300 !border ${isSelected
            ? '!bg-neon-green/10 !border-neon-green text-neon-green font-bold shadow-[0_0_12px_rgba(0,255,148,0.15)]'
            : '!bg-[#0c0d12]/80 !border-[#1c2230] text-gray-500 hover:!border-neon-green/50 hover:text-white'
        }`;

    const renderContent = () => {
        switch (view) {
            case 'login':
                return (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-6 border-b border-[#1c2230] pb-3">
                            <h2 className="text-lg font-bold font-mono text-white tracking-wider uppercase">AUTENTICAÇÃO</h2>
                            <span className="text-[9px] font-mono text-neon-green bg-neon-green/10 px-2 py-0.5 border border-neon-green/20">SECURE CONNECT</span>
                        </div>

                        {loginError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-[2px] mb-4 text-center text-xs font-mono backdrop-blur-sm">
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Endereço de E-mail</label>
                                <input
                                    type="email"
                                    placeholder="USUARIO@EMAIL.COM"
                                    className={inputClasses}
                                    value={loginEmail}
                                    onChange={(e) => { setLoginEmail(e.target.value); clearLoginError(); }}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Senha de Acesso</label>
                                <div className="relative">
                                    <input
                                        type={isPasswordVisible ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className={`${inputClasses} pr-10`}
                                        value={loginPassword}
                                        onChange={(e) => { setLoginPassword(e.target.value); clearLoginError(); }}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        className="absolute bottom-0 right-0 flex items-center pr-3 h-[46px] text-gray-500 hover:text-white transition-colors"
                                        aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[11px] px-1 font-mono">
                                <label className="flex items-center text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
                                    <input type="checkbox" className="h-3.5 w-3.5 bg-[#0c0d12] border-[#1c2230] rounded-[1px] text-neon-green focus:ring-0 focus:ring-offset-0 focus:outline-none" />
                                    <span className="ml-2 uppercase tracking-wider">Manter ativo</span>
                                </label>
                                <a href="#" className="font-bold text-neon-blue hover:text-neon-green hover:underline transition-colors uppercase tracking-wider">Recuperar</a>
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-neon-green to-neon-blue text-[#06080c] py-3 rounded-[2px] font-bold font-mono text-sm uppercase tracking-wider shadow-lg hover:shadow-[0_0_20px_rgba(0,255,148,0.3)] transition-all duration-300 relative overflow-hidden group">
                                <span className="relative z-10">Conectar Jogador</span>
                                <div className="absolute inset-0 w-full h-full bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </button>
                        </form>
                        
                        <div className="flex items-center my-6">
                            <hr className="flex-grow border-[#1c2230]" />
                            <span className="mx-4 text-gray-600 text-[10px] font-mono font-bold uppercase tracking-widest">OAUTH SYSTEM</span>
                            <hr className="flex-grow border-[#1c2230]" />
                        </div>
                        
                        <button onClick={onGoogleLogin} className="w-full bg-[#0c0d12]/50 border border-[#1c2230] text-gray-600 py-3 rounded-[2px] font-semibold font-mono text-xs flex items-center justify-center gap-2 opacity-40 cursor-not-allowed" disabled>
                            <GoogleIcon /> GOOGLE LOGIN OFFLINE
                        </button>
                        
                        <button onClick={() => setView('welcome')} className="w-full mt-6 text-xs font-mono uppercase tracking-wider text-gray-500 hover:text-neon-blue transition-colors">
                            &lt; Voltar ao Terminal
                        </button>
                    </div>
                );
            case 'register':
                return (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-6 border-b border-[#1c2230] pb-3">
                            <h2 className="text-lg font-bold font-mono text-white tracking-wider uppercase">NOVO JOGADOR</h2>
                            <span className="text-[9px] font-mono text-neon-blue bg-neon-blue/10 px-2 py-0.5 border border-neon-blue/20">REGISTRO</span>
                        </div>

                        {loginError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-[2px] mb-4 text-center text-xs font-mono backdrop-blur-sm">
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="flex justify-center mb-6">
                                <label
                                    htmlFor="photo-upload"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative cursor-pointer w-24 h-24 border transition-all duration-300 flex items-center justify-center overflow-hidden shadow-xl group ${isDragging ? 'border-neon-green scale-105 shadow-[0_0_15px_rgba(0,255,148,0.3)]' : 'border-[#1c2230] hover:border-neon-green'}`}
                                >
                                    {/* Corners decorators */}
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/40 group-hover:border-neon-green"></div>
                                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-green/40 group-hover:border-neon-green"></div>
                                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-green/40 group-hover:border-neon-green"></div>
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/40 group-hover:border-neon-green"></div>

                                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-[10px] font-mono uppercase tracking-wider font-bold text-center px-1">Upload Foto</p>
                                    </div>
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-neon-green/20 flex items-center justify-center backdrop-blur-sm">
                                            <p className="text-white text-[10px] font-mono font-bold text-center">SOLTAR</p>
                                        </div>
                                    )}
                                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Nome Completo</label>
                                <input type="text" placeholder="EX: FULANO DA SILVA" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Seu melhor e-mail</label>
                                <input type="email" placeholder="EX: NOME@EMAIL.COM" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Senha (mín. 6 caracteres)</label>
                                <div className="relative">
                                    <input
                                        type={isPasswordVisible ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className={`${inputClasses} pr-10`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white transition-colors"
                                        aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Estado</label>
                                    <input type="text" value="SP" className={`${inputClasses} !bg-[#0c0d12]/50 cursor-not-allowed opacity-50`} disabled />
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Cidade</label>
                                    <select value={city} onChange={e => setCity(e.target.value)} className={`${inputClasses} !py-2.5`} required>
                                        {CITY_LIST.map(c => <option key={c} value={c} className="bg-[#07090e] text-white">{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Data de Nascimento</label>
                                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClasses} required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2 ml-1">Quais esportes você joga?</label>
                                <div className="flex flex-wrap gap-2">
                                    {SPORTS_LIST.map(sport => (
                                        <button key={sport} type="button" onClick={() => handleMultiSelectToggle(setSports, sport)} className={multiSelectButtonClasses(sports.includes(sport))}>
                                            {sport}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {availablePositions.length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2 ml-1">Em quais posições?</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availablePositions.map(position => (
                                            <button key={position} type="button" onClick={() => handleMultiSelectToggle(setPositions, position)} className={multiSelectButtonClasses(positions.includes(position))}>
                                                {position}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-gradient-to-r from-neon-green to-neon-blue text-[#06080c] py-3 rounded-[2px] font-bold font-mono text-sm uppercase tracking-wider shadow-lg hover:shadow-[0_0_20px_rgba(0,255,148,0.3)] transition-all duration-300 mt-4 relative overflow-hidden group" disabled={isRegistering}>
                                <span className="relative z-10">{isRegistering ? 'Conectando Ficha...' : 'Finalizar Cadastro'}</span>
                                <div className="absolute inset-0 w-full h-full bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </button>
                            {isRegistering && <ModernLoader />}
                        </form>

                        <div className="flex items-center my-6">
                            <hr className="flex-grow border-[#1c2230]" />
                            <span className="mx-4 text-gray-600 text-[10px] font-mono font-bold uppercase tracking-widest">OAUTH SYSTEM</span>
                            <hr className="flex-grow border-[#1c2230]" />
                        </div>
                        
                        <button onClick={onGoogleLogin} className="w-full bg-[#0c0d12]/50 border border-[#1c2230] text-gray-600 py-3 rounded-[2px] font-semibold font-mono text-xs flex items-center justify-center gap-2 opacity-40 cursor-not-allowed" disabled>
                            <GoogleIcon /> GOOGLE LOGIN OFFLINE
                        </button>
                        
                        <button onClick={() => setView('welcome')} className="w-full mt-6 text-xs font-mono uppercase tracking-wider text-gray-500 hover:text-neon-blue transition-colors">
                            &lt; Voltar ao Terminal
                        </button>
                    </div>
                );
            case 'welcome':
            default:
                return (
                    <div className="animate-fade-in text-center">
                        <div className="flex justify-center mb-6">
                            <div className="relative w-20 h-20 flex items-center justify-center border border-neon-green/30 p-1">
                                {/* Corners decorators */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-green"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-green"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green"></div>
                                
                                <div className="w-full h-full flex items-center justify-center bg-[#07090e] border border-neon-green/10 shadow-[inset_0_0_15px_rgba(0,255,148,0.08)]">
                                    <span className="text-3xl animate-pulse">⚽</span>
                                </div>
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-white mb-1 tracking-wider uppercase font-mono">
                            FUT<span className="text-neon-green">MATCH</span>
                        </h1>
                        <div className="h-[1.5px] w-12 bg-gradient-to-r from-neon-green to-neon-blue mx-auto mb-4"></div>
                        <p className="text-[10px] mb-8 uppercase tracking-widest text-gray-500 font-mono">
                            [ telemetry system v2.1 ]
                        </p>

                        <div className="space-y-3 font-mono">
                            <button
                                onClick={() => setView('login')}
                                className="w-full py-3 px-4 bg-[#0c0d12] border border-[#1c2230] text-xs text-white uppercase tracking-wider font-bold hover:border-neon-green hover:text-neon-green hover:shadow-[0_0_15px_rgba(0,255,148,0.1)] transition-all duration-300 relative group overflow-hidden"
                            >
                                <span className="relative z-10">Entrar no Sistema</span>
                                <div className="absolute inset-0 w-full h-full bg-neon-green/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </button>
                            <button
                                onClick={() => setView('register')}
                                className="w-full py-3 px-4 bg-gradient-to-r from-neon-green to-neon-blue text-xs text-[#06080c] uppercase tracking-wider font-bold hover:shadow-[0_0_20px_rgba(0,255,148,0.3)] transition-all duration-300 relative overflow-hidden group"
                            >
                                <span className="relative z-10">Criar Nova Ficha</span>
                                <div className="absolute inset-0 w-full h-full bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </button>
                        </div>

                        <p className="text-[10px] mt-8 text-gray-600 uppercase font-mono tracking-wider">
                            SECURE SESSION PROTOCOL ACTIVE
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #050608 0%, #0c0d14 50%, #121722 100%)' }}
        >
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: 'linear-gradient(#00FF94 1px, transparent 1px), linear-gradient(90deg, #00FF94 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Scanlines layer */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 4px, 6px 100%'
                }}
            />

            {/* Accent glows */}
            <div className="absolute top-0 left-0 w-80 h-80 opacity-[0.08] pointer-events-none"
                style={{ background: 'radial-gradient(circle at top left, #00FF94, transparent 70%)' }}
            />
            <div className="absolute bottom-0 right-0 w-80 h-80 opacity-[0.08] pointer-events-none"
                style={{ background: 'radial-gradient(circle at bottom right, #00C2FF, transparent 70%)' }}
            />

            <div className="relative z-10 w-full max-w-sm px-4">
                {/* HUD border elements */}
                <div className="h-[2px] bg-gradient-to-r from-neon-green to-neon-blue w-full"></div>
                <div
                    className="bg-[#07090e]/95 p-8 transition-all duration-300 border-x border-b border-[#1c2230] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
                >
                    {/* Corners decorators */}
                    <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-gray-600"></div>
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-gray-600"></div>
                    <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-gray-600"></div>
                    <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-gray-600"></div>

                    {renderContent()}
                </div>
            </div>

            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
              }
            `}</style>
        </div>
    );
};

export default Home;
