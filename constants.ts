export const SPORTS_LIST = ['Futebol', 'Futsal', 'Society', 'Vôlei', 'Basquete', 'Handebol', 'Tênis', 'Beach Tennis', 'Futevôlei'];

export const SPORT_POSITIONS: Record<string, string[]> = {
  'Futebol': ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'],
  'Futsal': ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
  'Society': ['Goleiro', 'Zagueiro', 'Meia', 'Atacante'],
  'Vôlei': ['Levantador', 'Ponteiro', 'Oposto', 'Central', 'Líbero'],
  'Basquete': ['Armador', 'Ala-Armador', 'Ala', 'Ala-Pivô', 'Pivô'],
  'Handebol': ['Goleiro', 'Ponta', 'Meia', 'Central', 'Pivô'],
  'Tênis': ['Destro', 'Canhoto'],
  'Beach Tennis': ['Direita', 'Esquerda'],
  'Futevôlei': ['Fundo', 'Rede']
};
export const SPORT_EMOJIS: Record<string, string> = {
  'Futebol': '⚽',
  'Futsal': '🥅',
  'Society': '🏟️',
  'Vôlei': '🏐',
  'Basquete': '🏀',
  'Handebol': '🤾',
  'Tênis': '🎾',
  'Beach Tennis': '🏖️',
  'Futevôlei': '🦶',
};

export const AVAILABLE_ROLES = [
  'Goleiro',
  'Juiz / Árbitro',
  'Montador / Marcador de Quadra',
  'Churrasqueiro',
  'Fotógrafo / Videomaker',
  'Organizador'
];

export const CITY_LIST = [
  'Sorocaba', 'Votorantim', 'Itu', 'Salto', 'Porto Feliz', 'Boituva', 'São Paulo', 'Campinas'
];

export const BRAZILIAN_TEAMS = [
  { name: 'Corinthians', logo: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png' },
  { name: 'Palmeiras', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg' },
  { name: 'São Paulo', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg' },
  { name: 'Santos', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Santos_Logo.png' },
  { name: 'Flamengo', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg' },
  { name: 'Vasco', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/ac/CRVascodaGama.png' },
  { name: 'Fluminense', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/a3/FFC_simb.svg' },
  { name: 'Botafogo', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Botafogo_de_Futebol_e_Regatas_logo.svg' },
  { name: 'Grêmio', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Gremio_Logo.svg' },
  { name: 'Internacional', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Internacional_logo.svg' },
  { name: 'Atlético-MG', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Clube_Atl%C3%A9tico_Mineiro_logo.svg' },
  { name: 'Cruzeiro', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Cruzeiro_Esporte_Clube_%28logo%29.svg' },
  { name: 'Bahia', logo: 'https://upload.wikimedia.org/wikipedia/pt/2/2c/Esporte_Clube_Bahia_logo.png' },
  { name: 'Vitória', logo: 'https://upload.wikimedia.org/wikipedia/pt/8/80/Esporte_Clube_Vitoria_logo.png' }
];
