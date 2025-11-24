
export const SPORTS_LIST = [
  "Futebol de Campo",
  "Futebol Society",
  "Futsal",
  "Vôlei de Quadra",
  "Vôlei de Praia / Areia",
  "Futevôlei",
  "Basquete",
  "Beach Tennis",
  "Tênis",
  "Corrida",
  "Futebol Americano",
  "Rugby",
  "Tênis de Mesa",
  "Handebol",
  "Grupos de Atividade Física Geral",
  "Caminhada / Trilhas",
  "Bike (Ciclismo)",
  "Outros…"
];

export const SPORT_EMOJIS: { [key: string]: string } = {
  "Futebol": "⚽",
  "Futebol de Campo": "⚽",
  "Futebol Society": "⚽",
  "Futsal": "🥅",
  "Vôlei": "🏐",
  "Vôlei de Quadra": "🏐",
  "Vôlei de Praia / Areia": "🏖️",
  "Futevôlei": "🏐",
  "Futvolei": "🏐",
  "Basquete": "🏀",
  "Beach Tennis": "🎾",
  "Beachtenis": "🎾",
  "Tênis": "🎾",
  "Tenis": "🎾",
  "Corrida": "🏃",
  "Futebol Americano": "🏈",
  "Rugby": "🏉",
  "Tênis de Mesa": "🏓",
  "Handebol": "🤾",
  "Grupos de Atividade Física Geral": "💪",
  "Caminhada / Trilhas": "🥾",
  "Bike (Ciclismo)": "🚴",
  "Outros…": "🏅",
  "Outros...": "🏅"
};

export const SPORT_POSITIONS: { [key: string]: string[] } = {
    'Futebol': ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-campo', 'Atacante'],
    'Futebol de Campo': ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meio-campo', 'Atacante'],
    'Futebol Society': ['Goleiro', 'Zagueiro', 'Meio-campo', 'Atacante'],
    'Futsal': ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
    'Vôlei': ['Levantador', 'Ponteiro', 'Central', 'Oposto', 'Líbero'],
    'Vôlei de Quadra': ['Levantador', 'Ponteiro', 'Central', 'Oposto', 'Líbero'],
    'Vôlei de Praia / Areia': ['Jogador'],
    'Futevôlei': ['Sacador', 'Receptor', 'Atacante', 'Defensor'],
    'Futvolei': ['Sacador', 'Receptor', 'Atacante', 'Defensor'],
    'Basquete': ['Armador', 'Ala-armador', 'Ala', 'Ala-pivô', 'Pivô'],
    'Beach Tennis': ['Jogador'],
    'Beachtenis': ['Jogador'],
    'Tênis': ['Jogador'],
    'Tenis': ['Jogador'],
    'Corrida': ['Corredor'],
    'Futebol Americano': ['Quarterback', 'Receiver', 'Running Back', 'Lineman', 'Linebacker', 'Kicker'],
    'Rugby': ['Forward', 'Back'],
    'Tênis de Mesa': ['Mesatenista'],
    'Handebol': ['Goleiro', 'Armador', 'Ponta', 'Pivô'],
    'Grupos de Atividade Física Geral': ['Participante', 'Instrutor'],
    'Caminhada / Trilhas': ['Caminhante', 'Guia'],
    'Bike (Ciclismo)': ['Ciclista'],
    'Outros…': ['Jogador'],
    'Outros...': ['Jogador']
};

export const BRAZILIAN_TEAMS = [
    { name: 'Corinthians', logo: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png' },
    { name: 'Palmeiras', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg' },
    { name: 'São Paulo', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg' },
    { name: 'Santos', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Santos_Logo.png' },
    { name: 'Flamengo', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg' },
    { name: 'Vasco da Gama', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/ac/CRVascodaGama.png' },
    { name: 'Fluminense', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/a3/FFC_escudo.svg' },
    { name: 'Botafogo', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Botafogo_de_Futebol_e_Regatas_logo.svg' },
    { name: 'Grêmio', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Gremio_FBPA.svg' },
    { name: 'Internacional', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg' },
    { name: 'Atlético Mineiro', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Clube_Atl%C3%A9tico_Mineiro_logo.svg' },
    { name: 'Cruzeiro', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Cruzeiro_Esporte_Clube_%28Logo%29.svg' },
    { name: 'Bahia', logo: 'https://upload.wikimedia.org/wikipedia/pt/2/2c/Esporte_Clube_Bahia_logo.png' },
    { name: 'Vitória', logo: 'https://upload.wikimedia.org/wikipedia/pt/8/80/Esporte_Clube_Vit%C3%B3ria_logo.png' },
    { name: 'Athletico Paranaense', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Logo_Club_Athletico_Paranaense_2019.png' },
    { name: 'Coritiba', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Coritiba_FBC_%282024%29.png' },
    { name: 'Fortaleza', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Fortaleza_Esporte_Clube_logo.svg' },
    { name: 'Ceará', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Cear%C3%A1_Sporting_Club_logo.svg' },
    { name: 'Sport Recife', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/17/Sport_Club_do_Recife.png' },
    { name: 'São Bento', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Esporte_Clube_S%C3%A3o_Bento.png' }
];

export const CITY_LIST = [
    'São Paulo', 'Sorocaba', 'Itu', 'Salto', 'Salto de Pirapora', 'Votorantim',
    'Campinas', 'Jundiaí', 'Piedade', 'São Roque', 'Mairinque', 'Alumínio',
    'Araçoiaba da Serra', 'Iperó', 'Porto Feliz'
];
