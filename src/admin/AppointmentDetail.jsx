import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, CircleCheck, PawPrint, Pencil, Send, UserX, XCircle } from 'lucide-react'
import { useStore, useLookups } from '../store.jsx'
import { Field, Modal, StatusBadge } from '../components/ui.jsx'
import { SPECIES_OPTIONS, isEmail, normalizePhone, petHistory, speciesLabel } from '../lib/appointments.js'
import { getSlots, professionalsForService } from '../lib/slots.js'
import { formatDateTitle, formatDateShort, formatTime, fromMin, todayISO, toMin } from '../lib/time.js'

export default function AppointmentDetail({ id, onClose, onOpen }) {
  const { data } = useStore()
  const appt = data.appointments.find((a) => a.id === id)
  const [mode, setMode] = useState('view')
  useEffect(() => setMode('view'), [id])

  const titles = { view: 'Detalle de la cita', edit: 'Editar datos', reschedule: 'Reprogramar cita', cancel: 'Cancelar cita' }
  return (
    <Modal open={!!appt} onClose={onClose} title={appt ? titles[mode] : ""} subtitle={appt ? `${appt.petName} · ${appt.code}` : ""} icon={PawPrint} size="lg">
      {appt && mode === 'view' && <View appt={appt} setMode={setMode} onOpen={onOpen} />}
      {appt && mode === 'edit' && <EditForm appt={appt} done={() => setMode('view')} />}
      {appt && mode === 'reschedule' && <Reschedule appt={appt} done={() => setMode('view')} />}
      {appt && mode === 'cancel' && <CancelForm appt={appt} done={() => setMode('view')} />}
    </Modal>
  )
}

