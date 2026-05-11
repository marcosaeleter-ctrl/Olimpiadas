import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useToast } from '../common/Toast'
import CategoryBadge from '../common/CategoryBadge'

function shufflePick(arr, n) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(n, copy.length))
}

function ModalidadeEscalacao({ modalidade }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)

  const timesParticipantes = modalidade.tipo === 'duelo'
    ? state.times.slice(0, 2)
    : state.times

  const sortearTime = (timeId) => {
    const time = state.times.find(t => t.id === timeId)
    if (!time) return
    const jogadores = shufflePick(time.participantes, modalidade.jogadoresPorTime)
    dispatch({ type: 'SET_ESCALACAO', payload: { modalidadeId: modalidade.id, timeId, jogadores } })
    toast('Escalação sorteada!', 'success')
  }

  const sortearTodos = () => {
    timesParticipantes.forEach(time => {
      const jogadores = shufflePick(time.participantes, modalidade.jogadoresPorTime)
      dispatch({ type: 'SET_ESCALACAO', payload: { modalidadeId: modalidade.id, timeId: time.id, jogadores } })
    })
    toast('Todos os times escalados!', 'success')
  }

  const nomeParticipante = (id) => state.participantes.find(p => p.id === id)?.nome || '?'

  const handleTrocar = (timeId, idx, novoId) => {
    const atual = modalidade.escalacao[timeId] || []
    const novo = [...atual]
    novo[idx] = novoId
    dispatch({ type: 'SET_ESCALACAO', payload: { modalidadeId: modalidade.id, timeId, jogadores: novo } })
  }

  const isEscalacaoCompleta = timesParticipantes.every(t => {
    const esc = modalidade.escalacao[t.id] || []
    return esc.length >= Math.min(modalidade.jogadoresPorTime, t.participantes.length)
  })

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className={`w-2 h-2 rounded-full ${isEscalacaoCompleta ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <div>
            <p className="font-medium text-sm text-white">{modalidade.nome}</p>
            <div className="mt-0.5">
              <CategoryBadge categoria={modalidade.categoria} especial={modalidade.especial} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEscalacaoCompleta && <span className="text-xs text-yellow-400">Incompleto</span>}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 pt-0 space-y-4 border-t border-white/10">
              <div className="flex justify-end">
                <button onClick={sortearTodos} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 rounded-lg transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Sortear todos
                </button>
              </div>

              {timesParticipantes.map(time => {
                const escalados = modalidade.escalacao[time.id] || []
                const slots = Array(Math.min(modalidade.jogadoresPorTime, time.participantes.length)).fill(null).map((_, i) => escalados[i] || null)

                return (
                  <div key={time.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: time.cor }} />
                        <span className="text-sm font-medium" style={{ color: time.cor }}>{time.nome}</span>
                      </div>
                      <button onClick={() => sortearTime(time.id)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                        <RefreshCw className="w-3 h-3" /> Sortear
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {slots.map((jogId, idx) => (
                        <select
                          key={idx}
                          value={jogId || ''}
                          onChange={e => handleTrocar(time.id, idx, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">— selecionar —</option>
                          {time.participantes.map(pid => (
                            <option key={pid} value={pid}>{nomeParticipante(pid)}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                    {time.participantes.length === 0 && (
                      <p className="text-xs text-gray-500 italic">Time sem participantes</p>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PlayerAssignment() {
  const { state } = useStore()

  if (state.modalidades.length === 0 || state.times.length === 0) return null

  const completas = state.modalidades.filter(m =>
    (m.tipo === 'duelo' ? state.times.slice(0, 2) : state.times).every(t => {
      const esc = m.escalacao[t.id] || []
      return esc.length >= Math.min(m.jogadoresPorTime, t.participantes.length)
    })
  ).length

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-teal-500/20">
          <UserCheck className="w-6 h-6 text-teal-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Escalação dos Jogadores</h2>
          <p className="text-sm text-gray-400">{completas}/{state.modalidades.length} modalidades completas</p>
        </div>
      </div>
      <div className="space-y-2">
        {state.modalidades.map(m => (
          <ModalidadeEscalacao key={m.id} modalidade={m} />
        ))}
      </div>
    </motion.div>
  )
}
