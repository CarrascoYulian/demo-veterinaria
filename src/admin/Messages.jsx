import { ChevronRight, Inbox, Mail, MessageCircle } from 'lucide-react'
import { useStore } from '../store.jsx'
import { TEMPLATE_LABELS } from '../lib/notify.js'
import { EmptyState } from '../components/ui.jsx'

const fmt = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santo_Domingo' })

export default function Messages() {
  const { data, setPreview } = useStore()
  const msgs = data.messages
  if (!msgs.length)
    return (
      <div className="card">
        <EmptyState icon={Inbox} title="Todavía no hay mensajes" text="Las confirmaciones y recordatorios que se envíen aparecerán aquí." />
      </div>
    )
  return (
    <div className="card overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {msgs.map((m) => {
          const wa = m.channel === 'whatsapp'
          const Icon = wa ? MessageCircle : Mail
          return (
            <li key={m.id}>
              <button type="button" onClick={() => setPreview([m])} className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 sm:px-5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${wa ? 'bg-[#25D366]/15 text-[#128C7E]' : 'bg-sky-100 text-sky-700'}`}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {TEMPLATE_LABELS[m.template]} <span className="font-mono text-xs font-medium text-slate-400">{m.code}</span>
                  </p>
                  <p className="truncate text-sm text-slate-500">{m.body || m.subject}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="tabular text-xs text-slate-500">{fmt.format(new Date(m.at))}</p>
                  <p className="text-xs text-slate-400">{m.to || '—'}</p>
                </div>
                <span className={`chip hidden md:inline-flex ${m.status === 'entregado' ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-slate-500/20'}`}>
                  {m.status === 'entregado' ? 'Entregado' : m.status}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
