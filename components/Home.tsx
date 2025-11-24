
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
        if(password.length < 6) {
            alert("A senha deve ter no mínimo 6 caracteres.");
            return;
        }
        if(!dateOfBirth) {
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


    const inputClasses = "w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 placeholder-gray-400";

    const multiSelectButtonClasses = (isSelected: boolean) => 
        `px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
            isSelected
                ? 'bg-gradient-to-r from-green-600 to-green-400 text-white font-semibold shadow-md'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
        }`;

    const renderContent = () => {
        switch(view) {
            case 'login':
                return (
                    <>
                        <h2 className="text-3xl font-bold text-center text-white mb-2">Bem-vindo!</h2>
                        <p className="text-gray-400 text-center mb-6">Acesse sua conta para continuar.</p>
                        
                        {loginError && (
                            <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
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
                                <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
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
                                  className="absolute bottom-0 right-0 flex items-center pr-3 h-[48px] text-gray-400 hover:text-white"
                                  aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                                >
                                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <label className="flex items-center text-gray-400">
                                    <input type="checkbox" className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"/>
                                    <span className="ml-2">Lembrar login</span>
                                </label>
                                <a href="#" className="font-semibold text-green-400 hover:underline">Esqueci a senha</a>
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 rounded-lg font-semibold shadow-lg hover:brightness-110 transition-all">
                                Entrar
                            </button>
                        </form>
                        <div className="flex items-center my-6">
                            <hr className="flex-grow border-gray-600"/><span className="mx-4 text-gray-400 text-sm font-semibold">OU</span><hr className="flex-grow border-gray-600"/>
                        </div>
                        <button onClick={onGoogleLogin} className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white p-3 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 opacity-60 cursor-not-allowed" disabled>
                            <GoogleIcon /> Continuar com Google
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2 px-4">
                            Login com Google desabilitado neste ambiente. Por favor, use o e-mail.
                        </p>
                        <button onClick={() => setView('welcome')} className="w-full mt-6 text-sm text-gray-400 hover:text-white underline">Voltar</button>
                    </>
                );
            case 'register':
                 return (
                    <>
                        <h2 className="text-3xl font-bold text-center text-white mb-6">Crie sua Conta</h2>
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                             <div className="flex justify-center mb-4">
                                <label
                                    htmlFor="photo-upload"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative cursor-pointer w-24 h-24 rounded-full border-4 transition-all duration-300 flex items-center justify-center ${isDragging ? 'border-green-500 scale-110' : 'border-gray-600 hover:border-green-500'}`}
                                >
                                    <img src={photoUrl} alt="Preview" className="w-full h-full rounded-full object-cover"/>
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                            <p className="text-white text-xs font-bold text-center">Solte a imagem</p>
                                        </div>
                                    )}
                                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden"/>
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
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                                  aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                                >
                                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                                    <input type="text" value="SP" className={`${inputClasses} bg-gray-600 cursor-not-allowed`} disabled />
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Cidade</label>
                                    <select value={city} onChange={e => setCity(e.target.value)} className={inputClasses} required>
                                        {CITY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                               <label className="block text-sm font-medium text-gray-300 mb-1">Data de Nascimento</label>
                                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClasses} required />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Quais esportes você joga?</label>
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Em quais posições?</label>
                                     <div className="flex flex-wrap gap-2">
                                        {availablePositions.map(position => (
                                            <button key={position} type="button" onClick={() => handleMultiSelectToggle(setPositions, position)} className={multiSelectButtonClasses(positions.includes(position))}>
                                                {position}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 rounded-lg font-semibold shadow-lg hover:brightness-110 transition-all" disabled={isRegistering}>
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
                               <hr className="flex-grow border-gray-600"/><span className="mx-4 text-gray-400 text-sm font-semibold">OU</span><hr className="flex-grow border-gray-600"/>
                            </div>
                             <button onClick={onGoogleLogin} className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white p-3 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 opacity-60 cursor-not-allowed" disabled>
                                <GoogleIcon /> Continuar com Google
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2 px-4">
                                Login com Google desabilitado neste ambiente. Por favor, use o e-mail.
                            </p>
                            <button onClick={() => setView('welcome')} className="w-full mt-4 text-sm text-gray-400 hover:text-white underline">Voltar</button>
                        </form>
                    </>
                );
            case 'welcome':
            default:
                return (
                     <>
                        <div className="flex justify-center mb-6">
                           <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center border-4 border-green-500 shadow-lg">
                                <span className="text-5xl animate-pulse">⚽</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-center text-white">FutMatch</h1>
                        <p className="text-gray-300 text-center mt-2 mb-10">Seu jogo está a um passo do seu próximo match.</p>
                        <div className="space-y-4">
                            <button onClick={onGoogleLogin} className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white p-3 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 opacity-60 cursor-not-allowed" disabled>
                                <GoogleIcon /> Continuar com Google
                            </button>
                            <p className="text-xs text-gray-500 text-center -mt-2 px-4">
                                Login com Google desabilitado neste ambiente. Use o e-mail.
                            </p>
                             <button onClick={() => setView('login')} className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white p-3 rounded-lg font-semibold shadow-lg hover:brightness-110 transition-all">Entrar com E-mail</button>
                            <button onClick={() => setView('register')} className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 rounded-lg font-bold shadow-xl hover:brightness-110 transition-all transform hover:scale-105">Criar Nova Conta</button>
                        </div>
                    </>
                );
        }
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-white p-4 transition-all duration-1000"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 bg-black/75 z-0"></div>
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-8 transition-all duration-300">
                   {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Home;
