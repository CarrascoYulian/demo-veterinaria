import { CheckCheck, Info, Mail, MessageCircle } from 'lucide-react'
import { NOTES, TEMPLATE_LABELS } from '../lib/notify.js'
import { useStore } from '../store.jsx'
import { Logo } from './ui.jsx'

const timeOf = (iso) => new Date(iso).toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Santo_Domingo' })

function WhatsAppBubble({ msg }) {
  const { config } = useStore()
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-slate-900/[0.06]">
      <div className="flex items-center gap-3 bg-[#008069] px-4 py-3 text-white">
        <Logo size="sm" onDark />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{config.clinicName}</p>
          <p className="truncate text-xs text-white/75">Cuenta de empresa · {msg.to || 'sin teléfono'}</p>
        </div>
        <MessageCircle className="h-4 w-4 text-white/70" aria-hidden="true" />
      </div>
      <div
        className="space-y-2 bg-[#EFEAE2] px-3 py-5"
        style={{ backgroundImage: 'radial-gradient(rgb(0 0 0 / 0.035) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
      >
        <div className="mx-auto w-fit rounded-lg bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 shadow-sm">{TEMPLATE_LABELS[msg.template]}</div>
        <div className="relative ml-auto max-w-[88%] animate-scale-in rounded-2xl rounded-tr-md bg-[#D9FDD3] px-3.5 py-2.5 text-[15px] leading-snug text-slate-900 shadow-sm [transform-origin:top_right]">
          <p className="whitespace-pre-line">{msg.body}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
            {timeOf(msg.at)} <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label="Entregado" />
          </p>
        </div>
      </div>
    </div>
  )
}

function EmailViewer({ msg }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-slate-900/[0.06]">
      <div className="space-y-1.5 border-b border-slate-100 px-5 py-4 text-sm">
        <div className="flex items-center gap-2 pb-1">
          <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <p className="font-semibold">{msg.subject}</p>
        </div>
        <p className="text-slate-600">
          <span className="text-slate-400">De </span>
          {msg.from} &lt;{msg.fromEmail}&gt;
        </p>
        <p className="text-slate-600">
          <span className="text-slate-400">Para </span>
          {msg.to || <em className="font-medium not-italic text-red-600">el cliente no dejó correo</em>}
        </p>
      </div>
      <div className="space-y-3 px-5 py-5 text-[15px] leading-relaxed text-slate-700">
        <div className="h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
        {msg.paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function MessageView({ msg, showNote = true }) {
  return (
    <div className="space-y-2.5">
      {msg.channel === 'whatsapp' ? <WhatsAppBubble msg={msg} /> : <EmailViewer msg={msg} />}
      {showNote && (
        <p className="flex items-start gap-1.5 text-xs text-slate-500">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {NOTES[msg.channel]}
        </p>
      )}
    </div>
  )
}
