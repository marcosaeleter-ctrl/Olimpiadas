import { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { gerarPartidas, gerarProximaFase, calcularColocacoes, getFasesPosteriores } from '../utils/partidas'

const STORAGE_KEY = 'olimpiadas_v1'

const initialState = {
  evento: { nome: '', status: 'configuracao' },
  participantes: [],
  times: [],
  modalidades: [],
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : initialState
  } catch {
    return initialState
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_EVENTO_NOME':
      return { ...state, evento: { ...state.evento, nome: action.payload } }

    case 'SET_STATUS':
      return { ...state, evento: { ...state.evento, status: action.payload } }

    case 'ADD_PARTICIPANTE': {
      const nomes = action.payload
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(Boolean)
      const novos = nomes.map(nome => ({ id: uuidv4(), nome }))
      return { ...state, participantes: [...state.participantes, ...novos] }
    }

    case 'REMOVE_PARTICIPANTE':
      return {
        ...state,
        participantes: state.participantes.filter(p => p.id !== action.payload),
        times: state.times.map(t => ({
          ...t,
          participantes: t.participantes.filter(id => id !== action.payload),
        })),
      }

    case 'SET_TIMES':
      return { ...state, times: action.payload }

    case 'ADD_TIME':
      return { ...state, times: [...state.times, action.payload] }

    case 'REMOVE_TIME':
      return { ...state, times: state.times.filter(t => t.id !== action.payload) }

    case 'UPDATE_TIME':
      return {
        ...state,
        times: state.times.map(t => (t.id === action.payload.id ? { ...t, ...action.payload } : t)),
      }

    case 'SORTEAR_TIMES': {
      const ids = [...state.participantes.map(p => p.id)]
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]]
      }
      const numTimes = state.times.length
      const times = state.times.map((t, i) => ({
        ...t,
        participantes: ids.filter((_, idx) => idx % numTimes === i),
      }))
      return { ...state, times }
    }

    case 'MOVER_PARTICIPANTE': {
      const { participanteId, deTimeId, paraTimeId } = action.payload
      return {
        ...state,
        times: state.times.map(t => {
          if (deTimeId && t.id === deTimeId) return { ...t, participantes: t.participantes.filter(id => id !== participanteId) }
          if (paraTimeId && t.id === paraTimeId) return { ...t, participantes: [...t.participantes, participanteId] }
          return t
        }),
      }
    }

    case 'ADD_MODALIDADE': {
      const ordem = state.modalidades.length + 1
      return {
        ...state,
        modalidades: [...state.modalidades, {
          ...action.payload,
          id: uuidv4(),
          ordem,
          status: 'pendente',
          escalacao: {},
          resultado: null,
          partidas: [],
          formato: action.payload.formato || null,
          configuracao: action.payload.configuracao || {},
          tabelaPontos: action.payload.tabelaPontos || { 1: 5, 2: 3, 3: 2, 4: 1 },
        }],
      }
    }

    case 'REMOVE_MODALIDADE':
      return {
        ...state,
        modalidades: state.modalidades
          .filter(m => m.id !== action.payload)
          .map((m, i) => ({ ...m, ordem: i + 1 })),
      }

    case 'UPDATE_MODALIDADE':
      return {
        ...state,
        modalidades: state.modalidades.map(m => (m.id === action.payload.id ? { ...m, ...action.payload } : m)),
      }

    case 'REORDER_MODALIDADES': {
      const reordered = action.payload.map((m, i) => ({ ...m, ordem: i + 1 }))
      return { ...state, modalidades: reordered }
    }

    case 'SET_ESCALACAO': {
      const { modalidadeId, timeId, jogadores } = action.payload
      return {
        ...state,
        modalidades: state.modalidades.map(m =>
          m.id === modalidadeId
            ? { ...m, escalacao: { ...m.escalacao, [timeId]: jogadores } }
            : m,
        ),
      }
    }

    case 'REGISTRAR_RESULTADO': {
      const { modalidadeId, resultado } = action.payload
      return {
        ...state,
        modalidades: state.modalidades.map(m =>
          m.id === modalidadeId ? { ...m, resultado, status: 'concluida' } : m,
        ),
      }
    }

    case 'DESFAZER_RESULTADO':
      return {
        ...state,
        modalidades: state.modalidades.map(m =>
          m.id === action.payload ? { ...m, resultado: null, status: 'pendente', partidas: [] } : m,
        ),
      }

    case 'INICIAR_MODALIDADE': {
      const { modalidadeId } = action.payload
      const modalidade = state.modalidades.find(m => m.id === modalidadeId)
      if (!modalidade || modalidade.status !== 'pendente') return state
      const partidas = gerarPartidas(modalidade, state.times)
      return {
        ...state,
        modalidades: state.modalidades.map(m =>
          m.id === modalidadeId ? { ...m, status: 'em_andamento', partidas } : m
        ),
      }
    }

    case 'REGISTRAR_PARTIDA': {
      const { modalidadeId, partidaId, placar } = action.payload
      const modalidade = state.modalidades.find(m => m.id === modalidadeId)
      if (!modalidade) return state

      const partida = (modalidade.partidas || []).find(p => p.id === partidaId)
      if (!partida) return state

      let vencedor = null
      if (placar.vencedor) {
        vencedor = placar.vencedor
      } else if (placar.a !== null && placar.b !== null) {
        if (placar.a > placar.b) vencedor = partida.participanteA.timeId
        else if (placar.b > placar.a) vencedor = partida.participanteB.timeId
      }

      const novasPartidas = (modalidade.partidas || []).map(p =>
        p.id === partidaId
          ? { ...p, placar: { a: placar.a ?? null, b: placar.b ?? null }, vencedor, status: 'concluida' }
          : p
      )

      const faseAtual = partida.fase
      const todasDaFase = novasPartidas.filter(p => p.fase === faseAtual).every(p => p.status === 'concluida')

      let partidasFinais = novasPartidas
      let novoResultado = null
      let novoStatus = 'em_andamento'

      if (todasDaFase) {
        const proximas = gerarProximaFase({ ...modalidade }, novasPartidas, state.times)
        if (proximas && proximas.length > 0) {
          partidasFinais = [...novasPartidas, ...proximas]
        } else if (novasPartidas.every(p => p.status === 'concluida')) {
          const colocacoes = calcularColocacoes(modalidade, novasPartidas, state.times)
          if (colocacoes) {
            const tab = modalidade.tabelaPontos || { 1: 5, 2: 3, 3: 2, 4: 1 }
            novoResultado = colocacoes.map(c => ({ ...c, pontos: tab[c.posicao] || 0 }))
            novoStatus = 'concluida'
          }
        }
      }

      return {
        ...state,
        modalidades: state.modalidades.map(m =>
          m.id === modalidadeId
            ? { ...m, status: novoStatus, partidas: partidasFinais, ...(novoResultado ? { resultado: novoResultado } : {}) }
            : m
        ),
      }
    }

    case 'DESFAZER_PARTIDA': {
      const { modalidadeId, partidaId } = action.payload
      return {
        ...state,
        modalidades: state.modalidades.map(m => {
          if (m.id !== modalidadeId) return m
          const partidas = m.partidas || []
          const partida = partidas.find(p => p.id === partidaId)
          if (!partida) return m

          const fasesPosteriores = getFasesPosteriores(partida.fase, m.formato)
          const novasPartidas = partidas
            .filter(p => !fasesPosteriores.includes(p.fase))
            .map(p => p.id === partidaId
              ? { ...p, placar: { a: null, b: null }, vencedor: null, status: 'pendente' }
              : p
            )

          return { ...m, status: 'em_andamento', resultado: null, partidas: novasPartidas }
        }),
      }
    }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadFromStorage)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}

