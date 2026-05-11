import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useStore, calcularPontos } from '../../store/useStore'
import { useToast } from '../common/Toast'
import Modal from '../common/Modal'
import CategoryBadge from '../common/CategoryBadge'

function DuelResult({ modalidade, times, resultado, setResultado }) {
  const [vencedor, setVencedor] = useState(resultado?.[0]?.posicao === 1 ? resultado[0].timeId : null)
  const [empate, setEmpate] = useState(resultado?.length === 2 && resultado[0].posicao === resultado[1].posicao)

  useEffect(() => {
    if (empate) {
      setResultado([{ posicao: 1, timeId: times[0].id }, { posicao: 1, timeId: times[1].id }])
    } else if (vencedor) {
      const perdedor = times.find(t => t.id !== vencedor)
      setResultado([{ posicao: 1, timeId: vencedor }, { posicao: 2, timeId: perdedor?.id }])
    } else {
      setResultado(null)
    }
  }, [vencedor, empate])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {times.map(time => (
          <button
            key={time.id}
            onClick={() => { setEmpate(false); setVencedor(time.id) }}
            style={{ borderColor: vencedor === time.id && !empate ? time.cor : 'transparent' }}
            className={`p-4 rounded-xl border-2 transition-all ${vencedor === time.id && !empate ? 'bg-white/10' : 'bg-white/5 border-white/10'}`}
          >
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ background: time.cor }} />
            <p className="text-sm font-semibold text-white text-center">{time.nome}</p>
            {vencedor === time.id && !empate && <p className="text-xs text-green-400 text-center mt-1">🏆 Vencedor</p>}
          </button>
        ))}
      </div>
      <button
        onClick={() => { setEmpate(v => !v); setVencedor(null) }}
        className={`w-full py-2 rounded-xl border text-sm font-medium transition-colors ${empate ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <Minus className="w-4 h-4 inline mr-1" /> Empate
      </button>
    </div>
  )
}

function AllVsAllResult({ modalidade, times, resultado, setResultado }) {
  const [posicoes, setPosicoes] = useState(() => {
    if (resultado) {
      const map = {}
      resultado.forEach(r => { map[r.timeId] = r.posicao })
      return map
    }
    const map = {}
    times.forEach((t, i) => { map[t.id] = i + 1 })
    return map
  })

  useEffect(() => {
    const allSet = times.every(t => posicoes[t.id] !== undefined)
    if (allSet) {
      setResultado(times.map(t => ({ posicao: posicoes[t.id], timeId: t.id })))
    }
  }, [posicoes])

  const maxPos = times.length

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-3">Defina a posição de cada time. Times na mesma posição ficam empatados.</p>
      {times.map(time => (
        <div key={time.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: time.cor }} />
          <span className="text-sm font-medium flex-1" style={{ color: time.cor }}>{time.nome}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPosicoes(p => ({ ...p, [time.id]: Math.max(1, (p[time.id] || 1) - 1) }))}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <span className="text-lg font-bold w-6 text-center">{posicoes[time.id] || 1}º</span>
            <button
              onClick={() => setPosicoes(p => ({ ...p, [time.id]: Math.min(maxPos, (p[time.id] || 1) + 1) }))}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RegisterResult({ open, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [resultado, setResultado] = useState(null)

  const proxima = state.modalidades
    .filter(m => m.status === 'pendente')
    .sort((a, b) => a.ordem - b.ordem)[0]

  useEffect(() => { if (open) setResultado(null) }, [open])

  if (!proxima) return null

  const timesParticipantes = proxima.tipo === 'duelo' ? state.times.slice(0, 2) : state.times

  const pontuacaoPreview = resultado
    ? calcularPontos(proxima, resultado)
    : []

  const handleConfirmar = () => {
    if (!resultado) { toast('Defina o resultado primeiro', 'warning'); return }
    const pontuados = calcularPontos(proxima, resultado)
    dispatch({ type: 'REGISTRAR_RESULTADO', payload: { modalidadeId: proxima.id, resultado: pontuados } })
    toast(`${proxima.nome} concluída!`, 'success')
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: state.times.map(t => t.cor),
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Resultado: ${proxima.nome}`} size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <CategoryBadge categoria={proxima.categoria} especial={proxima.especial} />
          <span className="text-xs text-gray-400">{proxima.tipo === 'duelo' ? 'Duelo' : 'Todos contra todos'}</span>
        </div>

        {proxima.tipo === 'duelo'
          ? <DuelResult modalidade={proxima} times={timesParticipantes} resultado={resultado} setResultado={setResultado} />
          : <AllVsAllResult modalidade={proxima} times={timesParticipantes} resultado={resultado} setResultado={setResultado} />
        }

        {pontuacaoPreview.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Preview de pontos</p>
            <div className="space-y-2">
              {[...pontuacaoPreview].sort((a, b) => a.posicao - b.posicao).map(r => {
                const time = state.times.find(t => t.id === r.timeId)
                if (!time) return null
                return (
                  <div key={r.timeId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: time.cor }} />
                      <span className="text-sm text-gray-300">{time.nome}</span>
                      <span className="text-xs text-gray-500">{r.posicao}º lugar</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: time.cor }}>+{r.pontos}pts</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirmar}
          disabled={!resultado}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
        >
          <CheckCircle className="w-5 h-5" /> Confirmar Resultado
        </button>
      </div>
    </Modal>
  )
}
