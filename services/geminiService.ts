
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { GroundingSource, VenueLocation, DraftMatchData } from '../types';
import { SPORTS_LIST } from '../constants';
import { supabase } from './supabaseClient';

let genAI: GoogleGenerativeAI | null = null;

export const initGemini = (key: string) => {
  genAI = new GoogleGenerativeAI(key);
};

// Helper to get the AI instance or throw if not initialized
const getAI = () => {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
    } else {
      throw new Error("Gemini API not initialized. Call initGemini() first or ensure VITE_GEMINI_API_KEY is set.");
    }
  }
  return genAI;
};

// --- TOOL DEFINITIONS ---

// 1. Rascunhar Partida (Action)
const draftMatchTool: FunctionDeclaration = {
  name: 'draftMatch',
  description: 'Prepara/Rascunha os dados para criar uma nova partida no formulário, quando o usuário expressa intenção de criar ou marcar um jogo.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING, description: 'O nome da partida (ex: "Futebol de Quinta").' },
      sport: { type: SchemaType.STRING, description: `A modalidade. Deve ser uma das: ${SPORTS_LIST.join(', ')}.` },
      location: { type: SchemaType.STRING, description: 'O local ou endereço.' },
      date: { type: SchemaType.STRING, description: 'A data YYYY-MM-DD.' },
      time: { type: SchemaType.STRING, description: 'O horário HH:MM.' },
      slots: { type: SchemaType.NUMBER, description: 'Número de vagas.' },
      rules: { type: SchemaType.STRING, description: 'Regras ou observações.' }
    },
    required: ['sport'],
  },
};

// 2. Buscar Partidas (Retrieval)
const searchMatchesTool: FunctionDeclaration = {
  name: 'searchMatches',
  description: 'Busca partidas (jogos) JÁ CRIADAS e disponíveis no app FutMatch. Use quando o usuário perguntar "tem jogo hoje?", "onde tem vôlei?", "quais partidas estão rolando?".',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      sport: { type: SchemaType.STRING, description: 'Filtrar por modalidade (ex: Futebol, Vôlei)' },
      date: { type: SchemaType.STRING, description: 'Filtrar por data específica (YYYY-MM-DD)' },
      status: { type: SchemaType.STRING, description: 'Filtrar por status (Convocando, Confirmado)' }
    }
  }
};

// 3. Buscar Arenas (Retrieval)
const searchArenasTool: FunctionDeclaration = {
  name: 'searchArenas',
  description: 'Busca quadras, campos e arenas cadastradas na plataforma. Use quando o usuário perguntar "quantas quadras tem?", "onde posso jogar?", "tem quadra de beach tennis?".',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      city: { type: SchemaType.STRING, description: 'Filtrar por cidade' },
      sport: { type: SchemaType.STRING, description: 'Filtrar por esporte que a arena suporta' },
      name: { type: SchemaType.STRING, description: 'Nome da arena' }
    }
  }
};

// --- HELPER FUNCTIONS (DATABASE QUERIES) ---

async function executeSearchMatches(args: any) {
  try {
    let query = supabase.from('matches').select('*').neq('status', 'Cancelado');

    if (args.sport) query = query.ilike('sport', `%${args.sport}%`);
    if (args.date) query = query.eq('date', args.date); // Note: DB stores timestamp, simple date match might miss. Ideally range.
    // For simplicity in this demo, we'll fetch recent matches if no date, or try precise match
    if (args.status) query = query.eq('status', args.status);

    const { data, error } = await query.order('date', { ascending: true }).limit(5);

    if (error) return `Erro ao buscar partidas: ${error.message}`;
    if (!data || data.length === 0) return "Nenhuma partida encontrada com esses critérios.";

    return JSON.stringify(data.map(m => ({
      id: m.id,
      name: m.name,
      sport: m.sport,
      date: new Date(m.date).toLocaleString('pt-BR'),
      location: m.location,
      slots: `${m.filled_slots}/${m.slots}`,
      status: m.status
    })));
  } catch (e) {
    return "Erro ao executar busca no banco.";
  }
}

