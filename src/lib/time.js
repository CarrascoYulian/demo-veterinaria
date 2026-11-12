// Utilidades de fecha y hora. Las fechas se manejan como texto 'YYYY-MM-DD'
// y las horas como 'HH:MM', siempre en la zona horaria de la clínica.

export const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return h * 60 + (m || 0)
}

export const fromMin = (min) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function todayISO(tz) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function nowMin(tz) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24
  const m = Number(parts.find((p) => p.type === 'minute').value)
  return h * 60 + m
}

const asDate = (iso) => new Date(`${iso}T00:00:00Z`)

export function addDays(iso, n) {
  const d = asDate(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const weekday = (iso) => asDate(iso).getUTCDay()

/** Lunes de la semana que contiene la fecha */
export function weekStart(iso) {
  const wd = weekday(iso)
  return addDays(iso, wd === 0 ? -6 : 1 - wd)
}

const fmt = (opts) => new Intl.DateTimeFormat('es-DO', { timeZone: 'UTC', ...opts })

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/** 'viernes, 13 de noviembre' (con la primera letra en mayúscula usar formatDateTitle) */
export const formatDateLong = (iso) =>
  fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(asDate(iso))

export const formatDateTitle = (iso) => cap(formatDateLong(iso))

export const formatDateShort = (iso) =>
  cap(fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(asDate(iso)))

export const formatDayName = (iso) => fmt({ weekday: 'short' }).format(asDate(iso)).replace('.', '')
export const formatDayNum = (iso) => fmt({ day: 'numeric' }).format(asDate(iso))
export const formatMonth = (iso) => fmt({ month: 'short' }).format(asDate(iso)).replace('.', '')

/** '14:30' -> '2:30 p. m.' */
export function formatTime(hhmm) {
  const min = toMin(hhmm)
  const h = Math.floor(min / 60)
  const m = min % 60
  const suffix = h >= 12 ? 'p. m.' : 'a. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
export const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
