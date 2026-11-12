import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useStore, useLookups } from '../store.jsx'
import { STATUSES } from '../lib/appointments.js'
import { StatusBadge } from '../components/ui.jsx'
import { formatDateShort, formatTime } from '../lib/time.js'

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function ListView({ onOpen }) {
  const { config, data } = useStore()
  const { serviceName, proName } = useLookups()
  const [f, setF] = useState({ from: '', to: '', pro: 'all', service: 'all', status: 'all', q: '' })
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const rows = useMemo(() => {
    const q = norm(f.q.trim())
    return data.appointments
      .filter((a) => (!f.from || a.date >= f.from) && (!f.to || a.date <= f.to))
      .filter((a) => f.pro === 'all' || a.professionalId === f.pro)
      .filter((a) => f.service === 'all' || a.serviceId === f.service)
      .filter((a) => f.status === 'all' || a.status === f.status)
      .filter((a) => !q || norm(a.ownerName).includes(q) || norm(a.petName).includes(q) || norm(a.code).includes(q))
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  }, [data.appointments, f])

  const hasFilters = f.from || f.to || f.pro !== 'all' || f.service !== 'all' || f.status !== 'all' || f.q

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor="l-q" className="label">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="l-q" className="input pl-10" type="search" placeholder="Dueño, mascota o código" value={f.q} onChange={set('q')} />
          </div>
        </div>
        <div>
          <label htmlFor="l-from" className="label">
            Desde
          </label>
          <input id="l-from" type="date" className="input" value={f.from} onChange={set('from')} />
        </div>
        <div>
          <label htmlFor="l-to" className="label">
            Hasta
          </label>
          <input id="l-to" type="date" className="input" value={f.to} onChange={set('to')} />
        </div>
        <div>
          <label htmlFor="l-pro" className="label">
            Profesional
          </label>
          <select id="l-pro" className="input" value={f.pro} onChange={set('pro')}>
            <option value="all">Todos</option>
            {config.professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="l-svc" className="label">
            Servicio
          </label>
          <select id="l-svc" className="input" value={f.service} onChange={set('service')}>
            <option value="all">Todos</option>
            {config.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-6">
          <span className="label">Estado</span>
          <div className="flex flex-wrap gap-2">
            {[['all', 'Todos'], ...Object.entries(STATUSES).map(([k, s]) => [k, s.label])].map(([k, l]) => (
              <button key={k} type="button" aria-pressed={f.status === k} onClick={() => setF((x) => ({ ...x, status: k }))} className={`rounded-full px-3 py-1 text-sm font-medium transition-colors duration-150 ${f.status === k ? 'bg-ink text-white' : 'bg-white text-slate-600 shadow-ring hover:text-ink'}`}>
                {l}
              </button>
            ))}
            {hasFilters && (
              <button type="button" className="ml-auto text-sm text-primary underline" onClick={() => setF({ from: '', to: '', pro: 'all', service: 'all', status: 'all', q: '' })}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500">{rows.length} citas</p>

      {/* Tabla en escritorio */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Código</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Mascota</th>
              <th className="px-5 py-3 font-medium">Dueño</th>
              <th className="px-5 py-3 font-medium">Servicio</th>
              <th className="px-5 py-3 font-medium">Profesional</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Recordatorio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((a) => (
              <tr key={a.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen(a.id)}>
                <td className="px-5 py-3.5">
                  <button type="button" className="font-mono font-semibold text-ink hover:underline" onClick={(e) => { e.stopPropagation(); onOpen(a.id) }}>
                    {a.code}
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatDateShort(a.date)} · {formatTime(a.start)}
                </td>
                <td className="px-5 py-3.5 font-medium">{a.petName}</td>
                <td className="px-5 py-3.5">{a.ownerName}</td>
                <td className="px-5 py-3.5">{serviceName(a.serviceId)}</td>
                <td className="px-5 py-3.5">{proName(a.professionalId)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-5 py-3.5 text-slate-500">{a.reminderSent ? "Enviado" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-slate-500">No hay citas con esos filtros.</p>}
      </div>

      {/* Tarjetas en celular */}
      <ul className="space-y-2 md:hidden">
        {rows.map((a) => (
          <li key={a.id}>
            <button type="button" onClick={() => onOpen(a.id)} className="card w-full p-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {a.petName} <span className="font-normal text-slate-500">· {a.ownerName}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatDateShort(a.date)} · {formatTime(a.start)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {serviceName(a.serviceId)} · {proName(a.professionalId)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-2 font-mono text-xs text-slate-400">
                {a.code} {a.reminderSent && '· recordatorio enviado'}
              </p>
            </button>
          </li>
        ))}
        {!rows.length && <p className="p-6 text-center text-slate-500">No hay citas con esos filtros.</p>}
      </ul>
    </div>
  )
}
