
import React, { useState, useEffect, useRef } from 'react';
import { GoogleIcon, EyeIcon, EyeOffIcon } from './Icons';
import { Profile } from '../types';
import LoadingSpinner from './LoadingSpinner';
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
    const [backgroundImage, setBackgroundImage] = useState('https://images.unsplash.com/photo-1551958214-2d59cc7a3d46?q=80&w=2070&auto=format&fit=crop');
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


    const inputClasses = "w-full bg-[#0a1628]/80 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-neon-green/50 focus:border-neon-green transition-all duration-200 placeholder-gray-500 backdrop-blur-sm";

    const multiSelectButtonClasses = (isSelected: boolean) =>
        `px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${isSelected
            ? 'bg-neon-green/20 border-neon-green text-neon-green font-bold shadow-[0_0_10px_rgba(0,255,148,0.2)]'
            : 'bg-[#0a1628]/50 border-white/10 text-gray-400 hover:border-white/30'
        }`;

    const renderContent = () => {
        switch (view) {
            case 'login':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold text-center text-white mb-2 drop-shadow-md">Bem-vindo!</h2>
                        <p className="text-gray-400 text-center mb-6">Acesse sua conta para continuar.</p>

                        {loginError && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-center text-sm backdrop-blur-sm">
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="voce@email.com"
                                    className={inputClasses}
                                    value={loginEmail}
                                    onChange={(e) => { setLoginEmail(e.target.value); clearLoginError(); }}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Senha</label>
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
                                    className="absolute bottom-0 right-0 flex items-center pr-3 h-[48px] text-gray-400 hover:text-white transition-colors"
                                    aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            <div className="flex justify-between items-center text-sm px-1">
                                <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors">
                                    <input type="checkbox" className="h-4 w-4 rounded bg-[#0a1628] border-gray-600 text-neon-green focus:ring-neon-green" />
                                    <span className="ml-2">Lembrar login</span>
                                </label>
                                <a href="#" className="font-semibold text-neon-green hover:text-[#00e686] hover:underline transition-colors">Esqueci a senha</a>
                            </div>
                            <button type="submit" className="w-full bg-[#00FF94] text-[#0a1628] p-3 rounded-lg font-bold shadow-lg hover:bg-[#00e686] hover:shadow-[0_0_20px_rgba(0,255,148,0.4)] transition-all transform hover:scale-[1.02]">
                                Entrar
                            </button>
                        </form>
                        <div className="flex items-center my-6">
                            <hr className="flex-grow border-white/10" /><span className="mx-4 text-gray-500 text-xs font-bold uppercase tracking-widest">OU</span><hr className="flex-grow border-white/10" />
                        </div>
                        <button onClick={onGoogleLogin} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 opacity-50 cursor-not-allowed hover:bg-white/10 transition-all" disabled>
                            <GoogleIcon /> Continuar com Google
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2 px-4">
                            Login com Google desabilitado neste ambiente. Por favor, use o e-mail.
                        </p>
                        <button onClick={() => setView('welcome')} className="w-full mt-6 text-sm text-gray-400 hover:text-white underline transition-colors">Voltar</button>
                    </div>
                );
            case 'register':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold text-center text-white mb-6 drop-shadow-md">Crie sua Conta</h2>

                        {loginError && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-center text-sm backdrop-blur-sm">
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
                                    className={`relative cursor-pointer w-28 h-28 rounded-full border-4 transition-all duration-300 flex items-center justify-center overflow-hidden shadow-xl group ${isDragging ? 'border-neon-green scale-110 shadow-[0_0_20px_rgba(0,255,148,0.5)]' : 'border-[#0a1628] hover:border-neon-green'}`}
                                >
                                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-bold text-center px-2">Alterar Foto</p>
                                    </div>
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-neon-green/20 flex items-center justify-center backdrop-blur-sm">
                                            <p className="text-white text-xs font-bold text-center drop-shadow-md">Solte a imagem</p>
                                        </div>
                                    )}
                                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            </div>
                            <input type="text" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                            <input type="email" placeholder="Seu melhor e-mail" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                            <div className="relative">
                                <input
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    placeholder="Senha (mín. 6 caracteres)"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`${inputClasses} pr-10`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                                    aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Estado</label>
                                    <input type="text" value="SP" className={`${inputClasses} bg-[#0a1628]/50 cursor-not-allowed opacity-70`} disabled />
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Cidade</label>
                                    <select value={city} onChange={e => setCity(e.target.value)} className={inputClasses} required>
                                        {CITY_LIST.map(c => <option key={c} value={c} className="bg-[#0a1628] text-white">{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Data de Nascimento</label>
                                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClasses} required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Quais esportes você joga?</label>
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Em quais posições?</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availablePositions.map(position => (
                                            <button key={position} type="button" onClick={() => handleMultiSelectToggle(setPositions, position)} className={multiSelectButtonClasses(positions.includes(position))}>
                                                {position}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-[#00FF94] text-[#0a1628] p-3 rounded-lg font-bold shadow-lg hover:bg-[#00e686] hover:shadow-[0_0_20px_rgba(0,255,148,0.4)] transition-all transform hover:scale-[1.02] mt-4" disabled={isRegistering}>
                                {isRegistering ? (
                                    <div className="flex items-center justify-center">
                                        <LoadingSpinner size={5} />
                                        <span className="ml-2">Registrando...</span>
                                    </div>
                                ) : (
                                    'Criar Conta'
                                )}
                            </button>

                            <div className="flex items-center my-4">
                                <hr className="flex-grow border-white/10" /><span className="mx-4 text-gray-500 text-xs font-bold uppercase tracking-widest">OU</span><hr className="flex-grow border-white/10" />
                            </div>
                            <button onClick={onGoogleLogin} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 opacity-50 cursor-not-allowed hover:bg-white/10 transition-all" disabled>
                                <GoogleIcon /> Continuar com Google
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2 px-4">
                                Login com Google desabilitado neste ambiente. Por favor, use o e-mail.
                            </p>
                            <button onClick={() => setView('welcome')} className="w-full mt-4 text-sm text-gray-400 hover:text-white underline transition-colors">Voltar</button>
                        </form>
                    </div>
                );
            case 'welcome':
            default:
                return (
                    <div className="animate-fade-in text-center">
                        <div className="flex justify-center mb-8">
                            <div className="w-28 h-28 rounded-full bg-[#0a1628] flex items-center justify-center border-4 border-neon-green shadow-[0_0_30px_rgba(0,255,148,0.4)] relative">
                                <span className="text-6xl animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">⚽</span>
                                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20"></div>
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">FutMatch</h1>
                        <p className="text-gray-300 text-lg mb-10 max-w-xs mx-auto leading-relaxed">Seu jogo está a um passo do seu próximo match.</p>
                        <div className="space-y-4">
                            <button onClick={onGoogleLogin} className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 opacity-50 cursor-not-allowed hover:bg-white/10 transition-all" disabled>
                                <GoogleIcon /> Continuar com Google
                            </button>
                            <p className="text-xs text-gray-500 -mt-2 px-4">
                                Login com Google desabilitado neste ambiente. Use o e-mail.
                            </p>
                            <button onClick={() => setView('login')} className="w-full bg-[#112240] border border-neon-green/30 text-white p-3 rounded-lg font-semibold shadow-lg hover:bg-[#1a2f55] hover:border-neon-green/50 transition-all">Entrar com E-mail</button>
                            <button onClick={() => setView('register')} className="w-full bg-[#00FF94] text-[#0a1628] p-3 rounded-lg font-bold shadow-[0_0_20px_rgba(0,255,148,0.3)] hover:bg-[#00e686] hover:shadow-[0_0_30px_rgba(0,255,148,0.5)] transition-all transform hover:scale-105">Criar Nova Conta</button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-white p-4 transition-all duration-1000 relative overflow-hidden"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 bg-[#0a1628]/90 z-0"></div>

            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-green/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-[#112240]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 transition-all duration-300">
                    {renderContent()}
                </div>
            </div>
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.4s ease-out forwards;
              }
            `}</style>
        </div>
    );
};

export default Home;
