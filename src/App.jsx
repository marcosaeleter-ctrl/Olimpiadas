import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Play, Trophy, ChevronRight, Flag, Swords, Medal,
  AlertCircle, RotateCcw, PlayCircle
} from 'lucide-react'
import { StoreProvider, useStore } from './store/useStore'
import { ToastProvider, useToast } from './components/common/Toast'
import { ConfirmModal } from './components/common/Modal'

// Phase 1
import EventConfig from './components/Phase1/EventConfig'
import ParticipantManager from './components/Phase1/ParticipantManager'
import TeamCreator from './components/Phase1/TeamCreator'
import ModalityManager from './components/Phase1/ModalityManager'
import PlayerAssignment from './components/Phase1/PlayerAssignment'

// Phase 2
import Scoreboard from './components/Phase2/Scoreboard'
import UpcomingModalities from './components/Phase2/UpcomingModalities'
import HistoryList from './components/Phase2/HistoryList'
import RegisterResult from './components/Phase2/RegisterResult'

// Phase 3
import Podium from './components/Phase3/Podium'

// ── Status bar ─────────────────────────────────────────────────────────────────
function StatusBar({ status }) {
  const phases = [
    { key: 'configuracao', label: 'Configuração', icon: Settings },
    { key: 'ao_vivo', label: 'Ao Vivo', icon: Play },
    { key: 'encerrado', label: 'Encerrado', icon: Trophy },
  ]
  const currentIdx = phases.findIndex(p => p.key === status)

  return (
    <div className="flex items-center gap-1">
      {phases.map((phase, idx) => {
        const Icon = phase.icon
        const active = phase.key === status
        const done = idx < currentIdx
        return (
          <div key={phase.key} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              active ? 'bg-indigo-600 text-white' : done ? 'bg-green-600/30 text-green-400' : 'bg-white/5 text-gray-500'
            }`}>
              <Icon className="w-3.5 h-3.5" />
              {phase.label}
            </div>
            {idx < 2 && <ChevronRight className="w-3 h-3 text-gray-600 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

// ── Validation helper ──────────────────────────────────────────────────────────
function validarEvento(state) {
  const erros = []
  if (!state.evento.nome.trim()) erros.push('Defina o nome do evento')
  if (state.times.length < 2) erros.push('Crie ao menos 2 times')
  if (state.modalidades.length === 0) erros.push('Cadastre ao menos 1 modalidade')
  state.times.forEach(t => {
    if (!t.nome.trim()) erros.push(`Time sem nome`)
    if (!t.cor) erros.push(`${t.nome} sem cor`)
  })
  const nomes = state.times.map(t => t.nome.trim().toLowerCase())
  if (new Set(nomes).size !== nomes.length) erros.push('Times com nomes duplicados')
  state.modalidades.forEach(m => {
    const timesParticipantes = m.tipo === 'duelo' ? state.times.slice(0, 2) : state.times
    const incompleto = timesParticipantes.some(t => {
      const esc = m.escalacao[t.id] || []
      return esc.length === 0 || esc.some(id => !id)
    })
    if (incompleto) erros.push(`Escalação incompleta em "${m.nome}"`)
  })
  return erros
}

// ── Phase 1 view ───────────────────────────────────────────────────────────────
function Phase1View() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [confirmStart, setConfirmStart] = useState(false)

  const erros = validarEvento(state)
  const podeIniciar = erros.length === 0

  const iniciarEvento = () => {
    dispatch({ type: 'SET_STATUS', payload: 'ao_vivo' })
    toast('Evento iniciado! Boa sorte a todos!', 'success', 5000)
  }

  return (
    <div className="space-y-6 pb-24">
      <EventConfig />
      <ParticipantManager />
      <TeamCreator />
      <ModalityManager />
      <PlayerAssignment />

      {/* Start button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950 to-transparent">
        <div className="max-w-3xl mx-auto">
          {!podeIniciar && erros.length > 0 && (
            <div className="mb-3 bg-red-950/80 border border-red-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs font-semibold text-red-400">Pendências</span>
              </div>
              <ul className="space-y-0.5">
                {erros.slice(0, 3).map((e, i) => <li key={i} className="text-xs text-red-300">• {e}</li>)}
                {erros.length > 3 && <li className="text-xs text-red-400">e mais {erros.length - 3}...</li>}
              </ul>
            </div>
          )}
          <button
            onClick={() => podeIniciar && setConfirmStart(true)}
            disabled={!podeIniciar}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-900/50"
          >
            <PlayCircle className="w-6 h-6" /> Iniciar Evento
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={iniciarEvento}
        title="Iniciar o evento"
        message="Após iniciar, as configurações ficarão travadas. Deseja continuar?"
        confirmLabel="Iniciar"
      />
    </div>
  )
}

// ── Phase 2 view ───────────────────────────────────────────────────────────────
function Phase2View() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [showRegister, setShowRegister] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const pendentes = state.modalidades.filter(m => m.status === 'pendente')
  const todasConcluidas = pendentes.length === 0

  const encerrarEvento = () => {
    dispatch({ type: 'SET_STATUS', payload: 'encerrado' })
    toast('Evento encerrado! Confira o pódio!', 'success', 5000)
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Config read-only toggle */}
      <button
        onClick={() => setShowConfig(v => !v)}
        className="w-full flex items-center gap-2 py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
      >
        <Settings className="w-4 h-4" />
        {showConfig ? 'Ocultar configurações' : 'Ver configurações (somente leitura)'}
      </button>

      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="space-y-4 pointer-events-none opacity-60">
              <TeamCreator />
              <ModalityManager />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Scoreboard />
      <UpcomingModalities />
      <HistoryList />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950 to-transparent">
        <div className="max-w-3xl mx-auto flex gap-3">
          {!todasConcluidas && (
            <button
              onClick={() => setShowRegister(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-900/50 transition-all"
            >
              <Swords className="w-6 h-6" /> Registrar Resultado
            </button>
          )}
          <button
            onClick={() => setConfirmEnd(true)}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${todasConcluidas ? 'flex-1 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg' : 'px-6 bg-white/10 hover:bg-white/20 text-sm'}`}
          >
            <Flag className={todasConcluidas ? 'w-6 h-6' : 'w-4 h-4'} /> Encerrar
          </button>
        </div>
      </div>

      <RegisterResult open={showRegister} onClose={() => setShowRegister(false)} />

      <ConfirmModal
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        onConfirm={encerrarEvento}
        title="Encerrar evento"
        message={todasConcluidas ? 'Todas as modalidades foram concluídas. Ir para o pódio?' : `Ainda há ${pendentes.length} modalidade${pendentes.length > 1 ? 's' : ''} pendente${pendentes.length > 1 ? 's' : ''}. Deseja encerrar mesmo assim?`}
        confirmLabel="Encerrar"
        danger={!todasConcluidas}
      />
    </div>
  )
}

// ── Phase 3 view ───────────────────────────────────────────────────────────────
function Phase3View() {
  const { dispatch } = useStore()
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)

  const reset = () => {
    dispatch({ type: 'RESET' })
    toast('Evento resetado. Pronto para uma nova olimpíada!', 'info')
  }

  return (
    <div className="space-y-6 pb-20">
      <Podium />
      <button
        onClick={() => setConfirmReset(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Novo Evento
      </button>
      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        title="Novo evento"
        message="Isso apagará todos os dados do evento atual. Tem certeza?"
        confirmLabel="Apagar e Reiniciar"
        danger
      />
    </div>
  )
}

// ── Root app ───────────────────────────────────────────────────────────────────
function AppInner() {
  const { state } = useStore()
  const { status } = state.evento

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-950/80 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏅</span>
            <div>
              <h1 className="text-base font-black text-white leading-none">
                {state.evento.nome || 'Olimpíadas dos Amigos'}
              </h1>
              <p className="text-xs text-gray-500">Gerenciador de olimpíadas</p>
            </div>
          </div>
          <StatusBar status={status} />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {status === 'configuracao' && (
            <motion.div key="fase1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Phase1View />
            </motion.div>
          )}
          {status === 'ao_vivo' && (
            <motion.div key="fase2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Phase2View />
            </motion.div>
          )}
          {status === 'encerrado' && (
            <motion.div key="fase3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Phase3View />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </StoreProvider>
  )
}
