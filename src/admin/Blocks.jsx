import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useStore, useLookups } from '../store.jsx'
import { Field } from '../components/ui.jsx'
import { formatDateShort, formatTime, todayISO, toMin } from '../lib/time.js'
import { worksOn } from '../lib/slots.js'

const REASONS = ['Almuerzo', 'Emergencia', 'Feriado', 'Reunión', 'Otro']

export default function Blocks() {
  const { config, data, addBlock, removeBlock } = useStore()
  const { proName } = useLookups()
  const today = todayISO(config.timezone)
  const [f, setF] = useState({ professionalId: config.professionals[0]?.id || '', date: today, start: '10:00', end: '11:00', reason: 'Emergencia', other: '' })
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const set = (k) => (e) => {
    setF((x) => ({ ...x, [k]: e.target.value }))
    setError('')
    setWarning('')
  }

  function submit(e) {
    e.preventDefault()
    if (toMin(f.end) <= toMin(f.start)) return setError('La hora final debe ser después de la hora de inicio.')
    const reason = f.reason === 'Otro' ? f.other.trim() || 'Otro' : f.reason
    const overlapping = data.appointments.filter(
      (a) => a.professionalId === f.professionalId && a.date === f.date && a.status !== 'cancelada' && toMin(a.start) < toMin(f.end) && toMin(a.end) > toMin(f.start),
    )
    addBlock({ professionalId: f.professionalId, date: f.date, start: f.start, end: f.end, reason })
    setWarning(
      overlapping.length
        ? `Bloqueo creado. Ojo: hay ${overlapping.length} cita(s) en ese rango (${overlapping.map((a) => a.petName).join(', ')}). Conviene reprogramarlas.`
        : 'Bloqueo creado. Ese rango ya no aparece en las reservas.',
    )
  }

  const pro = config.professionals.find((p) => p.id === f.professionalId)
  const upcoming = [...data.blocks].filter((b) => b.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form onSubmit={submit} className="card space-y-4 p-5" noValidate>
        <h3 className="font-semibold">Nuevo bloqueo</h3>
        <Field label="Profesional" htmlFor="b-pro">
          <select id="b-pro" className="input" value={f.professionalId} onChange={set('professionalId')}>
            {config.professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha" htmlFor="b-date" hint={pro && !worksOn(pro, f.date) ? 'Este profesional no labora ese día.' : undefined}>
          <input id="b-date" type="date" className="input" min={today} value={f.date} onChange={set('date')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde" htmlFor="b-start">
            <input id="b-start" type="time" step={900} className="input" value={f.start} onChange={set('start')} />
          </Field>
          <Field label="Hasta" htmlFor="b-end">
            <input id="b-end" type="time" step={900} className="input" value={f.end} onChange={set('end')} />
          </Field>
        </div>
        <Field label="Motivo" htmlFor="b-reason">
          <select id="b-reason" className="input" value={f.reason} onChange={set('reason')}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        {f.reason === 'Otro' && (
          <Field label="Describa el motivo" htmlFor="b-other">
            <input id="b-other" className="input" value={f.other} onChange={set('other')} />
          </Field>
        )}
        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
        {warning && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
            {warning}
          </p>
        )}
        <button type="submit" className="btn-primary w-full">
          Bloquear horario
        </button>
      </form>

      <div className="card p-5">
        <h3 className="mb-3 font-semibold">Próximos bloqueos</h3>
        {upcoming.length ? (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">
                    <Lock className="mr-1 inline h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{b.reason} · <span className="">{formatDateShort(b.date)}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatTime(b.start)} – {formatTime(b.end)} · {proName(b.professionalId)}
                  </p>
                </div>
                <button type="button" className="btn-ghost text-red-700 hover:bg-red-50" onClick={() => removeBlock(b.id)} aria-label={`Quitar bloqueo ${b.reason} del ${b.date}`}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No hay bloqueos programados.</p>
        )}
      </div>
    </div>
  )
}
