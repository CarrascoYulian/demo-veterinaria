import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { normalizeConfig, hexToRgbTriplet, readableOn, accessibleButtonShade } from './lib/config.js'
import { KEYS, load, save, remove } from './lib/storage.js'
import { generateDemoData } from './lib/seed.js'
import { send } from './lib/notify.js'
import { templateData } from './lib/appointments.js'
import { isSlotFree } from './lib/slots.js'
import { makeCode, uid } from './lib/ids.js'
import { toMin, fromMin } from './lib/time.js'

const StoreContext = createContext(null)

export function StoreProvider({ baseConfig, children }) {
  // Cambios hechos desde el panel de personalización (encima de config.json)
  const [override, setOverride] = useState(() => load(KEYS.config))
  const config = useMemo(() => normalizeConfig({ ...baseConfig, ...(override || {}) }), [baseConfig, override])

  const [data, setData] = useState(() => {
    const stored = load(KEYS.data)
    if (stored?.appointments) return { blocks: [], messages: [], ...stored }
    return generateDemoData(normalizeConfig({ ...baseConfig, ...(load(KEYS.config) || {}) }), baseConfig.seed)
  })

  const [preview, setPreview] = useState(null) // mensajes a mostrar en el visor
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => {
    if (override) setStorageOk(save(KEYS.config, override))
    else remove(KEYS.config)
  }, [override])

  useEffect(() => {
    setStorageOk(save(KEYS.data, data))
  }, [data])

  // Marca: colores y tipografía como variables CSS
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--c-primary', hexToRgbTriplet(config.primaryColor))
    root.setProperty('--c-secondary', hexToRgbTriplet(config.secondaryColor))
    root.setProperty('--c-on-primary', readableOn(config.primaryColor))
    root.setProperty('--c-on-secondary', readableOn(config.secondaryColor))
    root.setProperty('--c-accent', accessibleButtonShade(config.secondaryColor))
    root.setProperty('--font', `'${config.fontFamily}'`)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', config.primaryColor)
    document.title = `Agenda de citas | ${config.clinicName}`
  }, [config])

  const updateConfig = useCallback((patch) => setOverride((prev) => ({ ...(prev || {}), ...patch })), [])
  const resetConfig = useCallback(() => setOverride(null), [])
  const importConfig = useCallback((obj) => setOverride(normalizeConfig({ ...baseConfig, ...obj })), [baseConfig])

  const regenerate = useCallback(() => setData(generateDemoData(config)), [config])

  const notify = useCallback(
    (appt, template) => {
      const channel = config.notificationChannel
      const msg = send({
        channel,
        to: channel === 'email' ? appt.email : appt.phone,
        template,
        data: templateData(config, appt),
      })
      if (!msg) return null
      msg.appointmentId = appt.id
      msg.code = appt.code
      return msg
    },
    [config],
  )

  /** Envía (simulado) y deja registro. Devuelve los mensajes enviados. */
  const sendMessages = useCallback(
    (appts, template, { show = true } = {}) => {
      const msgs = appts.map((a) => notify(a, template)).filter(Boolean)
      if (!msgs.length) return []
      setData((d) => ({
        ...d,
        messages: [...msgs, ...d.messages],
        appointments:
          template === 'recordatorio'
            ? d.appointments.map((a) => (msgs.some((m) => m.appointmentId === a.id) ? { ...a, reminderSent: true } : a))
            : d.appointments,
      }))
      if (show) setPreview(msgs)
      return msgs
    },
    [notify],
  )

  const createAppointment = useCallback(
    (input) => {
      const service = config.services.find((s) => s.id === input.serviceId)
      if (!service) return { error: 'El servicio ya no está disponible.' }
      if (!isSlotFree({ config, data, proId: input.professionalId, date: input.date, start: input.start, duration: service.durationMin })) {
        return { error: 'Ese horario acaba de ocuparse. Por favor elija otro.' }
      }
      const appt = {
        id: uid(),
        code: makeCode(data.appointments.map((a) => a.code)),
        ...input,
        end: fromMin(toMin(input.start) + service.durationMin),
        status: 'pendiente',
        reminderSent: false,
        cancelReason: '',
        createdAt: new Date().toISOString(),
        source: 'web',
      }
      setData((d) => ({ ...d, appointments: [...d.appointments, appt] }))
      const msg = notify(appt, 'confirmacion')
      if (msg) setData((d) => ({ ...d, messages: [msg, ...d.messages] }))
      return { appt, msg }
    },
    [config, data, notify],
  )

  const updateAppointment = useCallback((id, patch) => {
    setData((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)) }))
  }, [])

  const addBlock = useCallback((block) => setData((d) => ({ ...d, blocks: [...d.blocks, { id: uid(), ...block }] })), [])
  const removeBlock = useCallback((id) => setData((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) })), [])

  const value = {
    config,
    baseConfig,
    hasOverrides: !!override,
    data,
    storageOk,
    updateConfig,
    resetConfig,
    importConfig,
    regenerate,
    createAppointment,
    updateAppointment,
    addBlock,
    removeBlock,
    sendMessages,
    preview,
    setPreview,
    customizeOpen,
    setCustomizeOpen,
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

export function useLookups() {
  const { config } = useStore()
  return useMemo(
    () => ({
      service: (id) => config.services.find((s) => s.id === id),
      pro: (id) => config.professionals.find((p) => p.id === id),
      serviceName: (id) => config.services.find((s) => s.id === id)?.name || 'Servicio eliminado',
      proName: (id) => config.professionals.find((p) => p.id === id)?.name || 'Profesional eliminado',
    }),
    [config],
  )
}
