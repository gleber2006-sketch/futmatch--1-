import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('App.tsx', 'utf8');

console.log('Original file size:', content.length);

// Fix 1: Remove optimistic update in handleJoinMatch (handle CRLF)
const oldJoin1 = "setMatches(prevMatches => prevMatches.map(m =>\r\n                    m.id === matchId ? { ...m, filled_slots: m.filled_slots + 1 } : m\r\n                ));";
const newJoin1 = "// NOTE: filled_slots is updated via realtime subscription to avoid double counting";

if (content.includes(oldJoin1)) {
    content = content.replace(oldJoin1, newJoin1);
    console.log('✅ Fixed handleJoinMatch');
} else {
    console.log('❌ Could not find handleJoinMatch pattern');
}

// Fix 2: Remove optimistic update in handleLeaveMatch (handle CRLF)
const oldLeave1 = "setMatches(prevMatches => prevMatches.map(m =>\r\n                    m.id === matchId ? { ...m, filled_slots: Math.max(0, m.filled_slots - 1) } : m\r\n                ));";
const newLeave1 = "// NOTE: filled_slots is updated via realtime subscription to avoid double counting";

if (content.includes(oldLeave1)) {
    content = content.replace(oldLeave1, newLeave1);
    console.log('✅ Fixed handleLeaveMatch');
} else {
    console.log('❌ Could not find handleLeaveMatch pattern');
}

writeFileSync('App.tsx', content, 'utf8');

console.log('Final file size:', content.length);
console.log("✅ Done!");
