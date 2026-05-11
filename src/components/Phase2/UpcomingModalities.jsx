import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Swords } from 'lucide-react'
import { useStore } from '../../store/useStore'
import CategoryBadge from '../common/CategoryBadge'
import ModalidadeDetalhe from './ModalidadeDetalhe'
import { FORMATO_LABELS } from '../../utils/partidas'

function StatusBadge({ modalidade }) {
  if (modalidade.status === 'em_andamento') {
    const partidas = modalidade.partidas || []
    const restantes = partidas.filter(p => p.status === 'pendente').length
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
        {restantes > 0 ? `${restantes} restante${restantes !== 1 ? 's' : ''}` : 'Finalizando...'}
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-medium">
      Pendente
    </span>
  )
}

export default function UpcomingModalities() {
  const { state } = useStore()
  const [selectedId, setSelectedId] = useState(null)

  const nomeParticipante = (id) => state.participantes.find(p => p.id === id)?.nome || '?'

  const ativas = state.modalidades
    .filter(m => m.status === 'pendente' || m.status === 'em_andamento')
    .sort((a, b) => {
      if (a.status === 'em_andamento' && b.status !== 'em_andamento') return -1
      if (b.status === 'em_andamento' && a.status !== 'em_andamento') return 1
      return a.ordem - b.ordem
    })

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold">Próximas Modalidades</h2>
          <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{ativas.length}</span>
        </div>

        {ativas.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">Todas as modalidades foram realizadas!</p>
        ) : (
          <div className="space-y-3">
            {ativas.map((m, idx) => {
              const emAndamento = m.status === 'em_andamento'
              const temFormato = !!m.formato
              const timesParticipantes = m.tipo === 'duelo' ? state.times.slice(0, 2) : state.times

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => temFormato && setSelectedId(m.id)}
                  className={`rounded-xl p-3 border transition-all ${
                    emAndamento
                      ? 'border-blue-500/50 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10'
                      : temFormato
                        ? 'border-indigo-500/30 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10'
                        : 'border-white/5 bg-white/3'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {emAndamento && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">EM ANDAMENTO</span>}
                        {!emAndamento && idx === 0 && <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded font-medium">PRÓXIMA</span>}
                        <span className="text-sm font-semibold text-white">{m.nome}</span>
                        <StatusBadge modalidade={m} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <CategoryBadge categoria={m.categoria} />
                        {temFormato && (
                          <span className="text-xs text-indigo-400 flex items-center gap-1">
                            <Swords className="w-3 h-3" /> {FORMATO_LABELS[m.formato]}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">#{m.ordem}</span>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {timesParticipantes.map(time => {
                      const escalados = m.escalacao[time.id] || []
                      return (
                        <div key={time.id} className="flex items-start gap-2">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-2 h-2 rounded-full mt-1" style={{ background: time.cor }} />
                            <span className="text-xs font-medium" style={{ color: time.cor }}>{time.nome}:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {escalados.length > 0
                              ? escalados.map(pid => (
                                  <span key={pid} className="text-xs bg-white/10 rounded px-1.5 py-0.5 text-gray-300">{nomeParticipante(pid)}</span>
                                ))
                              : <span className="text-xs text-gray-500 italic">Sem escalação</span>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {temFormato && (
                    <p className="text-xs text-gray-500 mt-2">Toque para {emAndamento ? 'gerenciar partidas' : 'iniciar'}</p>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedId && (
          <ModalidadeDetalhe modalidadeId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
