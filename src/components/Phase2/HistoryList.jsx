import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, RotateCcw, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useToast } from '../common/Toast'
import { ConfirmModal } from '../common/Modal'
import CategoryBadge from '../common/CategoryBadge'
import { FASE_LABELS } from '../../utils/partidas'

const FASES_ORDEM = ['grupos', 'quartas', 'semifinal', 'terceiro_lugar', 'final']

function PodioModalidade({ resultado, times }) {
  const top3 = [...resultado]
    .sort((a, b) => a.posicao - b.posicao)
    .slice(0, 3)

  return (
    <div className="flex items-end justify-start gap-2 mt-2">
      {top3.map(r => {
        const time = times.find(t => t.id === r.timeId)
        if (!time) return null
        const medal = r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : '🥉'
        return (
          <div key={r.timeId} className="flex items-center gap-1.5">
            <span className="text-sm">{medal}</span>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: time.cor }} />
            <span className="text-xs font-medium text-gray-200">{time.nome}</span>
            <span className="text-xs font-bold" style={{ color: time.cor }}>+{r.pontos}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function HistoryList() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [confirmId, setConfirmId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const concluidas = state.modalidades
    .filter(m => m.status === 'concluida')
    .sort((a, b) => b.ordem - a.ordem)

  const nomeTime = (id) => state.times.find(t => t.id === id)
  const nomeParticipante = (id) => state.participantes.find(p => p.id === id)?.nome || '?'

  const handleDesfazer = (id) => {
    dispatch({ type: 'DESFAZER_RESULTADO', payload: id })
    toast('Modalidade revertida para pendente', 'info')
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-bold">Histórico</h2>
        <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">{concluidas.length}</span>
      </div>

      {concluidas.length === 0 ? (
        <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma modalidade concluída ainda</p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {concluidas.map(m => {
              const partidas = (m.partidas || [])
              const temPartidas = partidas.length > 0
              const expandido = expandedId === m.id

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/5 border border-white/5 rounded-xl overflow-hidden"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold text-white">{m.nome}</p>
                        <CategoryBadge categoria={m.categoria} />
                      </div>
                      <button
                        onClick={() => setConfirmId(m.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-400 transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-orange-500/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Desfazer
                      </button>
                    </div>

                    {/* Pódio resumido */}
                    {m.resultado && (
                      <PodioModalidade resultado={m.resultado} times={state.times} />
                    )}

                    {/* Ver partidas */}
                    {temPartidas && (
                      <button
                        onClick={() => setExpandedId(expandido ? null : m.id)}
                        className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {expandido ? 'Ocultar partidas' : 'Ver partidas'}
                      </button>
                    )}
                  </div>

                  {/* Partidas expandidas */}
                  <AnimatePresence>
                    {expandido && temPartidas && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="p-3 space-y-3">
                          {FASES_ORDEM.filter(f => partidas.some(p => p.fase === f)).map(fase => {
                            const ps = partidas.filter(p => p.fase === fase && p.status === 'concluida')
                            if (ps.length === 0) return null
                            return (
                              <div key={fase}>
                                <p className="text-xs font-medium text-gray-400 mb-1.5">{FASE_LABELS[fase]}</p>
                                <div className="space-y-1.5">
                                  {ps.map(partida => {
                                    const nomeA = partida.participanteA.jogadorId
                                      ? nomeParticipante(partida.participanteA.jogadorId)
                                      : nomeTime(partida.participanteA.timeId)?.nome || '?'
                                    const nomeB = partida.participanteB.jogadorId
                                      ? nomeParticipante(partida.participanteB.jogadorId)
                                      : nomeTime(partida.participanteB.timeId)?.nome || '?'
                                    const corA = nomeTime(partida.participanteA.timeId)?.cor || '#888'
                                    const corB = nomeTime(partida.participanteB.timeId)?.cor || '#888'

                                    return (
                                      <div key={partida.id} className="flex items-center gap-2 bg-white/3 rounded-lg px-3 py-2">
                                        <span className="text-xs truncate flex-1 text-right" style={{ color: partida.vencedor === partida.participanteA.timeId ? corA : 'rgb(156,163,175)' }}>{nomeA}</span>
                                        <span className="text-xs font-bold text-white tabular-nums shrink-0">
                                          {m.configuracao?.semPlacar
                                            ? (partida.vencedor === partida.participanteA.timeId ? '✓ ×' : '× ✓')
                                            : `${partida.placar.a ?? '–'} × ${partida.placar.b ?? '–'}`
                                          }
                                        </span>
                                        <span className="text-xs truncate flex-1" style={{ color: partida.vencedor === partida.participanteB.timeId ? corB : 'rgb(156,163,175)' }}>{nomeB}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDesfazer(confirmId)}
        title="Desfazer modalidade"
        message="O resultado e todas as partidas serão removidos. A modalidade voltará para a fila de pendentes."
        confirmLabel="Desfazer"
        danger
      />
    </div>
  )
}