function View({ appt, setMode, onOpen }) {
  const { config, data, updateAppointment, sendMessages } = useStore()
  const { serviceName, proName } = useLookups()
  const history = useMemo(() => petHistory(data.appointments, appt), [data.appointments, appt])
  const channelOff = config.notificationChannel === 'ninguno'
  const closed = appt.status === 'cancelada'
  const set = (status) => updateAppointment(appt.id, { status })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-900/5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-ring">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">{formatDateTitle(appt.date)}</p>
            <p className="tabular text-sm text-slate-500">
              {formatTime(appt.start)} – {formatTime(appt.end)} · {serviceName(appt.serviceId)} · {proName(appt.professionalId)}
            </p>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {closed && appt.cancelReason && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-800 ring-1 ring-inset ring-red-600/10">
          <strong className="font-semibold">Motivo de cancelación:</strong> {appt.cancelReason}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-4 ring-1 ring-inset ring-slate-900/[0.08]">
          <p className="eyebrow mb-2">Dueño</p>
          <p className="font-semibold">{appt.ownerName}</p>
          <p className="text-sm">{appt.phone}</p>
          <p className="text-sm text-slate-600">{appt.email || 'Sin correo'}</p>
        </div>
        <div className="rounded-2xl p-4 ring-1 ring-inset ring-slate-900/[0.08]">
          <p className="eyebrow mb-2">Mascota</p>
          <p className="font-semibold">{appt.petName}</p>
          <p className="text-sm">
            {speciesLabel(appt.species)}
            {appt.breed && ` · ${appt.breed}`}
            {appt.petAge && ` · ${appt.petAge}`}
          </p>
          <p className="text-sm text-slate-600">{appt.reason ? `Motivo: ${appt.reason}` : 'Sin motivo indicado'}</p>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Recordatorio: {appt.reminderSent ? <strong className="text-green-700">enviado</strong> : 'no enviado'}
        {appt.source === 'web' && ' · Reservada desde la web'}
      </p>

      <div className="space-y-2">
        <p className="eyebrow">Acciones</p>
        <div className="flex flex-wrap gap-2">
          {appt.status === 'pendiente' && (
            <button type="button" className="btn-primary" onClick={() => set('confirmada')}>
              <Check className="h-4 w-4" aria-hidden="true" /> Confirmar cita
            </button>
          )}
          {!closed && (
            <button type="button" className={appt.status === 'pendiente' ? 'btn-outline' : 'btn-primary'} onClick={() => sendMessages([appt], 'recordatorio')} disabled={channelOff} title={channelOff ? 'Canal no configurado' : undefined}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {channelOff ? 'Canal no configurado' : `Enviar recordatorio (${config.notificationChannel === 'whatsapp' ? 'WhatsApp' : 'correo'})`}
            </button>
          )}
          {!closed && (
            <>
              <button type="button" className="btn-outline" onClick={() => set('completada')} disabled={appt.status === 'completada'}>
                <CircleCheck className="h-4 w-4" aria-hidden="true" /> Completada
              </button>
              <button type="button" className="btn-outline" onClick={() => set('no_asistio')} disabled={appt.status === 'no_asistio'}>
                <UserX className="h-4 w-4" aria-hidden="true" /> No asistió
              </button>
              <button type="button" className="btn-outline" onClick={() => setMode('reschedule')}>
                <CalendarClock className="h-4 w-4" aria-hidden="true" /> Reprogramar
              </button>
            </>
          )}
          <button type="button" className="btn-outline" onClick={() => setMode('edit')}>
            <Pencil className="h-4 w-4" aria-hidden="true" /> Editar datos
          </button>
          {!closed && (
            <button type="button" className="btn-ghost text-red-700 hover:!bg-red-50 hover:!text-red-800" onClick={() => setMode('cancel')}>
              <XCircle className="h-4 w-4" aria-hidden="true" /> Cancelar cita
            </button>
          )}
          {closed && (
            <button type="button" className="btn-outline" onClick={() => setMode('reschedule')}>
              Reactivar en otro horario
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Historial de {appt.petName}</p>
        {history.length ? (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {history.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => onOpen(h.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50">
                  <span>
                    <span className="">{formatDateShort(h.date)}</span> · {serviceName(h.serviceId)}
                    {h.reason && <span className="text-slate-500"> · {h.reason}</span>}
                  </span>
                  <StatusBadge status={h.status} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Es la primera cita registrada de esta mascota.</p>
        )}
      </div>
    </div>
  )
}

function EditForm({ appt, done }) {
  const { updateAppointment } = useStore()
  const [f, setF] = useState({
    ownerName: appt.ownerName,
    phone: appt.phone,
    email: appt.email || '',
    petName: appt.petName,
    species: appt.species,
    breed: appt.breed || '',
    petAge: appt.petAge || '',
    reason: appt.reason || '',
  })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  function save(e) {
    e.preventDefault()
    const errs = {}
    const phone = normalizePhone(f.phone)
    if (f.ownerName.trim().length < 3) errs.ownerName = 'Nombre muy corto.'
    if (!phone) errs.phone = 'Teléfono dominicano inválido (809, 829 o 849).'
    if (f.email.trim() && !isEmail(f.email)) errs.email = 'Correo inválido.'
    if (!f.petName.trim()) errs.petName = 'Obligatorio.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    updateAppointment(appt.id, { ...f, phone, ownerName: f.ownerName.trim(), petName: f.petName.trim(), email: f.email.trim() })
    done()
  }

  return (
    <form onSubmit={save} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del dueño" htmlFor="e-owner" error={errors.ownerName} className="sm:col-span-2">
          <input id="e-owner" className="input" value={f.ownerName} onChange={set('ownerName')} />
        </Field>
        <Field label="Teléfono" htmlFor="e-phone" error={errors.phone}>
          <input id="e-phone" className="input" type="tel" value={f.phone} onChange={set('phone')} />
        </Field>
        <Field label="Correo" htmlFor="e-email" error={errors.email}>
          <input id="e-email" className="input" type="email" value={f.email} onChange={set('email')} />
        </Field>
        <Field label="Mascota" htmlFor="e-pet" error={errors.petName}>
          <input id="e-pet" className="input" value={f.petName} onChange={set('petName')} />
        </Field>
        <Field label="Especie" htmlFor="e-species">
          <select id="e-species" className="input" value={f.species} onChange={set('species')}>
            {SPECIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Raza" htmlFor="e-breed">
          <input id="e-breed" className="input" value={f.breed} onChange={set('breed')} />
        </Field>
        <Field label="Edad" htmlFor="e-age">
          <input id="e-age" className="input" value={f.petAge} onChange={set('petAge')} placeholder="Ej.: 3 años" />
        </Field>
        <Field label="Motivo" htmlFor="e-reason" className="sm:col-span-2">
          <textarea id="e-reason" rows={2} className="input" value={f.reason} onChange={set('reason')} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={done}>
          Volver
        </button>
        <button type="submit" className="btn-primary">
          Guardar cambios
        </button>
      </div>
    </form>
  )
}

function Reschedule({ appt, done }) {
  const { config, data, updateAppointment } = useStore()
  const service = config.services.find((s) => s.id === appt.serviceId)
  const duration = service?.durationMin || toMin(appt.end) - toMin(appt.start)
  const pros = service ? professionalsForService(config, service) : config.professionals
  const today = todayISO(config.timezone)
  const [date, setDate] = useState(appt.date >= today ? appt.date : today)
  const [proId, setProId] = useState(pros.some((p) => p.id === appt.professionalId) ? appt.professionalId : pros[0]?.id)
  const [time, setTime] = useState(null)

  const slots = useMemo(() => getSlots({ config, data, proId, date, duration, excludeId: appt.id }), [config, data, proId, date, duration, appt.id])

  function save() {
    updateAppointment(appt.id, {
      date,
      start: time,
      end: fromMin(toMin(time) + duration),
      professionalId: proId,
      status: appt.status === 'cancelada' || appt.status === 'no_asistio' ? 'pendiente' : appt.status,
      cancelReason: '',
      reminderSent: false,
    })
    done()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Actual: <span className="">{formatDateTitle(appt.date)}</span> a las {formatTime(appt.start)}. Solo se muestran horarios libres.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nueva fecha" htmlFor="r-date">
          <input id="r-date" type="date" className="input" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(null) }} />
        </Field>
        <Field label="Profesional" htmlFor="r-pro">
          <select id="r-pro" className="input" value={proId} onChange={(e) => { setProId(e.target.value); setTime(null) }}>
            {pros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <p className="label">Horario</p>
        {slots.length ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {slots.map((t) => (
              <button key={t} type="button" onClick={() => setTime(t)} aria-pressed={time === t} className={`option tabular h-10 rounded-xl text-sm font-semibold ${time === t ? 'bg-primary text-onprimary' : ''}`}>
                {formatTime(t)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hay horarios libres ese día con este profesional.</p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={done}>
          Volver
        </button>
        <button type="button" className="btn-primary" disabled={!time} onClick={save}>
          Guardar nuevo horario
        </button>
      </div>
    </div>
  )
}

function CancelForm({ appt, done }) {
  const { updateAppointment } = useStore()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const quick = ['El cliente no puede asistir', 'La mascota ya mejoró', 'Emergencia en la clínica', 'Cita duplicada']
  function save(e) {
    e.preventDefault()
    if (reason.trim().length < 3) {
      setError('Indique el motivo de la cancelación.')
      return
    }
    updateAppointment(appt.id, { status: 'cancelada', cancelReason: reason.trim() })
    done()
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-slate-600">
        Se cancelará la cita de <strong>{appt.petName}</strong> del <span className="">{formatDateTitle(appt.date)}</span> a las {formatTime(appt.start)}. El horario queda libre para otra reserva.
      </p>
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button key={q} type="button" className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:border-primary" onClick={() => { setReason(q); setError('') }}>
            {q}
          </button>
        ))}
      </div>
      <Field label="Motivo *" htmlFor="c-reason" error={error}>
        <textarea id="c-reason" rows={2} className="input" value={reason} onChange={(e) => { setReason(e.target.value); setError('') }} />
      </Field>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={done}>
          Volver
        </button>
        <button type="submit" className="btn-danger">
          Cancelar cita
        </button>
      </div>
    </form>
  )
}
