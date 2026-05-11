import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useToast } from '../common/Toast'

export default function EventConfig() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-yellow-500/20">
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold">Dados do Evento</h2>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Evento</label>
        <input
          type="text"
          value={state.evento.nome}
          onChange={e => dispatch({ type: 'SET_EVENTO_NOME', payload: e.target.value })}
          onBlur={() => state.evento.nome && toast('Nome do evento salvo!', 'success')}
          placeholder="Ex: Olimpíadas dos Amigos 2025"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>
    </motion.div>
  )
}
