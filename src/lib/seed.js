// Generador de datos demo: dueños, mascotas, citas, bloqueos y mensajes.
// Nunca toca la marca (nombre, colores, textos): eso vive en la configuración.

import { seededRandom, makeCode, uid } from './ids.js'
import { addDays, todayISO, toMin, fromMin } from './time.js'
import { getSlots, professionalsForService } from './slots.js'
import { send } from './notify.js'
import { templateData } from './appointments.js'

const FIRST = ['María', 'Jonathan', 'Yurelkis', 'Cristian', 'Ana Rosa', 'José Miguel', 'Carolina', 'Luis Alberto', 'Yokasta', 'Rafael', 'Massiel', 'Kelvin', 'Wanda', 'Franklin', 'Rosanna', 'Starlin', 'Yaniris', 'Pedro', 'Altagracia', 'Eddy', 'Lisbeth', 'Manuel']
const LAST = ['Peña', 'Reyes', 'Familia', 'Mejía', 'Batista', 'Rodríguez', 'Pérez', 'Martínez', 'De la Cruz', 'Santana', 'Almonte', 'Guzmán', 'Núñez', 'Tavárez', 'Polanco', 'Rosario', 'Jiménez', 'Castillo', 'Valdez', 'Ureña']
const PET_NAMES = ['Max', 'Luna', 'Toby', 'Canela', 'Simba', 'Negrita', 'Kiara', 'Chochi', 'Rocky', 'Bruno', 'Nala', 'Princesa', 'Coco', 'Peluche', 'Oreo', 'Manchas', 'Lola', 'Firulais']
const SPECIES = {
  perro: ['Poodle', 'Labrador', 'Pitbull', 'Chihuahua', 'Shih Tzu', 'Mestizo', 'Golden Retriever', 'Yorkshire'],
  gato: ['Mestizo', 'Siamés', 'Persa', 'Angora'],
  ave: ['Perico', 'Cotorra', 'Canario'],
  conejo: ['Cabeza de león', 'Holland Lop', 'Mestizo'],
}
const SPECIES_WEIGHTS = [['perro', 0.6], ['gato', 0.28], ['ave', 0.06], ['conejo', 0.06]]
const REASONS = ['Chequeo anual', 'Vacuna de refuerzo', 'No quiere comer', 'Tiene picazón en la piel', 'Control post operatorio', 'Baño mensual', 'Vómitos desde ayer', '', '', '']
const PREFIXES = ['809', '829', '849']
const BLOCK_REASONS = ['Emergencia', 'Reunión de equipo', 'Diligencia personal']

export function generateDemoData(config, seed) {
  const rand = seededRandom(seed ?? Math.floor(Math.random() * 1e9))
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1))
  const chance = (p) => rand() < p
  const weighted = (pairs) => {
    let r = rand()
    for (const [v, w] of pairs) {
      if ((r -= w) <= 0) return v
    }
    return pairs[0][0]
  }

  const today = todayISO(config.timezone)

  // Dueños con sus mascotas (algunos con más de una visita, para que haya historial)
  const owners = Array.from({ length: int(14, 18) }, () => {
    const first = pick(FIRST)
    const last = chance(0.5) ? `${pick(LAST)} ${pick(LAST)}` : pick(LAST)
    const slug = `${first.split(' ')[0]}.${last.split(' ')[0]}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
    const species = weighted(SPECIES_WEIGHTS)
    return {
      ownerName: `${first} ${last}`,
      phone: `${pick(PREFIXES)}-${int(200, 999)}-${String(int(0, 9999)).padStart(4, '0')}`,
      email: chance(0.75) ? `${slug}${int(1, 99)}@example.com` : '',
      petName: pick(PET_NAMES),
      species,
      breed: pick(SPECIES[species]),
      petAge: `${int(1, 12)} ${chance(0.15) ? 'meses' : 'años'}`,
    }
  })

  const data = { appointments: [], blocks: [], messages: [] }

  // Bloqueos de ejemplo
  for (let i = 0; i < 2; i++) {
    const pro = pick(config.professionals)
    if (!pro) break
    let date = addDays(today, int(1, 9))
    for (let k = 0; k < 7 && !pro.workDays.includes(new Date(`${date}T00:00:00Z`).getUTCDay()); k++) date = addDays(date, 1)
    const s = toMin(pro.startTime) + 60 * int(1, 2)
    data.blocks.push({ id: uid(), professionalId: pro.id, date, start: fromMin(s), end: fromMin(s + 60), reason: pick(BLOCK_REASONS) })
  }

  const target = int(25, 40)
  const services = config.services.filter((s) => professionalsForService(config, s).length)
  for (let attempt = 0; attempt < 600 && data.appointments.length < target && services.length; attempt++) {
    const offset = weighted([[-1, 0.15], [0, 0.12], [1, 0.73]]) // pasado, hoy, próximos 14 días
    const date = offset === -1 ? addDays(today, -int(1, 4)) : offset === 0 ? today : addDays(today, int(1, 14))
    const service = pick(services)
    const pro = pick(professionalsForService(config, service))
    const slots = getSlots({ config, data, proId: pro.id, date, duration: service.durationMin, ignoreNow: true })
    if (!slots.length) continue
    const start = pick(slots)
    const owner = pick(owners)

    let status
    if (date < today) status = weighted([['completada', 0.7], ['no_asistio', 0.18], ['cancelada', 0.12]])
    else if (date === today) status = weighted([['confirmada', 0.45], ['pendiente', 0.25], ['completada', 0.2], ['cancelada', 0.1]])
    else status = weighted([['pendiente', 0.5], ['confirmada', 0.4], ['cancelada', 0.1]])

    const appt = {
      id: uid(),
      code: makeCode(data.appointments.map((a) => a.code), rand),
      serviceId: service.id,
      professionalId: pro.id,
      date,
      start,
      end: fromMin(toMin(start) + service.durationMin),
      ...owner,
      reason: pick(REASONS),
      status,
      reminderSent: false,
      cancelReason: status === 'cancelada' ? pick(['El cliente no puede asistir', 'Mascota mejoró', 'Cambio de planes']) : '',
      createdAt: new Date().toISOString(),
      source: 'demo',
    }

    const sendReminder = date <= addDays(today, 1) ? chance(0.75) : chance(0.25)
    if (status !== 'cancelada' && sendReminder && config.notificationChannel !== 'ninguno') {
      const channel = config.notificationChannel
      const msg = send({
        channel,
        to: channel === 'email' ? appt.email : appt.phone,
        template: 'recordatorio',
        data: templateData(config, appt),
      })
      if (msg) {
        // fecha del envío: el día anterior a la cita, a las 9:00 a. m.
        msg.at = new Date(`${addDays(date, -1)}T13:00:00Z`).toISOString()
        msg.appointmentId = appt.id
        msg.code = appt.code
        data.messages.push(msg)
        appt.reminderSent = true
      }
    }
    data.appointments.push(appt)
  }

  data.messages.sort((a, b) => b.at.localeCompare(a.at))
  data.generatedAt = new Date().toISOString()
  return data
}
