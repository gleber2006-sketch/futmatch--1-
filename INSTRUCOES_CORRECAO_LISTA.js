// ========================================
// CORREÇÃO: Lista de Participantes Duplicada
// ========================================
// Este arquivo contém APENAS a correção para a lista de participantes
// NÃO MEXE NO CONTADOR (filled_slots)
// ========================================

// PROBLEMA IDENTIFICADO:
// A lista de participantes está sendo atualizada em 2 lugares:
// 1. Otimisticamente no frontend (handleJoinMatch)
// 2. Via subscrição em tempo real (participantsSubscription)
// Isso causa duplicação na lista

// SOLUÇÃO:
// Remover a atualização otimista da lista de participantes
// Deixar APENAS a subscrição em tempo real atualizar a lista

// ========================================
// INSTRUÇÕES:
// ========================================
// No arquivo App.tsx, nas funções handleJoinMatch e handleLeaveMatch,
// REMOVER completamente a atualização de match_participants
// Deixar APENAS o setJoinedMatchIds

// ========================================
// CÓDIGO A SER APLICADO:
// ========================================

// Na função handleJoinMatch (linha ~726), substituir:
/*
ANTES:
if (status === 'OK' || status === 'confirmed') {
    setJoinedMatchIds(prev => new Set(prev).add(matchId));

    setMatches(prev => prev.map(m => {
        if (m.id === matchId) {
            const currentParticipants = Array.isArray(m.match_participants) ? m.match_participants : [];
            const filteredParticipants = currentParticipants.filter(p => p.user_id !== currentUser.id);

            const newParticipant: MatchParticipant = {
                match_id: matchId,
                user_id: currentUser.id,
                joined_at: new Date().toISOString(),
                status: 'confirmed',
                profiles: currentUser
            };

            return {
                ...m,
                match_participants: [...filteredParticipants, newParticipant]
            };
        }
        return m;
    }));

    setCurrentUser(...);
    ...
}
*/

// DEPOIS:
/*
if (status === 'OK' || status === 'confirmed') {
    // Apenas marca que o usuário entrou - a lista será atualizada via realtime
    setJoinedMatchIds(prev => new Set(prev).add(matchId));

    setCurrentUser(prev => prev ? ({
        ...prev,
        matchCoins: Math.max(0, prev.matchCoins - 1),
        points: prev.points + 1,
        matchesPlayed: prev.matchesPlayed + 1
    }) : null);

    if (session?.user) fetchUserProfile(session.user).catch(console.error);

    setShowConfirmation("Você entrou na partida! 1 MatchCoin foi utilizado.");
    setTimeout(() => setShowConfirmation(null), 3000);
}
*/

// ========================================
// Fazer o mesmo para a seção ALREADY_IN (linha ~772)
// E para handleLeaveMatch (linhas ~835 e ~867)
// ========================================

// IMPORTANTE:
// - NÃO mexer em filled_slots
// - NÃO mexer na subscrição em tempo real
// - Apenas REMOVER as atualizações otimistas de match_participants
