import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  CalendarX2,
  Clock3,
  ExternalLink,
  Hourglass,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Send,
} from 'lucide-react'
import { useStore } from '../store.jsx'
import { BrandText, Logo } from '../components/ui.jsx'
import { KEYS, sessionGet, sessionSet } from '../lib/storage.js'
import { addDays, formatDateTitle, todayISO, weekStart } from '../lib/time.js'
import Calendar from './Calendar.jsx'
import ListView from './ListView.jsx'
import Blocks from './Blocks.jsx'
import Messages from './Messages.jsx'
import AppointmentDetail from './AppointmentDetail.jsx'

function PinGate({ onOk }) {
  const { config } = useStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  function submit(e) {
    e.preventDefault()
    if (pin === config.adminPin) onOk()
    else {
      setError('PIN incorrecto. Intente de nuevo.')
      setPin('')
    }
  }
  return (
    <main className="relative isolate flex min-h-[calc(100vh-36px)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" aria-hidden="true" />
      <div className="card w-full max-w-sm animate-scale-in p-8 text-center">
        <Logo size="lg" className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold">
          <BrandText field="clinicName" />
        </h1>
        <p className="mt-1 text-sm text-slate-500">Panel del personal</p>
        <form onSubmit={submit} className="mt-7 space-y-3 text-left">
          <label htmlFor="pin" className="label">
            PIN de acceso
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              className="input pl-10 text-lg tracking-[0.4em]"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError('')
              }}
              aria-invalid={!!error}
              aria-describedby="pin-help"
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <p id="pin-help" className="text-xs text-slate-500">
            {config.adminPin === '1234' ? 'PIN de demostración: 1234' : 'Use el PIN de demostración que le compartimos.'}
          </p>
          <button type="submit" className="btn-primary btn-lg w-full">
            Entrar
          </button>
        </form>
        <a href="#/" className="btn-ghost mt-4 h-9 text-slate-500">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a reservas
        </a>
      </div>
    </main>
  )
}

const TABS = [
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'list', label: 'Citas', icon: ListChecks },
  { id: 'blocks', label: 'Bloqueos', icon: Lock },
  { id: 'messages', label: 'Mensajes', icon: MessagesSquare },
]

