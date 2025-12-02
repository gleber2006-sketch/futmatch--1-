
import os

file_path = 'App.tsx'

search_block = """            .subscribe();

        return () => {
            subscription.unsubscribe();
            matchesSubscription.unsubscribe();
        };"""

replace_block = """            .subscribe();

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
        };"""

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if search_block in content:
    new_content = content.replace(search_block, replace_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully patched App.tsx")
else:
    print("Could not find the block to replace")
    # Debug: print context around where it should be
    start_idx = content.find("matchesSubscription.unsubscribe();")
    if start_idx != -1:
        print("Found matchesSubscription.unsubscribe(); at index", start_idx)
        print("Context around it:")
        print(content[start_idx-100:start_idx+100])
    else:
        print("Could not find matchesSubscription.unsubscribe();")
