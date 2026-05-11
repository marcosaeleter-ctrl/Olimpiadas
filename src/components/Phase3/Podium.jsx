import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Trophy, Star } from 'lucide-react'
import confetti from 'canvas-confetti'
import html2canvas from 'html2canvas'
import { useStore, calcularPlacar } from '../../store/useStore'
import { useToast } from '../common/Toast'

function PodiumBlock({ time, posicao, pontos, delay }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const sizes = { 1: 'text-5xl', 2: 'text-4xl', 3: 'text-3xl' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 15 }}
      className="flex flex-col items-center gap-2"
    >
      <span className={`${sizes[posicao]}`}>{medals[posicao]}</span>
      <div
        className="w-20 rounded-t-xl flex items-end justify-center pb-3 font-bold text-white text-2xl shadow-lg"
        style={{ background: time.cor, height: posicao === 1 ? 112 : posicao === 2 ? 80 : 56 }}
      >
        {posicao}
      </div>
      <div
        className="text-center rounded-xl p-2 border"
        style={{ borderColor: time.cor + '50', background: time.cor + '20' }}
      >
        <p className="text-sm font-bold text-white">{time.nome}</p>
        <p className="text-xs font-semibold" style={{ color: time.cor }}>{pontos}pts</p>
      </div>
    </motion.div>
  )
}

function posLabel(pos) {
  if (pos === 1) return 'Campeão'
  if (pos === 2) return 'Vice-campeão'
  if (pos === 3) return '3º lugar'
  return `${pos}º lugar`
}

export default function Podium() {
  const { state } = useStore()
  const toast = useToast()
  const podiumRef = useRef(null)

  const placar = calcularPlacar(state.times, state.modalidades)
  const ranking = [...state.times]
    .map(t => ({ ...t, pontos: placar[t.id] || 0 }))
    .sort((a, b) => b.pontos - a.pontos)

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 4000
      const end = Date.now() + duration
      const colors = state.times.map(t => t.cor)
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const exportar = async () => {
    if (!podiumRef.current) return
    try {
      const canvas = await html2canvas(podiumRef.current, { backgroundColor: '#0f0f1a', scale: 2 })
      const link = document.createElement('a')
      link.download = `podio-${state.evento.nome || 'olimpiadas'}.png`
      link.href = canvas.toDataURL()
      link.click()
      toast('Pódio exportado!', 'success')
    } catch {
      toast('Erro ao exportar', 'error')
    }
  }

  const top3 = ranking.slice(0, 3)
  const podioOrdem = [top3[1], top3[0], top3[2]].filter(Boolean)

  const modalidadesVencidas = (timeId) =>
    state.modalidades.filter(m => m.status === 'concluida' && m.resultado?.some(r => r.posicao === 1 && r.timeId === timeId)).length

  // Melhores desempenhos por modalidade para cada time
  const destaques = (timeId) => {
    const concluidas = state.modalidades.filter(m => m.status === 'concluida' && m.resultado)
    return concluidas
      .map(m => {
        const r = m.resultado.find(r => r.timeId === timeId)
        return r ? { nome: m.nome, posicao: r.posicao } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.posicao - b.posicao)
      .slice(0, 3)
  }

  return (
    <div className="space-y-8">
      {/* Pódio visual */}
      <div ref={podiumRef} className="bg-gradient-to-b from-indigo-950/80 to-gray-950 border border-white/10 rounded-2xl p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-black text-white">{state.evento.nome || 'Olimpíadas'}</h1>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-gray-400">Classificação Final</p>
        </motion.div>

        <div className="flex items-end justify-center gap-4 mb-8">
          {podioOrdem.map((time) => {
            const pos = time.id === top3[0]?.id ? 1 : time.id === top3[1]?.id ? 2 : 3
            return (
              <PodiumBlock
                key={time.id}
                time={time}
                posicao={pos}
                pontos={placar[time.id] || 0}
                delay={pos === 1 ? 0.6 : pos === 2 ? 0.3 : 0.1}
              />
            )
          })}
        </div>

        {/* Ranking completo */}
        <div className="space-y-2">
          {ranking.map((time, idx) => {
            const vitorias = modalidadesVencidas(time.id)
            const destaqueTime = destaques(time.id)

            return (
              <motion.div
                key={time.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="bg-white/5 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}</span>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: time.cor }} />
                  <span className="flex-1 font-semibold text-white">{time.nome}</span>
                  <div className="text-right">
                    <p className="text-lg font-black" style={{ color: time.cor }}>{placar[time.id] || 0}pts</p>
                    <p className="text-xs text-gray-400">
                      {vitorias} vitória{vitorias !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Destaques por modalidade */}
                {destaqueTime.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 ml-11">
                    {destaqueTime.map(d => (
                      <span
                        key={d.nome}
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          borderColor: time.cor + '40',
                          background: time.cor + '15',
                          color: d.posicao === 1 ? time.cor : 'rgb(156,163,175)',
                        }}
                      >
                        {d.posicao === 1 ? '🏆' : d.posicao === 2 ? '🥈' : d.posicao === 3 ? '🥉' : `${d.posicao}º`} {d.nome}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <button onClick={exportar} className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors border border-white/10">
        <Download className="w-5 h-5" /> Exportar Pódio como PNG
      </button>

      {/* Todas as modalidades */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" /> Todas as Modalidades
        </h2>
        <div className="space-y-3">
          {state.modalidades.map(m => (
            <div key={m.id} className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">{m.nome}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'concluida' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                  {m.status === 'concluida' ? 'Concluída' : 'Não realizada'}
                </span>
              </div>
              {m.resultado && (
                <div className="space-y-1">
                  {[...m.resultado].sort((a, b) => a.posicao - b.posicao).map(r => {
                    const time = state.times.find(t => t.id === r.timeId)
                    if (!time) return null
                    const escalados = m.escalacao[r.timeId] || []
                    const nomes = escalados.map(id => state.participantes.find(p => p.id === id)?.nome).filter(Boolean).join(', ')
                    const medal = r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : `${r.posicao}º`
                    return (
                      <div key={r.timeId} className="flex items-center gap-2 text-xs">
                        <span className="w-5">{medal}</span>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: time.cor }} />
                        <span className="font-medium" style={{ color: time.cor }}>{time.nome}</span>
                        <span className="text-gray-400">{nomes && `(${nomes})`}</span>
                        <span className="ml-auto font-bold" style={{ color: time.cor }}>+{r.pontos}pts</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
