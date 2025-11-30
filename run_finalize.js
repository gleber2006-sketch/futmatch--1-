import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Tenta ler as variáveis do .env.local manualmente
let supabaseUrl, supabaseKey;

try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = envFile.match(/VITE_SUPABASE_URL="?([^"\n]+)"?/);
    const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

    if (urlMatch) supabaseUrl = urlMatch[1];
    if (keyMatch) supabaseKey = keyMatch[1];
} catch (e) {
    console.error("Erro ao ler .env.local:", e.message);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Variáveis de ambiente não encontradas.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Tentando finalizar partidas expiradas...");

    // Tenta chamar a função RPC
    const { data, error } = await supabase.rpc('finalize_expired_matches');

    if (error) {
        console.error("Erro ao chamar a função RPC:", error.message);
        console.log("\nDICA: Você rodou o script 'migration_finalize_matches.sql' no Supabase SQL Editor?");
        console.log("Se não, a função 'finalize_expired_matches' ainda não existe.");
    } else {
        console.log("Sucesso! Partidas finalizadas:", data);
    }
}

run();
