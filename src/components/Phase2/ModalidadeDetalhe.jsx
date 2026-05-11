import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, RotateCcw, CheckCircle, Trophy, Users } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useStore } from '../../store/useStore'
import { useToast } from '../common/Toast'
import { ConfirmModal } from '../common/Modal'
import CategoryBadge from '../common/CategoryBadge'
import { FASE_LABELS, FORMATO_LABELS } from '../../utils/partidas'

const FASES_ORDEM = ['grupos', 'quartas', 'semifinal', 'terceiro_lugar', 'final']

// ── Mini-modal de registro de placar ──────────────────────────────────────────
function PlacarModal({ partida, modalidade, onClose, onConfirm }) {
  const { state } = useStore()
  const [placarA, setPlacarA] = useState('')
  const [placarB, setPlacarB] = useState('')
  const [vencedorManual, setVencedorManual] = useState(null)

  const semPlacar = !!modalidade.configuracao?.semPlacar

  const nomePartic = (part) => {
    if (part.jogadorId) return state.participantes.find(p => p.id === part.jogadorId)?.nome || '?'
    return state.times.find(t => t.id === part.timeId)?.nome || '?'
  }
  const corPartic = (part) => state.times.find(t => t.id === part.timeId)?.cor || '#888'

  const nomeA = nomePartic(partida.participanteA)
  const nomeB = nomePartic(partida.participanteB)
  const corA = corPartic(partida.participanteA)
  const corB = corPartic(partida.participanteB)

  let previewVencedorId = null
  if (semPlacar) {
    previewVencedorId = vencedorManual
  } else {
    const a = parseInt(placarA), b = parseInt(placarB)
    if (!isNaN(a) && !isNaN(b)) {
      if (a > b) previewVencedorId = partida.participanteA.timeId
      else if (b > a) previewVencedorId = partida.participanteB.timeId
    }
  }

  const canConfirm = semPlacar ? !!vencedorManual : (placarA !== '' && placarB !== '' && !isNaN(parseInt(placarA)) && !isNaN(parseInt(placarB)))

  const handleConfirm = () => {
    if (!canConfirm) return
    if (semPlacar) {
      onConfirm({ a: null, b: null, vencedor: vencedorManual })
    } else {
      const a = parseInt(placarA), b = parseInt(placarB)
      const v = a > b ? partida.participanteA.timeId : b > a ? partida.participanteB.timeId : null
      onConfirm({ a, b, vencedor: v })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">{FASE_LABELS[partida.fase] || partida.fase}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {semPlacar ? (
          /* Seletor de vencedor para Xadrez */
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Selecione o vencedor</p>
            {[partida.participanteA, partida.participanteB].map((part) => {
              const nome = nomePartic(part)
              const cor = corPartic(part)
              const sel = vencedorManual === part.timeId
              return (
                <button
                  key={part.timeId}
                  onClick={() => setVencedorManual(part.timeId)}
                  style={{ borderColor: sel ? cor : 'transparent', background: sel ? cor + '20' : '' }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cor }} />
                  <span className="text-sm font-medium text-white flex-1 text-left">{nome}</span>
                  {sel && <Trophy className="w-4 h-4 text-yellow-400" />}
                </button>
              )
            })}
          </div>
        ) : (
          /* Campos numéricos de placar */
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs mb-1 font-medium truncate" style={{ color: corA }}>{nomeA}</p>
                <input
                  type="number" min="0"
                  value={placarA}
                  onChange={e => setPlacarA(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-2xl font-bold text-white text-center focus:outline-none focus:border-indigo-500"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <span className="text-gray-500 font-bold text-lg mt-5">×</span>
              <div className="flex-1">
                <p className="text-xs mb-1 font-medium truncate" style={{ color: corB }}>{nomeB}</p>
                <input
                  type="number" min="0"
                  value={placarB}
                  onChange={e => setPlacarB(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-2xl font-bold text-white text-center focus:outline-none focus:border-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview de quem avança */}
        {previewVencedorId && (
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-xs text-gray-300">
              Avança: <span className="font-semibold text-white">
                {previewVencedorId === partida.participanteA.timeId ? nomeA : nomeB}
              </span>
            </p>
          </div>
        )}
        {!semPlacar && placarA !== '' && placarB !== '' && parseInt(placarA) === parseInt(placarB) && (
          <div className="bg-yellow-500/10 rounded-xl p-3">
            <p className="text-xs text-yellow-300">Empate — nenhum time avança (fase de grupos)</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-colors"
        >
          <CheckCircle className="w-4 h-4" /> Confirmar resultado
        </button>
      </motion.div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function ModalidadeDetalhe({ modalidadeId, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [registrando, setRegistrando] = useState(null)
  const [confirmDesfazer, setConfirmDesfazer] = useState(null)
  const [fasesExpandidas, setFasesExpandidas] = useState({})

  const modalidade = state.modalidades.find(m => m.id === modalidadeId)

  useEffect(() => {
    if (modalidade && modalidade.status === 'pendente' && modalidade.formato) {
      dispatch({ type: 'INICIAR_MODALIDADE', payload: { modalidadeId } })
    }
  }, [modalidadeId])

  if (!modalidade) return null

  const partidas = modalidade.partidas || []

  const nomePartic = (part) => {
    if (part.jogadorId) return state.participantes.find(p => p.id === part.jogadorId)?.nome || '?'
    return state.times.find(t => t.id === part.timeId)?.nome || '?'
  }
  const corTime = (timeId) => state.times.find(t => t.id === timeId)?.cor || '#888'

  const fasesPresentes = FASES_ORDEM.filter(f => partidas.some(p => p.fase === f))

  const handleRegistrar = (placar) => {
    dispatch({ type: 'REGISTRAR_PARTIDA', payload: { modalidadeId, partidaId: registrando.id, placar } })

    const nomeA = nomePartic(registrando.participanteA)
    const nomeB = nomePartic(registrando.participanteB)
    toast(`${nomeA} × ${nomeB} registrada!`, 'success')

    // Confetti when concluding final
    if (registrando.fase === 'final') {
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: state.times.map(t => t.cor) })
      }, 200)
    }
    setRegistrando(null)
  }

  const handleDesfazer = (partida) => {
    dispatch({ type: 'DESFAZER_PARTIDA', payload: { modalidadeId, partidaId: partida.id } })
    toast('Partida desfeita', 'info')
    setConfirmDesfazer(null)
  }

  const toggleFase = (fase) => setFasesExpandidas(f => ({ ...f, [fase]: !f[fase] }))

  const statusLabel = modalidade.status === 'pendente' ? 'Pendente'
    : modalidade.status === 'em_andamento' ? 'Em andamento'
    : 'Concluída'

  const statusColor = modalidade.status === 'pendente' ? 'text-gray-400 bg-gray-500/20'
    : modalidade.status === 'em_andamento' ? 'text-blue-300 bg-blue-500/20'
    : 'text-green-300 bg-green-500/20'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative w-full sm:max-w-lg bg-gray-900 border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{modalidade.nome}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <CategoryBadge categoria={modalidade.categoria} />
              {modalidade.formato && (
                <span className="text-xs text-gray-500">{FORMATO_LABELS[modalidade.formato]}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Escalação */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-300">Escalação</p>
            </div>
            <div className="space-y-2">
              {state.times.map(time => {
                const escalados = (modalidade.escalacao[time.id] || [])
                  .map(id => state.participantes.find(p => p.id === id)?.nome)
                  .filter(Boolean)
                return (
                  <div key={time.id} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: time.cor }} />
                    <div>
                      <span className="text-xs font-medium" style={{ color: time.cor }}>{time.nome}:</span>
                      <span className="text-xs text-gray-400 ml-1">
                        {escalados.length > 0 ? escalados.join(', ') : <em>Sem escalação</em>}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Partidas por fase */}
          {fasesPresentes.length > 0 && (
            <div className="space-y-3">
              {fasesPresentes.map(fase => {
                const ps = partidas.filter(p => p.fase === fase)
                const concluidas = ps.filter(p => p.status === 'concluida').length
                const expandido = fasesExpandidas[fase] !== false
                return (
                  <div key={fase} className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFase(fase)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{FASE_LABELS[fase]}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${concluidas === ps.length ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {concluidas}/{ps.length}
                        </span>
                      </div>
                      {expandido ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    <AnimatePresence>
                      {expandido && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-2">
                            {ps.map(partida => {
                              const nomeA = nomePartic(partida.participanteA)
                              const nomeB = nomePartic(partida.participanteB)
                              const corA = corTime(partida.participanteA.timeId)
                              const corB = corTime(partida.participanteB.timeId)
                              const concluida = partida.status === 'concluida'

                              return (
                                <div key={partida.id} className={`rounded-xl p-3 border ${concluida ? 'border-white/10 bg-white/3' : 'border-indigo-500/20 bg-indigo-500/5'}`}>
                                  <div className="flex items-center gap-2">
                                    {/* Participante A */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: corA }} />
                                        <span className={`text-xs font-medium truncate ${concluida && partida.vencedor === partida.participanteA.timeId ? 'text-white' : 'text-gray-300'}`}>{nomeA}</span>
                                      </div>
                                    </div>

                                    {/* Placar ou botão */}
                                    <div className="shrink-0 flex items-center gap-2">
                                      {concluida ? (
                                        <>
                                          {modalidade.configuracao?.semPlacar ? (
                                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/10 text-white">
                                              {partida.vencedor === partida.participanteA.timeId ? nomeA : nomeB} vence
                                            </span>
                                          ) : (
                                            <span className="text-sm font-bold text-white tabular-nums">
                                              {partida.placar.a ?? '–'} × {partida.placar.b ?? '–'}
                                            </span>
                                          )}
                                          <button
                                            onClick={() => setConfirmDesfazer(partida)}
                                            className="p-1 rounded-lg hover:bg-orange-500/20 text-gray-500 hover:text-orange-400 transition-colors"
                                            title="Desfazer"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => setRegistrando(partida)}
                                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
                                        >
                                          Registrar
                                        </button>
                                      )}
                                    </div>

                                    {/* Participante B */}
                                    <div className="flex-1 min-w-0 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className={`text-xs font-medium truncate ${concluida && partida.vencedor === partida.participanteB.timeId ? 'text-white' : 'text-gray-300'}`}>{nomeB}</span>
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: corB }} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Indicador de vencedor */}
                                  {concluida && partida.vencedor && (
                                    <div className="mt-2 flex items-center gap-1.5">
                                      <Trophy className="w-3 h-3 text-yellow-400" />
                                      <span className="text-xs text-gray-400">
                                        {partida.vencedor === partida.participanteA.timeId ? nomeA : nomeB}
                                        {partida.fase !== 'grupos' && partida.fase !== 'terceiro_lugar' ? ' avança' : ''}
                                      </span>
                                    </div>
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
              })}
            </div>
          )}

          {/* Resultado final */}
          {modalidade.status === 'concluida' && modalidade.resultado && (
            <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" /> Resultado final
              </p>
              <div className="space-y-2">
                {[...modalidade.resultado]
                  .sort((a, b) => a.posicao - b.posicao)
                  .map(r => {
                    const time = state.times.find(t => t.id === r.timeId)
                    if (!time) return null
                    const medal = r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : `${r.posicao}º`
                    return (
                      <div key={r.timeId} className="flex items-center gap-2">
                        <span className="text-sm w-7">{medal}</span>
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: time.cor }} />
                        <span className="text-sm text-gray-200 flex-1">{time.nome}</span>
                        <span className="text-sm font-bold" style={{ color: time.cor }}>+{r.pontos}pts</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {partidas.length === 0 && modalidade.status !== 'concluida' && (
            <p className="text-sm text-gray-500 italic text-center py-4">Gerando partidas...</p>
          )}
        </div>
      </motion.div>

      {/* Mini-modal de placar */}
      <AnimatePresence>
        {registrando && (
          <PlacarModal
            partida={registrando}
            modalidade={modalidade}
            onClose={() => setRegistrando(null)}
            onConfirm={handleRegistrar}
          />
        )}
      </AnimatePresence>

      {/* Confirm desfazer partida */}
      <ConfirmModal
        open={!!confirmDesfazer}
        onClose={() => setConfirmDesfazer(null)}
        onConfirm={() => handleDesfazer(confirmDesfazer)}
        title="Desfazer partida"
        message="O resultado desta partida será removido. Partidas geradas a partir dela também serão descartadas."
        confirmLabel="Desfazer"
        danger
      />
    </div>
  )
}