export function calcularPontos(modalidade, resultado) {
  if (!resultado) return []

  // Usa tabelaPontos se disponível, senão mantém sistema legado
  const tab = modalidade.tabelaPontos
  const base = tab
    ? { 1: tab[1] || 0, 2: tab[2] || 0, 3: tab[3] || 0, 4: tab[4] || 0 }
    : modalidade.especial ? { 1: 6, 2: 4, 3: 2 } : { 1: 3, 2: 2, 3: 1 }

  if (modalidade.tipo === 'duelo') {
    return resultado.map(r => ({
      ...r,
      pontos: r.posicao === 1 ? (base[1] ?? 0) : 0,
    }))
  }

  const grupos = {}
  resultado.forEach(r => {
    if (!grupos[r.posicao]) grupos[r.posicao] = []
    grupos[r.posicao].push(r.timeId)
  })

  const pontuados = []
  Object.entries(grupos).forEach(([pos, times]) => {
    const p = parseInt(pos)
    if (times.length === 1) {
      pontuados.push({ posicao: p, timeId: times[0], pontos: base[p] || 0 })
    } else {
      let soma = 0
      for (let i = 0; i < times.length; i++) soma += base[p + i] || 0
      const media = parseFloat((soma / times.length).toFixed(1))
      times.forEach(tid => pontuados.push({ posicao: p, timeId: tid, pontos: media }))
    }
  })

  return pontuados
}

export function calcularPlacar(times, modalidades) {
  const placar = {}
  times.forEach(t => { placar[t.id] = 0 })
  modalidades
    .filter(m => m.status === 'concluida' && m.resultado)
    .forEach(m => {
      m.resultado.forEach(r => {
        if (placar[r.timeId] !== undefined) placar[r.timeId] += r.pontos
      })
    })
  return placar
}