async function executeSearchArenas(args: any) {
  try {
    let query = supabase.from('arenas').select('name, city, neighborhood, sports, price_info, is_partner');

    if (args.city) query = query.ilike('city', `%${args.city}%`);
    if (args.name) query = query.ilike('name', `%${args.name}%`);
    if (args.sport) query = query.contains('sports', [args.sport]); // Assuming sports is array

    const { data, error } = await query.limit(5);

    if (error) return `Erro ao buscar arenas: ${error.message}`;
    if (!data || data.length === 0) return "Nenhuma arena encontrada com esses critérios.";

    return JSON.stringify(data);
  } catch (e) {
    return "Erro ao executar busca no banco.";
  }
}


// --- MAIN BOT FUNCTION ---

export const getBotResponse = async (
  message: string,
  location: { latitude: number; longitude: number } | null
): Promise<{ text: string, sources: GroundingSource[], draftData?: DraftMatchData }> => {
  try {
    const prompt = `
      Você é o "FutMatchBot", assistente oficial do app FutMatch.
      
      CONTEXTO:
      - Hoje: ${new Date().toISOString().split('T')[0]}
      - Localização User: ${location ? `${location.latitude}, ${location.longitude}` : 'Desconhecida'}
      - Modalidades: ${SPORTS_LIST.join(', ')}.
      
      CAPACIDADES:
      1. Você PODE buscar dados reais do app (partidas, arenas) usando as tools 'searchMatches' e 'searchArenas'.
      2. Você PODE ajudar a criar partidas usando 'draftMatch'.
      3. Você PODE buscar info externa no Google Maps.

      INSTRUÇÕES:
      - Se o usuário perguntar sobre jogos existentes ("Tem vôlei hoje?", "Quais jogos estão rolando?"), CHAME 'searchMatches'.
      - Se perguntar sobre locais ("Onde tem quadra?", "Quantas arenas tem?"), CHAME 'searchArenas'.
      - Se quiser marcar jogo ("Quero criar...", "Marcar futsal"), CHAME 'draftMatch'.
      - Se for conversa fiada, responda amigavelmente com emojis.
      
      IMPORTANTE:
      - Se você chamar uma ferramenta de busca (searchMatches/searchArenas), use o retorno JSON dela para formular sua resposta final ao usuário. Diga quantos resultados achou e cite exemplos.
      - Não invente dados. Se a busca retornar vazio, diga que não encontrou no app.
      
      Usuário: "${message}"
    `;

    // 1. Primeira chamada ao modelo (Decision Making)
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [
        { googleMaps: {} } as any,
        { functionDeclarations: [draftMatchTool, searchMatchesTool, searchArenasTool] }
      ],
      toolConfig: location ? {
        // @ts-ignore
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        }
      } : undefined,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const response = result.response;
    let text = response.text() || "";
    let draftData: DraftMatchData | undefined;

    const functionCalls = response.functionCalls();

    // 2. Processar Chamadas de Função
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        // A. Ação de Rascunho (Retorna controle ao App UI)
        if (call.name === 'draftMatch') {
          draftData = call.args as DraftMatchData;
          text = "Beleza! Abri o formulário com os dados que você pediu. É só confirmar!";
        }
        // B. Ação de Busca (Precisa de resposta do banco para gerar texto final)
        else if (call.name === 'searchMatches') {
          const dbResult = await executeSearchMatches(call.args);
          // Chamada recursiva ou segundo prompt com o contexto
          // Para simplificar, faremos uma segunda chamada rápida para interpretar o JSON
          const followUpPrompt = `
                    O usuário perguntou: "${message}".
                    A ferramenta 'searchMatches' retornou estes dados do banco:
                    ${dbResult}
                    
                    Responda ao usuário de forma natural resumindo essas informações.
                `;
          const followUpResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: followUpPrompt }] }]
          });
          text = followUpResult.response.text() || "Encontrei algumas partidas!";
        }
        else if (call.name === 'searchArenas') {
          const dbResult = await executeSearchArenas(call.args);
          const followUpPrompt = `
                    O usuário perguntou: "${message}".
                    A ferramenta 'searchArenas' retornou estes dados do banco:
                    ${dbResult}
                    
                    Responda ao usuário de forma natural resumindo essas informações.
                `;
          const followUpResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: followUpPrompt }] }]
          });
          text = followUpResult.response.text() || "Encontrei algumas arenas!";
        }
      }
    }

    // Processar fontes do Google Maps se houver
    const candidates = response.candidates;
    const groundingChunks = (candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .map((chunk: any) => ({
        uri: chunk.maps?.uri || '',
        title: chunk.maps?.title || 'Google Maps'
      }))
      .filter((source: GroundingSource) => source.uri);

    return {
      text: text,
      sources,
      draftData
    };

  } catch (error) {
    console.error("Error fetching bot response:", (error as Error)?.message ?? error);
    return { text: "😥 Tive um problema técnico e não consegui consultar os dados agora.", sources: [] };
  }
};

