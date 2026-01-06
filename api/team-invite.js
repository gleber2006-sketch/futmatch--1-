import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Pegar o código do convite da query string
    const { code } = req.query;

    // Se não houver código, redireciona para a home
    if (!code) {
        return res.redirect('/');
    }

    // Configuração do Supabase (Vercel injeta as variáveis de ambiente VITE_...)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables in function');
        return res.redirect(`/?invite_team=${code}`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Buscar o time pelo código de convite
        const { data: team, error } = await supabase
            .from('teams')
            .select('name, logo_url')
            .eq('invite_code', code)
            .single();

        // Se houver erro ou não achar o time, redireciona para a home com o parâmetro
        if (error || !team) {
            console.warn('Team not found for code:', code);
            return res.redirect(`/?invite_team=${code}`);
        }

        const title = `🛡️ Entre no time ${team.name}!`;
        const description = `Você foi convidado para o elenco do ${team.name}. Clique para entrar no time pelo FutMatch! ⚽`;
        const image = team.logo_url || 'https://futmatch.vercel.app/logo.jpg';
        const appUrl = `https://futmatch.vercel.app/?invite_team=${code}`;

        // Retornamos um HTML com as meta tags para o WhatsApp ler
        // E um script para redirecionar o usuário real
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        
        <!-- Open Graph / WhatsApp -->
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="FutMatch">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        <meta property="og:url" content="${appUrl}">

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${image}">

        <style>
          body { 
            background: #0f172a; 
            color: white; 
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .loader {
            border: 4px solid #1e293b;
            border-top: 4px solid #10b981;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          p { color: #94a3b8; }
          .logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 2px solid #10b981; }
        </style>

        <script>
          // Redirecionamento imediato para o app
          window.location.href = "${appUrl}";
        </script>
      </head>
      <body>
        <div>
          <div class="loader"></div>
          ${team.logo_url ? `<img src="${team.logo_url}" class="logo" alt="Logo">` : ''}
          <h1>Conectando ao ${team.name}...</h1>
          <p>Você será redirecionado em um instante.</p>
        </div>
      </body>
      </html>
    `);

    } catch (err) {
        console.error('Error in team-invite handler:', err);
        return res.redirect(`/?invite_team=${code}`);
    }
}
