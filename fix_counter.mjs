import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('App.tsx', 'utf8');

// Fix 1: Remove optimistic update in handleJoinMatch
const oldJoin = `            if (status === 'OK' || status === 'confirmed') {
                // Success: Update local state optimistically
                setJoinedMatchIds(prev => new Set(prev).add(matchId));
                setMatches(prevMatches => prevMatches.map(m =>
                    m.id === matchId ? { ...m, filled_slots: m.filled_slots + 1 } : m
                ));`;

const newJoin = `            if (status === 'OK' || status === 'confirmed') {
                // Success: Update local state optimistically
                setJoinedMatchIds(prev => new Set(prev).add(matchId));
                // NOTE: filled_slots is updated via realtime subscription to avoid double counting`;

content = content.replace(oldJoin, newJoin);

// Fix 2: Remove optimistic update in handleLeaveMatch
const oldLeave = `            if (status === 'OK') {
                // Success: Update local state optimistically
                setJoinedMatchIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(matchId);
                    return newSet;
                });
                setMatches(prevMatches => prevMatches.map(m =>
                    m.id === matchId ? { ...m, filled_slots: Math.max(0, m.filled_slots - 1) } : m
                ));`;

const newLeave = `            if (status === 'OK') {
                // Success: Update local state optimistically
                setJoinedMatchIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(matchId);
                    return newSet;
                });
                // NOTE: filled_slots is updated via realtime subscription to avoid double counting`;

content = content.replace(oldLeave, newLeave);

writeFileSync('App.tsx', content, 'utf8');

console.log("✅ Fixed duplicate counter updates!");
