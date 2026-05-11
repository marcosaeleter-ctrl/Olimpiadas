import { Dumbbell, Zap, Grid3X3, Star } from 'lucide-react'

const config = {
  'Esporte': { icon: Dumbbell, bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  'Prova Física': { icon: Zap, bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  'Jogo de Mesa': { icon: Grid3X3, bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
}

export default function CategoryBadge({ categoria, especial }) {
  const c = config[categoria] || config['Esporte']
  const Icon = c.icon
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
        <Icon className="w-3 h-3" />
        {categoria}
      </span>
      {especial && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
          <Star className="w-3 h-3" />
          Especial
        </span>
      )}
    </div>
  )
}
