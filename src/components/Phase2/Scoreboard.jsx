import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Crown } from 'lucide-react'
import { useStore, calcularPlacar } from '../../store/useStore'

function getRankIcon(pos) {
  if (pos === 1) return <Crown className="w-5 h-5 text-yellow-400" />
  if (pos === 2) return <Medal className="w-5 h-5 text-gray-300" />
  if (pos === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm font-bold text-gray-400">{pos}º</span>
}

export default function Scoreboard() {
  const { state } = useStore()
  const placar = calcularPlacar(state.times, state.modalidades)

  const ranking = [...state.times]
    .map(t => ({ ...t, pontos: placar[t.id] || 0 }))
    .sort((a, b) => b.pontos - a.pontos)

  const maxPontos = Math.max(...ranking.map(t => t.pontos), 1)

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-bold">Placar</h2>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {ranking.map((time, idx) => {
            const isLider = idx === 0 && time.pontos > 0
            return (
              <motion.div
                key={time.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', damping: 20, delay: idx * 0.05 }}
                style={{ borderColor: isLider ? time.cor : 'transparent' }}
                className={`relative rounded-xl p-3 border overflow-hidden transition-all ${isLider ? 'border-2' : 'border border-white/5'}`}
              >
                {/* Background fill */}
                <div className="absolute inset-0 opacity-10" style={{ background: time.cor }} />

                <div className="relative flex items-center gap-3">
                  <div className="w-7 flex items-center justify-center shrink-0">
                    {getRankIcon(idx + 1)}
                  </div>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: time.cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-white truncate">{time.nome}</span>
                      <motion.span
                        key={time.pontos}
                        initial={{ scale: 1.4 }}
                        animate={{ scale: 1 }}
                        className="text-lg font-bold tabular-nums"
                        style={{ color: time.cor }}
                      >
                        {time.pontos}
                      </motion.span>
                    </div>
                    {/* Bar */}
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: time.cor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(time.pontos / maxPontos) * 100}%` }}
                        transition={{ type: 'spring', damping: 20 }}
                      />
                    </div>
                  </div>
                  {isLider && (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-lg"
                    >
                      👑
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        {state.modalidades.filter(m => m.status === 'concluida').length} de {state.modalidades.length} modalidades concluídas
      </p>
    </div>
  )
}
