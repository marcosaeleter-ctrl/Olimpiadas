import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, UserPlus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useToast } from '../common/Toast'

export default function ParticipantManager() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_PARTICIPANTE', payload: trimmed })
    const count = trimmed.split(/[\n,]+/).filter(s => s.trim()).length
    toast(`${count} participante${count > 1 ? 's' : ''} adicionado${count > 1 ? 's' : ''}!`, 'success')
    setInput('')
  }

  const handleRemove = (id, nome) => {
    dispatch({ type: 'REMOVE_PARTICIPANTE', payload: id })
    toast(`${nome} removido`, 'info')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-blue-500/20">
          <Users className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Participantes</h2>
          <p className="text-sm text-gray-400">{state.participantes.length} cadastrado{state.participantes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          placeholder="Nome do participante (ou cole vários separados por vírgula / quebra de linha)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {state.participantes.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5"
            >
              <span className="text-sm text-white">{p.nome}</span>
              <button onClick={() => handleRemove(p.id, p.nome)} className="text-gray-400 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {state.participantes.length === 0 && (
          <p className="text-sm text-gray-500 italic">Nenhum participante cadastrado ainda</p>
        )}
      </div>
    </motion.div>
  )
}
