import { v4 as uuidv4 } from 'uuid'

function novaPart(modalidadeId, fase, tipo, partA, partB) {
  return {
    id: uuidv4(),
    modalidadeId,
    fase,
    tipo,
    participanteA: partA,
    participanteB: partB,
    placar: { a: null, b: null },
    vencedor: null,
    status: 'pendente',
  }
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Calcula classificação de fase de grupos com base nas partidas concluídas
function calcularClassificacaoGrupos(partidas, times) {
  const stats = {}
  times.forEach(t => { stats[t.id] = { vitorias: 0, golsPro: 0, golsContra: 0 } })

  partidas.forEach(p => {
    if (p.status !== 'concluida' || p.placar.a === null) return
    const a = p.placar.a, b = p.placar.b
    stats[p.participanteA.timeId].golsPro += a
    stats[p.participanteA.timeId].golsContra += b
    stats[p.participanteB.timeId].golsPro += b
    stats[p.participanteB.timeId].golsContra += a
    if (a > b) stats[p.participanteA.timeId].vitorias++
    else if (b > a) stats[p.participanteB.timeId].vitorias++
    else {
      stats[p.participanteA.timeId].vitorias += 0.5
      stats[p.participanteB.timeId].vitorias += 0.5
    }
  })

  return [...times].sort((a, b) => {
    const sa = stats[a.id], sb = stats[b.id]
    if (sb.vitorias !== sa.vitorias) return sb.vitorias - sa.vitorias
    const sdA = sa.golsPro - sa.golsContra
    const sdB = sb.golsPro - sb.golsContra
    return sdB - sdA
  })
}

// Gera as partidas iniciais de uma modalidade
export function gerarPartidas(modalidade, times) {
  switch (modalidade.formato) {
    case 'grupos_com_final': {
      const partidas = []
      for (let i = 0; i < times.length; i++) {
        for (let j = i + 1; j < times.length; j++) {
          partidas.push(novaPart(modalidade.id, 'grupos', 'times',
            { timeId: times[i].id, jogadorId: null },
            { timeId: times[j].id, jogadorId: null }
          ))
        }
      }
      return partidas
    }

    case 'bracket_individual': {
      // Slots 0-3: 1º jogador de cada time; slots 4-7: 2º jogador de cada time
      // Mesmo time → slots i e i+4 (lados opostos do bracket)
      const partidas = []
      const pares = [[0, 1], [2, 3], [4, 5], [6, 7]]
      pares.forEach(([si, sj]) => {
        const tiA = times[si % 4]
        const tiB = times[sj % 4]
        const escA = (modalidade.escalacao?.[tiA.id] || [])
        const escB = (modalidade.escalacao?.[tiB.id] || [])
        const playerIdx = si < 4 ? 0 : 1
        partidas.push(novaPart(modalidade.id, 'quartas', 'individual',
          { timeId: tiA.id, jogadorId: escA[playerIdx] || null },
          { timeId: tiB.id, jogadorId: escB[playerIdx] || null }
        ))
      })
      return partidas
    }

    case 'mata_mata_com_terceiro': {
      const s = shuffleArray(times)
      return [
        novaPart(modalidade.id, 'semifinal', 'times',
          { timeId: s[0].id, jogadorId: null },
          { timeId: s[1].id, jogadorId: null }),
        novaPart(modalidade.id, 'semifinal', 'times',
          { timeId: s[2].id, jogadorId: null },
          { timeId: s[3].id, jogadorId: null }),
      ]
    }

    case 'mata_mata_com_terceiro_individual': {
      const s = shuffleArray(times)
      const esc = (t) => (modalidade.escalacao?.[t.id] || [])[0] || null
      return [
        novaPart(modalidade.id, 'semifinal', 'individual',
          { timeId: s[0].id, jogadorId: esc(s[0]) },
          { timeId: s[1].id, jogadorId: esc(s[1]) }),
        novaPart(modalidade.id, 'semifinal', 'individual',
          { timeId: s[2].id, jogadorId: esc(s[2]) },
          { timeId: s[3].id, jogadorId: esc(s[3]) }),
      ]
    }

    default:
      return []
  }
}

// Gera as partidas da próxima fase após a fase atual ser concluída
// partidas = apenas as partidas desta modalidade
export function gerarProximaFase(modalidade, partidas, times) {
  switch (modalidade.formato) {
    case 'grupos_com_final': {
      const grupos = partidas.filter(p => p.fase === 'grupos')
      const semis = partidas.filter(p => p.fase === 'semifinal')
      const finais = partidas.filter(p => p.fase === 'final')

      if (semis.length === 0 && grupos.length > 0 && grupos.every(p => p.status === 'concluida')) {
        const rank = calcularClassificacaoGrupos(grupos, times)
        if (rank.length >= 3) {
          return [novaPart(modalidade.id, 'semifinal', 'times',
            { timeId: rank[1].id, jogadorId: null },
            { timeId: rank[2].id, jogadorId: null })]
        }
        return [novaPart(modalidade.id, 'final', 'times',
          { timeId: rank[0].id, jogadorId: null },
          { timeId: rank[1].id, jogadorId: null })]
      }

      if (finais.length === 0 && semis.length > 0 && semis.every(p => p.status === 'concluida')) {
        const rank = calcularClassificacaoGrupos(grupos, times)
        return [novaPart(modalidade.id, 'final', 'times',
          { timeId: rank[0].id, jogadorId: null },
          { timeId: semis[0].vencedor, jogadorId: null })]
      }

      return null
    }

    case 'bracket_individual': {
      const quartas = partidas.filter(p => p.fase === 'quartas')
      const semis = partidas.filter(p => p.fase === 'semifinal')
      const finais = partidas.filter(p => p.fase === 'final')

      if (semis.length === 0 && quartas.length === 4 && quartas.every(p => p.status === 'concluida')) {
        const venc = (q) => ({
          timeId: q.vencedor,
          jogadorId: q.participanteA.timeId === q.vencedor ? q.participanteA.jogadorId : q.participanteB.jogadorId,
        })
        return [
          novaPart(modalidade.id, 'semifinal', 'individual', venc(quartas[0]), venc(quartas[1])),
          novaPart(modalidade.id, 'semifinal', 'individual', venc(quartas[2]), venc(quartas[3])),
        ]
      }

      if (finais.length === 0 && semis.length === 2 && semis.every(p => p.status === 'concluida')) {
        const venc = (s) => ({
          timeId: s.vencedor,
          jogadorId: s.participanteA.timeId === s.vencedor ? s.participanteA.jogadorId : s.participanteB.jogadorId,
        })
        return [novaPart(modalidade.id, 'final', 'individual', venc(semis[0]), venc(semis[1]))]
      }

      return null
    }

    case 'mata_mata_com_terceiro':
    case 'mata_mata_com_terceiro_individual': {
      const semis = partidas.filter(p => p.fase === 'semifinal')
      const finais = partidas.filter(p => p.fase === 'final')
      const tipo = modalidade.formato === 'mata_mata_com_terceiro' ? 'times' : 'individual'

      if (finais.length === 0 && semis.length === 2 && semis.every(p => p.status === 'concluida')) {
        const venc = (s) => ({
          timeId: s.vencedor,
          jogadorId: tipo === 'individual'
            ? (s.participanteA.timeId === s.vencedor ? s.participanteA.jogadorId : s.participanteB.jogadorId)
            : null,
        })
        const perd = (s) => ({
          timeId: s.participanteA.timeId === s.vencedor ? s.participanteB.timeId : s.participanteA.timeId,
          jogadorId: tipo === 'individual'
            ? (s.participanteA.timeId !== s.vencedor ? s.participanteA.jogadorId : s.participanteB.jogadorId)
            : null,
        })
        return [
          novaPart(modalidade.id, 'final', tipo, venc(semis[0]), venc(semis[1])),
          novaPart(modalidade.id, 'terceiro_lugar', tipo, perd(semis[0]), perd(semis[1])),
        ]
      }

      return null
    }

    default:
      return null
  }
}

// Calcula as colocações finais de cada time após a modalidade ser concluída
export function calcularColocacoes(modalidade, partidas, times) {
  switch (modalidade.formato) {
    case 'grupos_com_final': {
      const final = partidas.find(p => p.fase === 'final' && p.status === 'concluida')
      if (!final) return null

      const semi = partidas.find(p => p.fase === 'semifinal' && p.status === 'concluida')
      const grupos = partidas.filter(p => p.fase === 'grupos')
      const rank = calcularClassificacaoGrupos(grupos, times)

      const vFinal = final.vencedor
      const pFinal = final.participanteA.timeId === vFinal ? final.participanteB.timeId : final.participanteA.timeId
      const result = [
        { timeId: vFinal, posicao: 1 },
        { timeId: pFinal, posicao: 2 },
      ]

      if (semi) {
        const pSemi = semi.participanteA.timeId === semi.vencedor
          ? semi.participanteB.timeId : semi.participanteA.timeId
        result.push({ timeId: pSemi, posicao: 3 })
      }

      const quarto = rank.find(t => !result.some(r => r.timeId === t.id))
      if (quarto) result.push({ timeId: quarto.id, posicao: 4 })

      return result
    }

    case 'bracket_individual': {
      const final = partidas.find(p => p.fase === 'final' && p.status === 'concluida')
      if (!final) return null

      const semis = partidas.filter(p => p.fase === 'semifinal' && p.status === 'concluida')
      const vFinal = final.vencedor
      const pFinal = final.participanteA.timeId === vFinal ? final.participanteB.timeId : final.participanteA.timeId
      const result = [
        { timeId: vFinal, posicao: 1 },
        { timeId: pFinal, posicao: 2 },
      ]

      const semiLosers = semis
        .map(s => s.participanteA.timeId === s.vencedor ? s.participanteB.timeId : s.participanteA.timeId)
        .filter(tid => !result.some(r => r.timeId === tid))

      semiLosers.forEach((tid, i) => result.push({ timeId: tid, posicao: 3 + i }))
      return result
    }

    case 'mata_mata_com_terceiro':
    case 'mata_mata_com_terceiro_individual': {
      const final = partidas.find(p => p.fase === 'final' && p.status === 'concluida')
      const terceiro = partidas.find(p => p.fase === 'terceiro_lugar' && p.status === 'concluida')
      if (!final || !terceiro) return null

      const vFinal = final.vencedor
      const pFinal = final.participanteA.timeId === vFinal ? final.participanteB.timeId : final.participanteA.timeId
      const vTerceiro = terceiro.vencedor
      const pTerceiro = terceiro.participanteA.timeId === vTerceiro ? terceiro.participanteB.timeId : terceiro.participanteA.timeId

      return [
        { timeId: vFinal, posicao: 1 },
        { timeId: pFinal, posicao: 2 },
        { timeId: vTerceiro, posicao: 3 },
        { timeId: pTerceiro, posicao: 4 },
      ]
    }

    default:
      return null
  }
}

const FASES_ORDEM = {
  grupos_com_final: ['grupos', 'semifinal', 'final'],
  bracket_individual: ['quartas', 'semifinal', 'final'],
  mata_mata_com_terceiro: ['semifinal', 'final', 'terceiro_lugar'],
  mata_mata_com_terceiro_individual: ['semifinal', 'final', 'terceiro_lugar'],
}

export function getFasesPosteriores(fase, formato) {
  const ordem = FASES_ORDEM[formato] || []
  const idx = ordem.indexOf(fase)
  return idx >= 0 ? ordem.slice(idx + 1) : []
}

export const FASE_LABELS = {
  grupos: 'Fase de Grupos',
  quartas: 'Quartas de Final',
  semifinal: 'Semifinal',
  terceiro_lugar: 'Disputa de 3º Lugar',
  final: 'Final',
}

export const FORMATO_LABELS = {
  grupos_com_final: 'Grupos + Final',
  bracket_individual: 'Chaveamento Individual',
  mata_mata_com_terceiro: 'Mata-mata c/ 3º Lugar',
  mata_mata_com_terceiro_individual: 'Mata-mata Individual',
}

export const FORMATO_DESCRICOES = {
  grupos_com_final: 'Round robin entre todos os times. Os melhores avançam para semifinal e final.',
  bracket_individual: '8 jogadores (2/time) em chaveamento. Quartas → Semi → Final.',
  mata_mata_com_terceiro: 'Dois semifinais sorteados. Vencedores fazem a final, perdedores a disputa de 3º.',
  mata_mata_com_terceiro_individual: 'Igual ao mata-mata, mas com 1 representante por time.',
}
