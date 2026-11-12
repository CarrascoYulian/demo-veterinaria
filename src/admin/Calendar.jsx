import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { useStore, useLookups } from '../store.jsx'
import { STATUSES } from '../lib/appointments.js'
import { worksOn } from '../lib/slots.js'
import { Avatar } from '../components/ui.jsx'
import { addDays, formatDateLong, formatDateTitle, formatDayName, formatDayNum, formatTime, fromMin, nowMin, todayISO, toMin, weekStart } from '../lib/time.js'

const PX_PER_MIN = 1.4

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
      {Object.entries(STATUSES).map(([k, s]) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
          {s.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <Lock className="h-3 w-3" aria-hidden="true" /> Bloqueo
      </span>
    </div>
  )
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-900/[0.05] p-1" role="group" aria-label={label}>
      {options.map(([k, l]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ${value === k ? 'bg-white text-ink shadow-card' : 'text-slate-500 hover:text-ink'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export default function Calendar({ onOpen }) {
  const { config } = useStore()
  const { serviceName, proName } = useLookups()
  const today = todayISO(config.timezone)
  const [mode, setMode] = useState('day')
  const [date, setDate] = useState(today)
  const [proFilter, setProFilter] = useState('all')
  const [showCancelled, setShowCancelled] = useState(false)

  const pros = proFilter === 'all' ? config.professionals : config.professionals.filter((p) => p.id === proFilter)
  const visible = (a) => (showCancelled || a.status !== 'cancelada') && pros.some((p) => p.id === a.professionalId)
  const step = mode === 'day' ? 1 : 7
  const ws = weekStart(date)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i))

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 sm:px-5">
        <div className="mr-auto flex items-center gap-2">
          <div className="flex items-center">
            <button type="button" className="btn-icon btn-ghost" onClick={() => setDate(addDays(date, -step))} aria-label="Anterior">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" className="btn-icon btn-ghost" onClick={() => setDate(addDays(date, step))} aria-label="Siguiente">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <h3 className="text-base font-semibold sm:text-lg">
            {mode === 'day' ? formatDateTitle(date) : `${formatDayNum(ws)} – ${formatDateLong(addDays(ws, 6)).split(', ')[1]}`}
          </h3>
          {date !== today && (
            <button type="button" className="btn-outline h-8 rounded-lg px-2.5 text-xs" onClick={() => setDate(today)}>
              Hoy
            </button>
          )}
        </div>
        <input type="date" className="input h-9 w-auto sm:h-9" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Ir a fecha" />
        <select className="input h-9 w-auto pr-8 sm:h-9" value={proFilter} onChange={(e) => setProFilter(e.target.value)} aria-label="Profesional">
          <option value="all">Todos los profesionales</option>
          {config.professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Segmented
          value={mode}
          onChange={setMode}
          label="Vista"
          options={[
            ['day', 'Día'],
            ['week', 'Semana'],
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Legend />
        <label className="inline-flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="h-4 w-4 rounded accent-[rgb(var(--c-primary))]" />
          Mostrar canceladas
        </label>
      </div>

      {mode === 'day' ? (
        <DayView date={date} today={today} pros={pros} visible={visible} onOpen={onOpen} serviceName={serviceName} />
      ) : (
        <WeekView
          days={weekDays}
          today={today}
          visible={visible}
          onOpen={onOpen}
          serviceName={serviceName}
          proName={proName}
          pros={pros}
          onPickDay={(d) => {
            setDate(d)
            setMode('day')
          }}
        />
      )}
    </div>
  )
}

function useNow(tz) {
  const [now, setNow] = useState(() => nowMin(tz))
  useEffect(() => {
    const id = setInterval(() => setNow(nowMin(tz)), 60_000)
    return () => clearInterval(id)
  }, [tz])
  return now
}

function DayView({ date, today, pros, visible, onOpen, serviceName }) {
  const { config, data } = useStore()
  const now = useNow(config.timezone)
  const { dayStart, dayEnd } = useMemo(() => {
    if (!pros.length) return { dayStart: 8 * 60, dayEnd: 18 * 60 }
    const s = Math.min(...pros.map((p) => toMin(p.startTime)))
    const e = Math.max(...pros.map((p) => toMin(p.endTime)))
    return { dayStart: Math.floor(s / 60) * 60, dayEnd: Math.ceil(e / 60) * 60 }
  }, [pros])
  const height = (dayEnd - dayStart) * PX_PER_MIN
  const y = (hhmm) => (toMin(hhmm) - dayStart) * PX_PER_MIN
  const hours = []
  for (let m = dayStart; m <= dayEnd; m += 60) hours.push(m)
  const showNow = date === today && now >= dayStart && now <= dayEnd

  if (!pros.length) return <p className="p-6 text-slate-500">No hay profesionales configurados.</p>

  return (
    <div className="overflow-x-auto border-t border-slate-100">
      <div className="grid min-w-full" style={{ gridTemplateColumns: `60px repeat(${pros.length}, minmax(180px, 1fr))` }}>
        <div className="sticky left-0 z-10 border-b border-slate-100 bg-white" />
        {pros.map((p) => (
          <div key={p.id} className="flex items-center gap-2.5 border-b border-l border-slate-100 px-3 py-3">
            <Avatar name={p.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="tabular truncate text-xs text-slate-500">{worksOn(p, date) ? `${formatTime(p.startTime)} – ${formatTime(p.endTime)}` : 'No labora este día'}</p>
            </div>
          </div>
        ))}

        <div className="sticky left-0 z-10 bg-white" style={{ height }}>
          {hours.map((m) => (
            <span key={m} className="tabular absolute right-3 -translate-y-1/2 text-[11px] text-slate-400" style={{ top: (m - dayStart) * PX_PER_MIN }}>
              {formatTime(fromMin(m)).replace(':00', '')}
            </span>
          ))}
        </div>

        {pros.map((p) => {
          const works = worksOn(p, date)
          const appts = data.appointments.filter((a) => a.professionalId === p.id && a.date === date && visible(a))
          const blocks = data.blocks.filter((b) => b.professionalId === p.id && b.date === date)
          return (
            <div key={p.id} className="relative border-l border-slate-100" style={{ height }}>
              {hours.map((m) => (
                <div key={m} className="absolute inset-x-0 border-t border-slate-100" style={{ top: (m - dayStart) * PX_PER_MIN }} />
              ))}
              {!works ? (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,rgb(15_23_42/0.04)_7px,rgb(15_23_42/0.04)_8px)]" />
              ) : (
                <>
                  {toMin(p.startTime) > dayStart && <div className="absolute inset-x-0 top-0 bg-slate-50" style={{ height: y(p.startTime) }} />}
                  {toMin(p.endTime) < dayEnd && <div className="absolute inset-x-0 bottom-0 bg-slate-50" style={{ top: y(p.endTime) }} />}
                  {p.lunchStart && p.lunchEnd && (
                    <div
                      className="absolute inset-x-1.5 flex items-center justify-center rounded-lg bg-slate-100/80 text-[11px] font-medium text-slate-400"
                      style={{ top: y(p.lunchStart) + 1, height: (toMin(p.lunchEnd) - toMin(p.lunchStart)) * PX_PER_MIN - 2 }}
                    >
                      Almuerzo
                    </div>
                  )}
                </>
              )}
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="absolute inset-x-1.5 flex items-start gap-1.5 overflow-hidden rounded-lg bg-[repeating-linear-gradient(135deg,rgb(241_245_249),rgb(241_245_249)_6px,rgb(226_232_240)_6px,rgb(226_232_240)_7px)] px-2 py-1.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-300"
                  style={{ top: y(b.start) + 1, height: (toMin(b.end) - toMin(b.start)) * PX_PER_MIN - 2 }}
                  title={`Bloqueado: ${b.reason}`}
                >
                  <Lock className="mt-px h-3 w-3 shrink-0" aria-hidden="true" /> {b.reason}
                </div>
              ))}
              {appts.map((a) => {
                const h = Math.max((toMin(a.end) - toMin(a.start)) * PX_PER_MIN - 2, 22)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onOpen(a.id)}
                    className={`absolute inset-x-1.5 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left text-xs shadow-sm transition-[transform,box-shadow] duration-150 ease-out hover:z-10 hover:shadow-lift active:scale-[0.98] ${STATUSES[a.status].block}`}
                    style={{ top: y(a.start) + 1, height: h }}
                    aria-label={`${formatTime(a.start)} ${a.petName}, ${serviceName(a.serviceId)}, ${STATUSES[a.status].label}`}
                  >
                    <span className={`block truncate font-semibold ${a.status === 'cancelada' ? 'line-through' : ''}`}>
                      {a.petName} <span className="tabular font-normal opacity-70">{formatTime(a.start)}</span>
                    </span>
                    {h > 34 && <span className="block truncate opacity-75">{serviceName(a.serviceId)} · {a.ownerName}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}

        {showNow && (
          <div className="pointer-events-none relative col-span-full" style={{ marginTop: -height, height }} aria-hidden="true">
            <div className="absolute left-[52px] right-0 flex items-center" style={{ top: (now - dayStart) * PX_PER_MIN }}>
              <span className="h-2 w-2 -translate-x-1 rounded-full bg-red-500" />
              <span className="h-px flex-1 bg-red-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function WeekView({ days, today, visible, onOpen, serviceName, proName, pros, onPickDay }) {
  const { data } = useStore()
  return (
    <div className="overflow-x-auto border-t border-slate-100">
      <div className="grid min-w-[980px] grid-cols-7 divide-x divide-slate-100">
        {days.map((d) => {
          const appts = data.appointments.filter((a) => a.date === d && visible(a)).sort((a, b) => a.start.localeCompare(b.start))
          const blocks = data.blocks.filter((b) => b.date === d && pros.some((p) => p.id === b.professionalId))
          const isToday = d === today
          return (
            <div key={d} className="min-h-[360px]">
              <button type="button" onClick={() => onPickDay(d)} className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-3 text-left transition-colors hover:bg-slate-50">
                <span className="text-xs font-medium uppercase text-slate-400">{formatDayName(d)}</span>
                <span className={`tabular flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-primary text-onprimary' : ''}`}>{formatDayNum(d)}</span>
                <span className="tabular ml-auto text-xs text-slate-400">{appts.length || ''}</span>
              </button>
              <div className="space-y-1.5 p-2">
                {blocks.map((b) => (
                  <div key={b.id} className="flex items-start gap-1.5 rounded-lg bg-slate-100 px-2 py-1.5 text-[11px] text-slate-600">
                    <Lock className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="tabular">{formatTime(b.start)}</span> {b.reason}
                      {pros.length > 1 && <span className="block truncate opacity-70">{proName(b.professionalId)}</span>}
                    </span>
                  </div>
                ))}
                {appts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onOpen(a.id)}
                    className={`block w-full rounded-lg border-l-[3px] px-2 py-1.5 text-left text-[11px] transition-[transform,box-shadow] duration-150 ease-out hover:shadow-lift active:scale-[0.98] ${STATUSES[a.status].block}`}
                  >
                    <span className={`block truncate font-semibold ${a.status === 'cancelada' ? 'line-through' : ''}`}>
                      <span className="tabular">{formatTime(a.start)}</span> {a.petName}
                    </span>
                    <span className="block truncate opacity-75">{serviceName(a.serviceId)}</span>
                    {pros.length > 1 && <span className="block truncate opacity-60">{proName(a.professionalId)}</span>}
                  </button>
                ))}
                {!appts.length && !blocks.length && <p className="px-1 py-3 text-center text-xs text-slate-300">Sin citas</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
