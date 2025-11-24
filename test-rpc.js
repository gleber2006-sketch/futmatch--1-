
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://healydbigtttfbrorbwy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYWx5ZGJpZ3R0dGZicm9yYnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjI2MTcsImV4cCI6MjA3Njk5ODYxN30.TVkB7mlMeuPldljh2uHkJQ2RVrrO2eT_pzDfH2NC_GU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRPCs() {
    console.log("Testando RPCs...");

    // Teste 1: Verificar se cancel_match existe
    try {
        console.log("Chamando cancel_match com ID inválido...");
        const { data, error } = await supabase.rpc('cancel_match', {
            p_match_id: -1,
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_reason: 'Teste de script'
        });

        if (error) {
            console.error("Erro no cancel_match:", error);
        } else {
            console.log("cancel_match respondeu (provavelmente não encontrou a partida, mas a função existe). Data:", data);
        }
    } catch (e) {
        console.error("Exceção no cancel_match:", e);
    }

    // Teste 2: Verificar se add_tokens existe
    try {
        console.log("Chamando add_tokens com ID inválido...");
        const { data, error } = await supabase.rpc('add_tokens', {
            p_user_id: '00000000-0000-0000-0000-000000000000',
            amount: 1
        });

        if (error) {
            console.error("Erro no add_tokens:", error);
        } else {
            console.log("add_tokens respondeu. Data:", data);
        }
    } catch (e) {
        console.error("Exceção no add_tokens:", e);
    }
}

testRPCs();
