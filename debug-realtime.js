
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load env vars manually since we are not in Vite context
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

console.log(`Connecting to Supabase at ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Setting up Realtime subscription for "matches" table...');

let eventCounter = 0;

const channel = supabase
    .channel('debug_room')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
            eventCounter++;
            const timestamp = new Date().toISOString();
            const localTime = new Date().toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                hour12: false
            });

            console.log('\n========================================');
            console.log(`EVENT #${eventCounter}`);
            console.log(`Timestamp: ${timestamp}`);
            console.log(`Local Time: ${localTime}`);
            console.log(`Event Type: ${payload.eventType}`);
            console.log('========================================');

            if (payload.eventType === 'INSERT') {
                console.log('\n📝 NEW MATCH INSERTED:');
                console.log('  Match ID:', payload.new.id);
                console.log('  Location:', payload.new.location);
                console.log('  Date:', payload.new.date);
                console.log('  Is Boosted:', payload.new.is_boosted);
                console.log('  Boost Until:', payload.new.boost_until);
            }
            else if (payload.eventType === 'UPDATE') {
                console.log('\n🔄 MATCH UPDATED:');
                console.log('  Match ID:', payload.new.id);

                // Check what changed
                const changes = [];
                if (payload.old.is_boosted !== payload.new.is_boosted) {
                    changes.push(`is_boosted: ${payload.old.is_boosted} → ${payload.new.is_boosted}`);
                }
                if (payload.old.boost_until !== payload.new.boost_until) {
                    changes.push(`boost_until: ${payload.old.boost_until} → ${payload.new.boost_until}`);
                }
                if (payload.old.filled_slots !== payload.new.filled_slots) {
                    changes.push(`filled_slots: ${payload.old.filled_slots} → ${payload.new.filled_slots}`);
                }
                if (payload.old.status !== payload.new.status) {
                    changes.push(`status: ${payload.old.status} → ${payload.new.status}`);
                }

                if (changes.length > 0) {
                    console.log('\n  📊 CHANGES DETECTED:');
                    changes.forEach(change => console.log(`    - ${change}`));
                } else {
                    console.log('  ⚠️  No significant changes detected in tracked fields');
                }

                // Show boost-related fields
                console.log('\n  🚀 BOOST STATUS:');
                console.log('    Is Boosted:', payload.new.is_boosted);
                console.log('    Boost Until:', payload.new.boost_until);

                // Check if boost is active
                if (payload.new.is_boosted && payload.new.boost_until) {
                    const boostUntil = new Date(payload.new.boost_until);
                    const now = new Date();
                    const isActive = boostUntil > now;
                    console.log(`    Status: ${isActive ? '✅ ACTIVE' : '❌ EXPIRED'}`);
                    if (isActive) {
                        const minutesLeft = Math.floor((boostUntil - now) / 1000 / 60);
                        console.log(`    Time Left: ${minutesLeft} minutes`);
                    }
                }
            }
            else if (payload.eventType === 'DELETE') {
                console.log('\n🗑️  MATCH DELETED:');
                console.log('  Match ID:', payload.old.id);
            }

            // Show full payload for debugging
            console.log('\n📦 FULL PAYLOAD:');
            console.log(JSON.stringify(payload, null, 2));
            console.log('========================================\n');
        }
    )
    .subscribe((status) => {
        console.log(`\n🔌 Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to matches table');
            console.log('👂 Listening for real-time changes...');
            console.log('Press Ctrl+C to stop\n');
        } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error subscribing to channel');
        } else if (status === 'TIMED_OUT') {
            console.error('⏱️  Subscription timed out');
        } else if (status === 'CLOSED') {
            console.log('🔴 Channel closed');
        }
    });

// Keep process alive and show periodic status
let secondsRunning = 0;
setInterval(() => {
    secondsRunning++;
    if (secondsRunning % 60 === 0) {
        console.log(`⏰ Running for ${secondsRunning / 60} minute(s) | Events received: ${eventCounter}`);
    }
}, 1000);
