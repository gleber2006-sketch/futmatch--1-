
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');

const searchBlock = `            .subscribe();

        return () => {
            subscription.unsubscribe();
            matchesSubscription.unsubscribe();
        };`;

const replaceBlock = `            .subscribe();

        // Real-time subscription for participants to keep filled_slots in sync
        const participantsSubscription = supabase
            .channel('public:match_participants')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'match_participants' },
                (payload) => {
                    console.log('👥 Participant change:', payload.eventType);
                    
                    setMatches(prev => prev.map(match => {
                        // Handle INSERT (someone joined)
                        if (payload.eventType === 'INSERT' && payload.new.match_id === match.id) {
                            return { ...match, filled_slots: match.filled_slots + 1 };
                        }
                        // Handle DELETE (someone left/removed)
                        if (payload.eventType === 'DELETE' && payload.old.match_id === match.id) {
                            return { ...match, filled_slots: Math.max(0, match.filled_slots - 1) };
                        }
                        return match;
                    }));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            matchesSubscription.unsubscribe();
            participantsSubscription.unsubscribe();
        };`;

try {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(searchBlock)) {
        const newContent = content.replace(searchBlock, replaceBlock);
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log("Successfully patched App.tsx");
    } else {
        console.log("Could not find the block to replace");
        // Debug
        const idx = content.indexOf("matchesSubscription.unsubscribe();");
        if (idx !== -1) {
            console.log("Found matchesSubscription.unsubscribe(); at index", idx);
            console.log("Context:", content.substring(idx - 100, idx + 100));
        }
    }
} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
