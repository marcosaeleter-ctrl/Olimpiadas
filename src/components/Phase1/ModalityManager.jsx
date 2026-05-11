import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, Plus, Trash2, GripVertical, Zap } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../../store/useStore'
import { useToast } from '../common/Toast'
import CategoryBadge from '../common/CategoryBadge'
import { MODALIDADES_PADRAO } from '../../constants/modalidadesPadrao'
import { FORMATO_LABELS, FORMATO_DESCRICOES } from '../../utils/partidas'

const FORM_INITIAL = {
  nome: '',
  categoria: 'Esporte',
  tipo: 'todos',
  jogadoresPorTime: 1,
  formato: 'grupos_com_final',
  configuracao: {},
  tabelaPontos: { 1: 5, 2: 3, 3: 2, 4: 1 },
}

const FORMATOS = ['grupos_com_final', 'bracket_individual', 'mata_mata_com_terceiro', 'mata_mata_com_terceiro_individual']

function SortableItem({ modalidade, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: modalidade.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const formatoLabel = FORMATO_LABELS[modalidade.formato] || (modalidade.tipo === 'duelo' ? 'Duelo' : 'Todos contra todos')

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 group">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 touch-none">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white">{modalidade.nome}</span>
          <CategoryBadge categoria={modalidade.categoria} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatoLabel} · {modalidade.jogadoresPorTime != null ? `${modalidade.jogadoresPorTime} jogador${modalidade.jogadoresPorTime !== 1 ? 'es' : ''}/time` : 'Time completo'}
        </p>
      </div>
      <button onClick={() => onRemove(modalidade.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ModalityManager() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [form, setForm] = useState(FORM_INITIAL)
  const [showForm, setShowForm] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const applyTemplate = (tmpl) => {
    setForm({
      nome: tmpl.nome,
      categoria: tmpl.categoria,
      tipo: 'todos',
      jogadoresPorTime: tmpl.jogadoresPorTime,
      formato: tmpl.formato,
      configuracao: { ...tmpl.configuracao },
      tabelaPontos: { ...tmpl.tabelaPontos },
    })
  }

  const handleAdd = () => {
    if (!form.nome.trim()) { toast('Informe o nome da modalidade', 'warning'); return }
    dispatch({ type: 'ADD_MODALIDADE', payload: { ...form, nome: form.nome.trim() } })
    toast(`${form.nome} adicionada!`, 'success')
    setForm(FORM_INITIAL)
    setShowForm(false)
  }

  const handleRemove = (id) => {
    dispatch({ type: 'REMOVE_MODALIDADE', payload: id })
    toast('Modalidade removida', 'info')
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = state.modalidades.findIndex(m => m.id === active.id)
      const newIndex = state.modalidades.findIndex(m => m.id === over.id)
      dispatch({ type: 'REORDER_MODALIDADES', payload: arrayMove(state.modalidades, oldIndex, newIndex) })
    }
  }

  const showPontosPorJogo = form.formato === 'grupos_com_final' || form.formato === 'mata_mata_com_terceiro'
  const showTempoJogo = form.jogadoresPorTime === null || form.jogadoresPorTime === ''

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/20">
            <List className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Modalidades</h2>
            <p className="text-sm text-gray-400">{state.modalidades.length} cadastrada{state.modalidades.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600/80 hover:bg-green-500 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">

              {/* Templates */}
              <div>
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Templates rápidos
                </p>
                <div className="flex flex-wrap gap-2">
                  {MODALIDADES_PADRAO.map(tmpl => (
                    <button
                      key={tmpl.nome}
                      onClick={() => applyTemplate(tmpl)}
                      className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 transition-colors"
                    >
                      {tmpl.nome}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-white/10" />

              {/* Nome */}
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome da modalidade"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />

              {/* Categoria + Jogadores por time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option>Esporte</option>
                    <option>Prova Física</option>
                    <option>Jogo de Mesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Jogadores/time</label>
                  <input
                    type="number" min="1" max="20"
                    value={form.jogadoresPorTime ?? ''}
                    onChange={e => setForm(f => ({ ...f, jogadoresPorTime: e.target.value === '' ? null : parseInt(e.target.value) || 1 }))}
                    placeholder="Livre"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Formato */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Formato da competição</label>
                <div className="space-y-2">
                  {FORMATOS.map(fmt => (
                    <label key={fmt} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.formato === fmt ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-white/20'}`}>
                      <input
                        type="radio"
                        name="formato"
                        value={fmt}
                        checked={form.formato === fmt}
                        onChange={() => setForm(f => ({ ...f, formato: fmt }))}
                        className="mt-0.5 accent-green-500 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{FORMATO_LABELS[fmt]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{FORMATO_DESCRICOES[fmt]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Campos condicionais de configuração */}
              {(showPontosPorJogo || showTempoJogo) && (
                <div className="grid grid-cols-2 gap-3">
                  {showPontosPorJogo && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Pontos por jogo</label>
                      <input
                        type="number" min="1"
                        value={form.configuracao.pontosPorJogo ?? ''}
                        onChange={e => setForm(f => ({ ...f, configuracao: { ...f.configuracao, pontosPorJogo: parseInt(e.target.value) || undefined } }))}
                        placeholder="Opcional"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                  )}
                  {showTempoJogo && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tempo de jogo (min)</label>
                      <input
                        type="number" min="1"
                        value={form.configuracao.tempoJogo ?? ''}
                        onChange={e => setForm(f => ({ ...f, configuracao: { ...f.configuracao, tempoJogo: parseInt(e.target.value) || undefined } }))}
                        placeholder="Ex: 10"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tabela de pontos */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Pontos por colocação</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(pos => (
                    <div key={pos} className="text-center">
                      <p className="text-xs text-gray-500 mb-1">{pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '4º'}</p>
                      <input
                        type="number" min="0"
                        value={form.tabelaPontos[pos] ?? ''}
                        onChange={e => setForm(f => ({ ...f, tabelaPontos: { ...f.tabelaPontos, [pos]: parseInt(e.target.value) || 0 } }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-green-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleAdd} className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors">
                  Adicionar
                </button>
                <button onClick={() => { setShowForm(false); setForm(FORM_INITIAL) }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.modalidades.length === 0 ? (
        <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma modalidade cadastrada</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={state.modalidades.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {state.modalidades.map(m => (
                <SortableItem key={m.id} modalidade={m} onRemove={handleRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {state.modalidades.length > 1 && (
        <p className="text-xs text-gray-500 mt-3 text-center">Arraste para reordenar as modalidades</p>
      )}
    </motion.div>
  )
}
