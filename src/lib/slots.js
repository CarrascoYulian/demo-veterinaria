import { toMin, fromMin, todayISO, nowMin, weekday } from './time.js'

export const BUFFER_MIN = 5

/** Intervalos ocupados de un profesional en un día (citas activas, bloqueos y almuerzo). */
export function busyIntervals({ config, data, proId, date, excludeId }) {
  const pro = config.professionals.find((p) => p.id === proId)
  const busy = []
  for (const a of data.appointments) {
    if (a.professionalId !== proId || a.date !== date) continue
    if (a.status === 'cancelada' || a.id === excludeId) continue
    busy.push({ s: toMin(a.start), e: toMin(a.end), buffer: true })
  }
  for (const b of data.blocks) {
    if (b.professionalId !== proId || b.date !== date) continue
    busy.push({ s: toMin(b.start), e: toMin(b.end), buffer: false })
  }
  if (pro?.lunchStart && pro?.lunchEnd) {
    busy.push({ s: toMin(pro.lunchStart), e: toMin(pro.lunchEnd), buffer: false })
  }
  return busy
}

export function worksOn(pro, date) {
  return !!pro && Array.isArray(pro.workDays) && pro.workDays.includes(weekday(date))
}

/** ¿El intervalo [s, s+duration) choca con algo ocupado? Se respeta un margen de 5 min entre citas. */
function clashes(busy, s, e) {
  return busy.some((b) => {
    const pad = b.buffer ? BUFFER_MIN : 0
    return s < b.e + pad && e + pad > b.s
  })
}

/** Horarios libres ('HH:MM') para un profesional, un día y una duración. */
export function getSlots({ config, data, proId, date, duration, excludeId, ignoreNow = false }) {
  const pro = config.professionals.find((p) => p.id === proId)
  if (!worksOn(pro, date) || !duration) return []
  const start = toMin(pro.startTime)
  const end = toMin(pro.endTime)
  const step = Math.max(5, Number(config.slotMinutes) || 15)
  const busy = busyIntervals({ config, data, proId, date, excludeId })

  let minStart = start
  if (!ignoreNow) {
    const today = todayISO(config.timezone)
    if (date < today) return []
    if (date === today) minStart = Math.max(start, nowMin(config.timezone) + 15)
  }

  const out = []
  for (let s = start; s + duration <= end; s += step) {
    if (s < minStart) continue
    if (!clashes(busy, s, s + duration)) out.push(fromMin(s))
  }
  return out
}

/** Une los huecos de varios profesionales: cada hora queda asignada al primero libre. */
export function slotsForPros({ config, data, proIds, date, duration, excludeId }) {
  const map = new Map()
  for (const proId of proIds) {
    for (const t of getSlots({ config, data, proId, date, duration, excludeId })) {
      if (!map.has(t)) map.set(t, proId)
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => toMin(a) - toMin(b))
    .map(([time, proId]) => ({ time, proId }))
}

/** Verificación final antes de guardar: evita dos citas solapadas con el mismo profesional. */
export function isSlotFree({ config, data, proId, date, start, duration, excludeId }) {
  const pro = config.professionals.find((p) => p.id === proId)
  if (!worksOn(pro, date)) return false
  const s = toMin(start)
  const e = s + duration
  if (s < toMin(pro.startTime) || e > toMin(pro.endTime)) return false
  return !clashes(busyIntervals({ config, data, proId, date, excludeId }), s, e)
}

export const professionalsForService = (config, service) =>
  service ? config.professionals.filter((p) => (service.professionalIds || []).includes(p.id)) : []
