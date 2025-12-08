
import React, { useState, useEffect } from 'react';
import { Profile, Post, Comment } from '../types';
import { supabase } from '../services/supabaseClient';
import { HeartIcon, CommentIcon, SendIcon, CloseIcon } from './Icons';
import ModernLoader from './ModernLoader';

interface CommunityProps {
    currentUser: Profile;
    onNavigateBack: () => void;
}

const PostItem: React.FC<{ post: Post; currentUser: Profile; onLikeToggle: (postId: string, isLiked: boolean) => void }> = ({ post, currentUser, onLikeToggle }) => {
    const [isCommentsOpen, setIsCommentsOpen] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSendingComment, setIsSendingComment] = useState(false);

    useEffect(() => {
        if (isCommentsOpen && comments.length === 0 && post.comments_count > 0) {
            fetchComments();
        }
    }, [isCommentsOpen]);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('community_comments')
                .select('*, profiles(name, photo_url)')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedComments: Comment[] = (data || []).map((item: any) => ({
                ...item,
                profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
            }));

            setComments(formattedComments);
        } catch (error: any) {
            console.error('Error fetching comments:', error.message);
        } finally {
            setIsLoadingComments(false);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;

        setIsSendingComment(true);
        try {
            const { data, error } = await supabase
                .from('community_comments')
                .insert({
                    post_id: post.id,
                    user_id: currentUser.id,
                    content: newComment
                })
                .select('*, profiles(name, photo_url)')
                .single();

            if (error) throw error;

            const newCommentObj: Comment = {
                ...data,
                profiles: { name: currentUser.name, photo_url: currentUser.photoUrl }
            };

            setComments(prev => [...prev, newCommentObj]);
            setNewComment('');

        } catch (error: any) {
            console.error('Error sending comment:', error.message);
        } finally {
            setIsSendingComment(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return 'agora';
        if (diff < 3600) return `${Math.floor(diff / 60)}min`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-md animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
                <img
                    src={post.profiles?.photo_url || `https://ui-avatars.com/api/?name=${post.profiles?.name || 'User'}`}
                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                    alt={post.profiles?.name}
                />
                <div>
                    <h3 className="font-bold text-white text-sm">{post.profiles?.name}</h3>
                    <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                </div>
            </div>

            <p className="text-gray-200 mb-3 whitespace-pre-wrap text-sm leading-relaxed">
                {post.content}
            </p>

            {post.image_url && (
                <div className="mb-3 rounded-lg overflow-hidden">
                    <img src={post.image_url} alt="Post attachment" className="w-full h-auto max-h-96 object-cover" />
                </div>
            )}

            <div className="flex items-center gap-6 pt-3 border-t border-gray-700">
                <button
                    onClick={() => onLikeToggle(post.id, !!post.user_has_liked)}
                    className={`flex items-center gap-2 transition-colors ${post.user_has_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                >
                    <HeartIcon filled={post.user_has_liked} />
                    <span className="text-sm font-medium">{post.likes_count || 0}</span>
                </button>
                <button
                    onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                    className={`flex items-center gap-2 transition-colors ${isCommentsOpen ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                >
                    <CommentIcon />
                    <span className="text-sm font-medium">{comments.length > 0 ? comments.length : (post.comments_count || 0)}</span>
                </button>
            </div>

            {isCommentsOpen && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                    {isLoadingComments ? (
                        <div className="flex justify-center py-2 text-gray-400 text-xs">Carregando comentários...</div>
                    ) : (
                        <div className="space-y-3 mb-4">
                            {comments.length > 0 && (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2 items-start">
                                        <img
                                            src={comment.profiles?.photo_url || `https://ui-avatars.com/api/?name=${comment.profiles?.name || 'User'}`}
                                            className="w-6 h-6 rounded-full object-cover mt-1"
                                            alt="Avatar"
                                        />
                                        <div className="bg-gray-700/50 p-2 rounded-lg rounded-tl-none flex-1">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-bold text-white text-xs">{comment.profiles?.name}</span>
                                                <span className="text-[10px] text-gray-500">{formatDate(comment.created_at)}</span>
                                            </div>
                                            <p className="text-gray-300 text-xs mt-1">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {comments.length === 0 && post.comments_count === 0 && (
                                <p className="text-gray-500 text-xs italic mb-2">Seja o primeiro a comentar!</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <img
                            src={currentUser.photoUrl}
                            className="w-7 h-7 rounded-full object-cover"
                            alt="You"
                        />
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                                placeholder="Escreva um comentário..."
                                className="w-full bg-gray-900 text-white text-sm px-3 py-2 rounded-full border border-gray-700 focus:border-green-500 focus:outline-none pr-10"
                            />
                            <button
                                onClick={handleSendComment}
                                disabled={isSendingComment || !newComment.trim()}
                                className="absolute right-1 top-1 p-1 bg-green-500 hover:bg-green-600 rounded-full text-white disabled:opacity-50 transition-colors"
                            >
                                {isSendingComment ? <div className="animate-pulse">...</div> : <div className="w-4 h-4"><SendIcon /></div>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const Community: React.FC<CommunityProps> = ({ currentUser, onNavigateBack }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState<File | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [currentUser]);

    const fetchPosts = async () => {
        console.log('[Community Debug] Starting fetchPosts...');
        console.log('[Community Debug] Current user:', currentUser?.id, currentUser?.name);

        try {
            console.log('[Community Debug] Fetching posts from Supabase...');
            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select('*, profiles!user_id(name, photo_url)')
                .order('created_at', { ascending: false });

            console.log('[Community Debug] Posts query result:', {
                postsCount: postsData?.length || 0,
                error: postsError?.message || null
            });

            if (postsError) {
                console.error('[Community Debug] ERROR fetching posts:', postsError);
                throw postsError;
            }

            console.log('[Community Debug] Fetching user likes...');
            const { data: myLikes, error: likesError } = await supabase
                .from('community_likes')
                .select('post_id')
                .eq('user_id', currentUser.id);

            if (likesError) {
                console.warn('[Community Debug] Warning fetching likes (non-critical):', likesError);
            }

            const likedPostIds = new Set(myLikes?.map((l: any) => l.post_id));

            const formattedPosts: Post[] = (postsData || []).map((item: any) => ({
                ...item,
                profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
                user_has_liked: likedPostIds.has(item.id)
            }));

            console.log('[Community Debug] Formatted posts:', formattedPosts.length);
            console.log('[Community Debug] First post sample:', formattedPosts[0]);

            setPosts(formattedPosts);
        } catch (error: any) {
            console.error('[Community Debug] CRITICAL ERROR in fetchPosts:', error);
            console.error('[Community Debug] Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
        } finally {
            setIsLoading(false);
            console.log('[Community Debug] fetchPosts completed, isLoading set to false');
        }
    };

    const handleLikeToggle = async (postId: string, isLiked: boolean) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    user_has_liked: !isLiked,
                    likes_count: isLiked ? Math.max(0, (p.likes_count || 0) - 1) : (p.likes_count || 0) + 1
                };
            }
            return p;
        }));

        try {
            if (isLiked) {
                const { error } = await supabase
                    .from('community_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', currentUser.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('community_likes')
                    .insert({ post_id: postId, user_id: currentUser.id });
                if (error) throw error;
            }
        } catch (error: any) {
            console.error('Error toggling like:', error.message);
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        user_has_liked: isLiked,
                        likes_count: isLiked ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 0) - 1)
                    };
                }
                return p;
            }));
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        setIsPosting(true);
        try {
            let imageUrl = null;

            if (newPostImage) {
                const fileExt = newPostImage.name.split('.').pop();
                const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, newPostImage);

                if (uploadError) {
                    console.warn("Upload failed, posting text only.", uploadError);
                } else {
                    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                    imageUrl = data.publicUrl;
                }
            }

            const { error } = await supabase
                .from('community_posts')
                .insert({
                    user_id: currentUser.id,
                    content: newPostContent,
                    image_url: imageUrl
                });

            if (error) throw error;

            setNewPostContent('');
            setNewPostImage(null);
            setShowCreateModal(false);
            fetchPosts();
        } catch (error: any) {
            console.error('Error creating post:', error.message || error);
            alert('Erro ao criar post. Tente novamente.');
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-full pb-20">
            <div className="flex items-center justify-between bg-gray-800 p-4 rounded-b-xl shadow-md mb-4 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white">Comunidade</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-1 px-3 rounded-lg text-sm hover:brightness-110 transition-all"
                >
                    Voltar
                </button>
            </div>

            <div className="px-4 mb-4">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full bg-gray-800 border border-gray-700 hover:border-green-500 text-left text-gray-400 py-3 px-4 rounded-xl transition-colors flex items-center gap-3"
                >
                    <img
                        src={currentUser.photoUrl || `https://ui-avatars.com/api/?name=${currentUser.name}`}
                        className="w-8 h-8 rounded-full object-cover"
                        alt="Avatar"
                    />
                    <span>No que você está pensando, {currentUser.name.split(' ')[0]}?</span>
                </button>
            </div>

            <div className="px-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10"><ModernLoader /></div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>Nenhum post ainda. Seja o primeiro a postar!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostItem
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onLikeToggle={handleLikeToggle}
                        />
                    ))
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h3 className="font-bold text-white">Criar Publicação</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Escreva algo..."
                                className="w-full bg-gray-900 text-white p-3 rounded-lg min-h-[120px] border border-gray-700 focus:border-green-500 focus:outline-none mb-4"
                            />

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Adicionar Imagem (Opcional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setNewPostImage(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-green-400 hover:file:bg-gray-600"
                                />
                            </div>

                            <button
                                onClick={handleCreatePost}
                                disabled={isPosting || !newPostContent.trim()}
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex justify-center"
                            >
                                {isPosting ? 'Publicando...' : 'Publicar'}
                            </button>
                            {isPosting && <ModernLoader />}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
          }
        `}</style>
        </div>
    );
};

export default Community;