// --- IMAGE GENERATION HELPERS (Keep existing) ---

export const generateAvatar = async (name: string): Promise<string | null> => {
  try {
    // Note: Imagen model usage might differ in the official SDK. 
    // Assuming 'imagen-3.0-generate-001' or similar is available via specific model methods or REST.
    // For now, we will comment out this part as the standard SDK usually handles text-to-text or multimodal.
    // If using a specific Imagen integration, it would look different.
    // We will return null to avoid runtime errors until Imagen is properly set up with the SDK.
    console.warn("Imagen generation not fully implemented in this SDK version.");
    return null;
  } catch (error) {
    console.error("Error generating avatar:", (error as Error)?.message ?? error);
    return null;
  }
};

export const generateSportsBackground = async (): Promise<string | null> => {
  try {
    // Same as above, disabling Imagen for now.
    console.warn("Imagen generation not fully implemented in this SDK version.");
    return null;
  } catch (error) {
    console.error("Error generating sports background:", (error as Error)?.message ?? error);
    return null;
  }
};

export const searchLocalVenues = async (
  query: string,
  location: { latitude: number; longitude: number }
): Promise<VenueLocation[]> => {
  try {
    const prompt = `Encontre até 3 locais esportivos (como quadras, ginásios ou campos) que melhor correspondam à busca por "${query}", perto da latitude ${location.latitude} e longitude ${location.longitude}.
    
    Retorne um ARRAY JSON contendo as sugestões encontradas. Cada objeto do array deve ter:
    - "name": O nome oficial do local.
    - "address": O endereço completo.
    - "lat": A latitude (number).
    - "lng": A longitude (number).
    - "uri": O link do Google Maps para o local (se disponível pela ferramenta).

    Se nenhum local for encontrado, retorne um array vazio [].
    Não inclua markdown (\`\`\`json). Apenas o JSON puro.`;

    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} } as any], // Cast to any if googleSearch is not in types yet, or use googleMaps if intended
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // tools config if needed
    });

    const response = result.response;

    const text = response.text().trim();
    const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    if (!cleanText) {
      return [];
    }

    try {
      const result = JSON.parse(cleanText);

      if (Array.isArray(result)) {
        const candidates = response.candidates;
        const groundingChunks = (candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
        const genericUri = groundingChunks.find((chunk: any) => chunk.maps?.uri)?.maps?.uri;

        return result.map((item: any) => ({
          name: item.name,
          address: item.address,
          lat: item.lat,
          lng: item.lng,
          uri: item.uri || genericUri
        })) as VenueLocation[];
      } else if (result && typeof result === 'object' && result.name) {
        return [{
          name: result.name,
          address: result.address,
          lat: result.lat,
          lng: result.lng,
          uri: result.uri
        }] as VenueLocation[];
      }

      return [];
    } catch (parseError) {
      return [];
    }

  } catch (apiError) {
    console.error("Error searching for local venues with Gemini:", (apiError as Error)?.message ?? apiError);
    return [];
  }
};

export const findVenueImage = async (venueName: string, city: string): Promise<string | null> => {
  try {
    const prompt = `Encontre uma URL de imagem pública e válida para o local esportivo "${venueName}" na cidade de "${city}".
    Use a Busca do Google para encontrar uma foto representativa do local (fachada, quadra, campo, interior).
    Retorne APENAS a string da URL da imagem. 
    Se encontrar uma imagem no Google Maps ou um site oficial, use essa URL.
    Não coloque markdown. Retorne apenas o link puro.
    Se não encontrar nada, retorne "null".`;

    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} } as any],
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.response;

    const text = response.text().trim();
    if (!text || text.toLowerCase().includes('null') || !text.startsWith('http')) {
      return null;
    }
    return text.split(' ')[0];
  } catch (error) {
    return null;
  }
};
