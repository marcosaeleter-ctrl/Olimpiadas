export const MODALIDADES_PADRAO = [
  {
    nome: "Tênis",
    categoria: "Esporte",
    jogadoresPorTime: 3,
    formato: "grupos_com_final",
    configuracao: { pontosPorJogo: 5 },
    tabelaPontos: { 1: 5, 2: 3, 3: 2, 4: 1 }
  },
  {
    nome: "Futebol",
    categoria: "Esporte",
    jogadoresPorTime: null,
    formato: "grupos_com_final",
    configuracao: { tempoJogo: 10 },
    tabelaPontos: { 1: 5, 2: 3, 3: 2, 4: 1 }
  },
  {
    nome: "Tênis de Mesa",
    categoria: "Esporte",
    jogadoresPorTime: 2,
    formato: "bracket_individual",
    configuracao: {},
    tabelaPontos: { 1: 5, 2: 3, 3: 2, 4: 1 }
  },
  {
    nome: "Sinuca",
    categoria: "Jogo de Mesa",
    jogadoresPorTime: 2,
    formato: "bracket_individual",
    configuracao: {},
    tabelaPontos: { 1: 5, 2: 3, 3: 2, 4: 1 }
  },
  {
    nome: "Basquete 3x3",
    categoria: "Esporte",
    jogadoresPorTime: 3,
    formato: "mata_mata_com_terceiro",
    configuracao: { pontosPorJogo: 10 },
    tabelaPontos: { 1: 5, 2: 3, 3: 2, 4: 1 }
  },
  {
    nome: "Xadrez",
    categoria: "Jogo de Mesa",
    jogadoresPorTime: 1,
    formato: "mata_mata_com_terceiro_individual",
    configuracao: { semPlacar: true },
    tabelaPontos: { 1: 5, 2: 3, 3: 2, 4: 1 }
  }
]
