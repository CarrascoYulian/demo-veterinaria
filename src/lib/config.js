// Carga y normalización de la configuración de la clínica.

export const PLACEHOLDERS = {
  clinicName: 'Tu Nombre Aquí',
  slogan: 'Tu slogan aquí',
  address: 'Tu dirección aquí',
  phone: '(809) 000-0000',
  email: 'tu@correo.com',
  hours: 'Tu horario aquí',
}

export const FONTS = ['Inter', 'Poppins', 'Merriweather']

// Foto de fondo del encabezado por defecto (Unsplash, licencia libre). Cada clínica puede poner la suya.
export const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35'
export const CHANNELS = ['whatsapp', 'email', 'ninguno']

// Respaldo por si config.json no se puede leer (por ejemplo, al abrir el archivo sin servidor).
export const FALLBACK_CONFIG = {
  ...PLACEHOLDERS,
  logoText: 'TN',
  logoUrl: '',
  heroImage: DEFAULT_HERO_IMAGE,
  primaryColor: '#0F766E',
  secondaryColor: '#EA580C',
  fontFamily: 'Inter',
  timezone: 'America/Santo_Domingo',
  slotMinutes: 15,
  bookingDaysAhead: 30,
  notificationChannel: 'whatsapp',
  reminderHoursBefore: 24,
  adminPin: '1234',
  seed: 2026,
  services: [
    { id: 'consulta', name: 'Consulta general', durationMin: 30, professionalIds: ['p1', 'p2'] },
    { id: 'vacunacion', name: 'Vacunación', durationMin: 15, professionalIds: ['p1', 'p2'] },
    { id: 'desparasitacion', name: 'Desparasitación', durationMin: 15, professionalIds: ['p1', 'p2'] },
    { id: 'bano', name: 'Baño y corte', durationMin: 60, professionalIds: ['p3'] },
    { id: 'cirugia', name: 'Cirugía menor', durationMin: 90, professionalIds: ['p2'] },
    { id: 'emergencia', name: 'Emergencia', durationMin: 30, professionalIds: ['p1', 'p2'] },
  ],
  professionals: [
    { id: 'p1', name: 'Dra. Laura Méndez', specialty: 'Medicina general', workDays: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { id: 'p2', name: 'Dr. Ramón Ortiz', specialty: 'Cirugía y medicina interna', workDays: [1, 3, 5, 6], startTime: '09:00', endTime: '18:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: 'p3', name: 'Yesenia Abreu', specialty: 'Estética y grooming', workDays: [2, 3, 4, 5, 6], startTime: '08:30', endTime: '16:30', lunchStart: '12:30', lunchEnd: '13:30' },
  ],
}

export async function loadBaseConfig() {
  try {
    const res = await fetch('./config.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    return normalizeConfig(await res.json())
  } catch {
    return normalizeConfig(FALLBACK_CONFIG)
  }
}

const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
const isTime = (v) => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)

export function normalizeConfig(raw) {
  const c = { ...FALLBACK_CONFIG, ...(raw || {}) }
  c.primaryColor = isHex(c.primaryColor) ? c.primaryColor : FALLBACK_CONFIG.primaryColor
  c.secondaryColor = isHex(c.secondaryColor) ? c.secondaryColor : FALLBACK_CONFIG.secondaryColor
  if (!FONTS.includes(c.fontFamily)) c.fontFamily = 'Inter'
  // Compatibilidad con la versión anterior (heroImages.main)
  if (typeof c.heroImage !== 'string') c.heroImage = typeof raw?.heroImages?.main === 'string' ? raw.heroImages.main : DEFAULT_HERO_IMAGE
  delete c.heroImages
  if (!CHANNELS.includes(c.notificationChannel)) c.notificationChannel = 'whatsapp'
  c.slotMinutes = Number(c.slotMinutes) || 15
  c.bookingDaysAhead = Math.min(120, Math.max(1, Number(c.bookingDaysAhead) || 30))
  c.reminderHoursBefore = Number(c.reminderHoursBefore) || 24
  c.adminPin = String(c.adminPin ?? '1234')
  c.professionals = (Array.isArray(c.professionals) ? c.professionals : []).map((p, i) => ({
    id: String(p.id || `p${i + 1}`),
    name: String(p.name || `Profesional ${i + 1}`),
    specialty: String(p.specialty || ''),
    workDays: (Array.isArray(p.workDays) ? p.workDays : [1, 2, 3, 4, 5]).map(Number).filter((d) => d >= 0 && d <= 6),
    startTime: isTime(p.startTime) ? p.startTime : '08:00',
    endTime: isTime(p.endTime) ? p.endTime : '17:00',
    lunchStart: isTime(p.lunchStart) ? p.lunchStart : '',
    lunchEnd: isTime(p.lunchEnd) ? p.lunchEnd : '',
  }))
  const proIds = new Set(c.professionals.map((p) => p.id))
  c.services = (Array.isArray(c.services) ? c.services : []).map((s, i) => ({
    id: String(s.id || `s${i + 1}`),
    name: String(s.name || `Servicio ${i + 1}`),
    durationMin: Math.max(5, Number(s.durationMin) || 30),
    professionalIds: (Array.isArray(s.professionalIds) ? s.professionalIds : []).map(String).filter((id) => proIds.has(id)),
  }))
  return c
}

export const isPlaceholder = (key, value) => PLACEHOLDERS[key] !== undefined && value === PLACEHOLDERS[key]

/** '#0F766E' -> '15 118 110' (para variables CSS) */
export function hexToRgbTriplet(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** Elige texto blanco o negro según el contraste con el color de fondo. */
export function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // contraste contra blanco vs contra negro
  return (1.05 / (lum + 0.05)) >= ((lum + 0.05) / 0.05) ? '255 255 255' : '15 23 42'
}

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Tono del color de acento para botones con texto blanco.
 * Si el color no llega a contraste 4.5:1 (WCAG AA) con blanco, se oscurece lo justo.
 * Así el naranja de la marca se conserva y los botones siguen siendo legibles.
 */
export function accessibleButtonShade(hex) {
  const n = parseInt(hex.slice(1), 16)
  let rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  for (let i = 0; i < 40 && 1.05 / (luminance(rgb) + 0.05) < 4.5; i++) rgb = rgb.map((v) => Math.round(v * 0.96))
  return rgb.join(' ')
}
