
import React, { useState, useRef } from 'react';
import { teamService } from '../services/teamService';
import { supabase } from '../services/supabaseClient';

interface CreateTeamModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ userId, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação de Tamanho (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 2MB.");
            return;
        }

        // Validação de Tipo
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            alert("Apenas arquivos PNG, JPG e JPEG são permitidos.");
            return;
        }

        setImageFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const uploadLogo = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `team_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`; // Armazenar na raiz ou pasta específica

        const { error: uploadError } = await supabase.storage
            .from('team-logos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('team-logos').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            let finalLogoUrl = '';

            if (imageFile) {
                finalLogoUrl = await uploadLogo(imageFile);
            }

            await teamService.createTeam(userId, name, description, finalLogoUrl || undefined);
            alert('Time criado com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao criar time:', error);
            alert('Erro ao criar time: ' + (error.message || "Erro desconhecido"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 overflow-hidden shadow-xl animate-fade-in-up">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        🛡️ Criar Novo Time
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Image Upload Area */}
                    <div className="flex flex-col items-center mb-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 hover:border-green-500 hover:bg-gray-600 transition-all cursor-pointer flex items-center justify-center overflow-hidden relative group"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl text-gray-400 group-hover:text-green-500">📷</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-white font-bold">Alterar</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Toque para adicionar escudo (Max 2MB)</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Time *</label>
                        <input
                            type="text"
                            required
                            maxLength={30}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder-gray-500"
                            placeholder="Ex: Galáticos FC"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                        <textarea
                            maxLength={150}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder-gray-500 h-24 resize-none"
                            placeholder="Breve descrição do seu time..."
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Criando...' : 'Criar Time'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;
