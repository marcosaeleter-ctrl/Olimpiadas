import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Plus, Trash2, Shuffle, GripVertical } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDroppable, useDraggable
} from '@dnd-kit/core'
import { useStore } from '../../store/useStore'
import { useToast } from '../common/Toast'

const DEFAULT_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

function DraggableParticipant({ id, nome, timeId }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `part-${id}`,
    data: { participanteId: id, deTimeId: timeId },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1 cursor-grab active:cursor-grabbing touch-none select-none ${isDragging ? 'opacity-30' : ''}`}
    >
      <GripVertical className="w-3.5 h-3.5 text-gray-500" />
      <span className="text-xs text-white">{nome}</span>
    </div>
  )
}

function DroppableZone({ id, children, highlight, className }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? highlight : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default function TeamCreator() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [activeData, setActiveData] = useState(null)

  const times = state.times
  const participantes = state.participantes

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const addTime = () => {
    if (times.length >= 4) { toast('Máximo de 4 times', 'warning'); return }
    dispatch({
      type: 'ADD_TIME',
      payload: { id: uuidv4(), nome: `Time ${times.length + 1}`, cor: DEFAULT_COLORS[times.length] || '#6366F1', participantes: [] },
    })
  }

  const removeTime = (id) => {
    dispatch({ type: 'REMOVE_TIME', payload: id })
    toast('Time removido', 'info')
  }

  const sortear = () => {
    if (times.length < 2) { toast('Crie ao menos 2 times', 'warning'); return }
    if (participantes.length === 0) { toast('Adicione participantes primeiro', 'warning'); return }
    dispatch({ type: 'SORTEAR_TIMES' })
    toast('Times sorteados!', 'success')
  }

  const nomeParticipante = (id) => participantes.find(p => p.id === id)?.nome || '?'

  const idsNosTimeS = new Set(times.flatMap(t => t.participantes))
  const semTime = participantes.filter(p => !idsNosTimeS.has(p.id))

  const handleDragStart = (event) => {
    setActiveData(event.active.data.current)
  }

  const handleDragEnd = (event) => {
    setActiveData(null)
    const { over, active } = event
    if (!over) return
    const { participanteId, deTimeId } = active.data.current
    const paraTimeId = over.id === '__pool__' ? null : over.id
    if (deTimeId === paraTimeId) return
    dispatch({ type: 'MOVER_PARTICIPANTE', payload: { participanteId, deTimeId, paraTimeId } })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Times</h2>
            <p className="text-sm text-gray-400">{times.length} time{times.length !== 1 ? 's' : ''} criado{times.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={sortear} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/80 hover:bg-purple-500 rounded-xl text-sm font-medium transition-colors">
            <Shuffle className="w-4 h-4" /> Sortear
          </button>
          <button onClick={addTime} disabled={times.length >= 4} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Time
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

        {/* Participantes sem time */}
        {participantes.length > 0 && times.length > 0 && (
          <DroppableZone
            id="__pool__"
            highlight="bg-purple-500/10"
            className="mb-4 rounded-xl border-2 border-dashed border-white/10 p-3"
          >
            <p className="text-xs text-gray-400 font-medium mb-2">Sem time ({semTime.length})</p>
            {semTime.length === 0 ? (
              <p className="text-xs text-gray-600 italic">Todos os participantes estão em um time</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {semTime.map(p => (
                  <DraggableParticipant key={p.id} id={p.id} nome={p.nome} timeId={null} />
                ))}
              </div>
            )}
          </DroppableZone>
        )}

        {times.length === 0 && (
          <p className="text-sm text-gray-500 italic text-center py-4">Nenhum time criado. Clique em "+ Time" para adicionar.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {times.map(time => (
              <motion.div
                key={time.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <DroppableZone
                  id={time.id}
                  highlight="border-opacity-100"
                  className="rounded-xl p-4 border-2 h-full"
                  style={{ background: `${time.cor}15` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={time.cor}
                        onChange={e => dispatch({ type: 'UPDATE_TIME', payload: { id: time.id, cor: e.target.value } })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={time.nome}
                        onChange={e => dispatch({ type: 'UPDATE_TIME', payload: { id: time.id, nome: e.target.value } })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <button onClick={() => removeTime(time.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 min-h-[2rem]">
                    {time.participantes.length === 0 && (
                      <p className="text-xs text-gray-500 italic">Arraste participantes aqui</p>
                    )}
                    {time.participantes.map(pid => (
                      <DraggableParticipant key={pid} id={pid} nome={nomeParticipante(pid)} timeId={time.id} />
                    ))}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    {time.participantes.length} participante{time.participantes.length !== 1 ? 's' : ''}
                  </div>
                </DroppableZone>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <DragOverlay>
          {activeData ? (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2 py-1 shadow-lg">
              <GripVertical className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-white">
                {participantes.find(p => p.id === activeData.participanteId)?.nome}
              </span>
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>

      {times.length > 0 && participantes.length > 0 && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          Arraste participantes entre os times ou de volta para "Sem time"
        </p>
      )}
    </motion.div>
  )
}