export default function Admin() {
  const { config, data, regenerate, sendMessages } = useStore()
  const [authed, setAuthed] = useState(() => sessionGet(KEYS.admin) === '1')
  const [tab, setTab] = useState('calendar')
  const [openId, setOpenId] = useState(null)
  const [notice, setNotice] = useState('')
  const [spin, setSpin] = useState(0)

  const today = todayISO(config.timezone)
  const stats = useMemo(() => {
    const ws = weekStart(today)
    const we = addDays(ws, 6)
    const todays = data.appointments.filter((a) => a.date === today && a.status !== 'cancelada')
    return [
      { label: 'Citas de hoy', value: todays.length, hint: `${todays.filter((a) => a.status === 'confirmada').length} confirmadas`, icon: Clock3, tone: 'bg-primary/10 text-primary' },
      { label: 'Por confirmar', value: data.appointments.filter((a) => a.status === 'pendiente' && a.date >= today).length, hint: 'Desde hoy en adelante', icon: Hourglass, tone: 'bg-amber-100 text-amber-700' },
      { label: 'Canceladas', value: data.appointments.filter((a) => a.status === 'cancelada' && a.date >= ws && a.date <= we).length, hint: 'Esta semana', icon: CalendarX2, tone: 'bg-red-100 text-red-700' },
      { label: 'Recordatorios', value: data.messages.filter((m) => m.template === 'recordatorio').length, hint: 'Enviados en total', icon: BellRing, tone: 'bg-emerald-100 text-emerald-700' },
    ]
  }, [data, today])

  if (!authed)
    return (
      <PinGate
        onOk={() => {
          sessionSet(KEYS.admin, '1')
          setAuthed(true)
        }}
      />
    )

  function logout() {
    sessionSet(KEYS.admin, null)
    setAuthed(false)
    window.location.hash = '#/'
  }

  function onRegenerate() {
    if (!window.confirm('¿Regenerar la agenda con datos nuevos? Se borran las citas, bloqueos y mensajes actuales. La marca y los colores no cambian.')) return
    regenerate()
    setSpin((s) => s + 1)
    flash('Listo: la agenda tiene datos de prueba nuevos.')
  }

  function onTomorrowReminders() {
    if (config.notificationChannel === 'ninguno') return
    const tomorrow = addDays(today, 1)
    const list = data.appointments.filter((a) => a.date === tomorrow && (a.status === 'pendiente' || a.status === 'confirmada'))
    if (!list.length) {
      flash('No hay citas pendientes o confirmadas para mañana.')
      return
    }
    sendMessages(list, 'recordatorio')
  }

  function flash(text) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const channel = config.notificationChannel
  const channelOff = channel === 'ninguno'
  const ChannelIcon = channel === 'email' ? Mail : MessageCircle
  const current = TABS.find((t) => t.id === tab)

  return (
    <div className="lg:grid lg:min-h-[calc(100vh-36px)] lg:grid-cols-[248px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden border-r border-slate-900/[0.06] bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo size="md" />
          <div className="min-w-0">
            <BrandText field="clinicName" as="p" className="truncate text-sm font-semibold" />
            <p className="text-xs text-slate-500">Panel del personal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Secciones">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                tab === id ? 'bg-slate-900/[0.05] text-ink' : 'text-slate-500 hover:bg-slate-900/[0.03] hover:text-ink'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${tab === id ? 'text-primary' : ''}`} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-slate-100 p-3">
          <a href="#/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-900/[0.03] hover:text-ink">
            <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
            Ver página de reservas
          </a>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-900/[0.03] hover:text-ink">
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            Salir
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Barra superior (celular) */}
        <header className="sticky top-0 z-20 border-b border-slate-900/[0.06] bg-white/85 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Logo size="sm" />
            <BrandText field="clinicName" as="p" className="mr-auto min-w-0 truncate text-sm font-semibold" />
            <a href="#/" className="btn-icon btn-ghost" aria-label="Ver página de reservas">
              <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
            </a>
            <button type="button" className="btn-icon btn-ghost" onClick={logout} aria-label="Salir">
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Secciones">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${tab === id ? 'bg-ink text-white' : 'text-slate-500'}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{formatDateTitle(today)}</p>
              <h1 className="mt-0.5 text-2xl font-semibold sm:text-[28px]">{current.label}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-outline" onClick={onRegenerate}>
                <RefreshCw key={spin} className={`h-4 w-4 ${spin ? 'animate-[spin_600ms_cubic-bezier(0.23,1,0.32,1)_1]' : ''}`} aria-hidden="true" />
                Regenerar datos demo
              </button>
            </div>
          </div>

          {notice && (
            <p className="animate-fade-up rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/15" role="status">
              {notice}
            </p>
          )}

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Resumen">
            {stats.map((s, i) => (
              <div key={s.label} className="card animate-fade-up p-4 sm:p-5" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">{s.label}</p>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}>
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="tabular mt-2 text-3xl font-semibold tracking-tight">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.hint}</p>
              </div>
            ))}
          </section>

          <section className="card flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${channelOff ? 'bg-slate-100 text-slate-400' : channel === 'whatsapp' ? 'bg-[#25D366]/15 text-[#128C7E]' : 'bg-sky-100 text-sky-700'}`}>
                <ChannelIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">Recordatorios automáticos</p>
                <p className="text-sm text-slate-500">
                  {channelOff ? 'Canal no configurado' : `Por ${channel === 'whatsapp' ? 'WhatsApp' : 'correo'}, ${config.reminderHoursBefore} horas antes de cada cita.`}
                </p>
              </div>
            </div>
            <button type="button" className="btn-primary h-11" onClick={onTomorrowReminders} disabled={channelOff}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {channelOff ? 'Canal no configurado' : 'Simular envío de recordatorios de mañana'}
            </button>
          </section>

          <div key={tab} className="animate-fade-up">
            {tab === 'calendar' && <Calendar onOpen={setOpenId} />}
            {tab === 'list' && <ListView onOpen={setOpenId} />}
            {tab === 'blocks' && <Blocks />}
            {tab === 'messages' && <Messages />}
          </div>
        </main>
      </div>

      <AppointmentDetail id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />
    </div>
  )
}
