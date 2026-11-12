import { formatDateLong, formatTime } from './time.js'

export const STATUSES = {
  pendiente: { label: 'Pendiente', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', block: 'bg-amber-50 border-amber-400 text-amber-950', dot: 'bg-amber-500' },
  confirmada: { label: 'Confirmada', badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20', block: 'bg-emerald-50 border-emerald-500 text-emerald-950', dot: 'bg-emerald-500' },
  completada: { label: 'Completada', badge: 'bg-sky-50 text-sky-800 ring-sky-600/20', block: 'bg-sky-50 border-sky-500 text-sky-950', dot: 'bg-sky-500' },
  cancelada: { label: 'Cancelada', badge: 'bg-red-50 text-red-800 ring-red-600/20', block: 'bg-red-50/70 border-red-400 text-red-900/70', dot: 'bg-red-500' },
  no_asistio: { label: 'No asistió', badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', block: 'bg-slate-100 border-slate-400 text-slate-700', dot: 'bg-slate-400' },
}

export const SPECIES_OPTIONS = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'conejo', label: 'Conejo' },
  { value: 'otro', label: 'Otro' },
]

export const speciesLabel = (v) => SPECIES_OPTIONS.find((s) => s.value === v)?.label || v

export function templateData(config, appt) {
  const service = config.services.find((s) => s.id === appt.serviceId)
  return {
    nombre: appt.ownerName.split(' ')[0],
    mascota: appt.petName,
    clinica: config.clinicName,
    fecha: formatDateLong(appt.date),
    hora: formatTime(appt.start),
    codigo: appt.code,
    servicio: service?.name || 'Servicio',
    telefono: config.phone,
    correoClinica: config.email,
  }
}

/** Normaliza un teléfono dominicano a 809-XXX-XXXX. Devuelve null si no es válido. */
export function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  if (digits.length !== 10 || !/^(809|829|849)/.test(digits)) return null
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim())

/** Citas anteriores (o futuras) de la misma mascota, identificada por nombre + teléfono del dueño. */
export const petHistory = (appointments, appt) =>
  appointments
    .filter((a) => a.id !== appt.id && a.petName.toLowerCase() === appt.petName.toLowerCase() && a.phone === appt.phone)
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))

/** Archivo .ics para "Agregar a mi calendario". República Dominicana usa UTC-4 todo el año. */
export function buildIcs({ appt, serviceName, clinicName, address }) {
  const toUtc = (date, hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCMinutes(h * 60 + m + 4 * 60)
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }
  const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agenda Veterinaria Demo//ES',
    'BEGIN:VEVENT',
    `UID:${appt.code}@agenda-demo`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${toUtc(appt.date, appt.start)}`,
    `DTEND:${toUtc(appt.date, appt.end)}`,
    `SUMMARY:${esc(`${serviceName} para ${appt.petName} - ${clinicName}`)}`,
    `LOCATION:${esc(address)}`,
    `DESCRIPTION:${esc(`Código de la cita: ${appt.code}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
