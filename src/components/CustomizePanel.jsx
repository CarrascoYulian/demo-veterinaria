import { useEffect, useRef, useState } from 'react'
import { BellOff, ChevronDown, Download, Image as ImageIcon, Mail, MessageCircle, Palette, Plus, Trash2, Upload, X } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Logo } from './ui.jsx'
import { DEFAULT_HERO_IMAGE, FONTS, PLACEHOLDERS, isPlaceholder } from '../lib/config.js'

const thumb = (url) => (url.includes('images.unsplash.com') ? `${url.split('?')[0]}?w=160&q=60&auto=format&fit=crop` : url)

/** Una foto del encabezado: miniatura, subir archivo, pegar enlace o quitar. */
function HeroImageField({ label, config, updateConfig, flash }) {
  const inputRef = useRef(null)
  const url = config.heroImage || ''
  const set = (value) => updateConfig({ heroImage: value })

  function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) return flash('La foto debe ser PNG o JPG.', 'error')
    if (file.size > 1024 * 1024) return flash('La foto pesa más de 1 MB. Use una más liviana.', 'error')
    const reader = new FileReader()
    reader.onload = () => {
      set(reader.result)
      flash(`Foto actualizada.`)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-900/5">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
        {url ? <img src={thumb(url)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="m-5 h-6 w-6 text-slate-400" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <input
          className="input h-9 text-xs sm:h-9"
          aria-label={`Enlace de la ${label.toLowerCase()}`}
          placeholder="https://…"
          value={url.startsWith('data:') ? '(imagen subida)' : url}
          onChange={(e) => set(e.target.value.trim())}
          onFocus={(e) => url.startsWith('data:') && e.target.select()}
        />
        <div className="flex gap-1.5">
          <button type="button" className="btn-outline h-8 rounded-lg px-2.5 text-xs" onClick={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Subir
          </button>
          {url && (
            <button type="button" className="btn-ghost h-8 rounded-lg px-2.5 text-xs" onClick={() => set('')}>
              Quitar
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onFile} />
      </div>
    </div>
  )
}
import { WEEKDAY_LETTERS, WEEKDAY_NAMES } from '../lib/time.js'
import { STATUSES } from '../lib/appointments.js'

const TEXT_FIELDS = [
  ['clinicName', 'Nombre de la clínica', 'Reemplaza este texto con el nombre de tu clínica'],
  ['slogan', 'Slogan', 'Una frase corta que describa tu clínica'],
  ['address', 'Dirección', 'Calle, número, sector y ciudad'],
  ['phone', 'Teléfono', 'El número donde te llaman los clientes'],
  ['email', 'Correo', 'El correo de la clínica'],
  ['hours', 'Horario', 'Ej.: Lunes a viernes 8:00 a. m. - 6:00 p. m.'],
]

function Section({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group border-b border-slate-100 py-1 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 ease-out group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-4 pb-4">{children}</div>
    </details>
  )
}

export default function CustomizePanel({ open, onClose }) {
  const { config, updateConfig, resetConfig, importConfig, hasOverrides, storageOk } = useStore()
  const [msg, setMsg] = useState(null)
  const panelRef = useRef(null)
  const fileRef = useRef(null)
  const logoRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const flash = (text, tone = 'ok') => {
    setMsg({ text, tone })
    window.setTimeout(() => setMsg(null), 4000)
  }

  function onLogo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) return flash('El logo debe ser PNG o JPG.', 'error')
    if (file.size > 1024 * 1024) return flash('El logo pesa más de 1 MB. Usa una imagen más liviana.', 'error')
    const reader = new FileReader()
    reader.onload = () => {
      updateConfig({ logoUrl: reader.result })
      flash('Logo actualizado.')
    }
    reader.readAsDataURL(file)
  }

  function download() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const slug = isPlaceholder('clinicName', config.clinicName)
      ? 'mi-clinica'
      : config.clinicName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    a.download = `config-${slug}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function upload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('formato')
        if (obj.services && !Array.isArray(obj.services)) throw new Error('services')
        if (obj.professionals && !Array.isArray(obj.professionals)) throw new Error('professionals')
        importConfig(obj)
        flash('Configuración cargada.')
      } catch {
        flash('Ese archivo no es una configuración válida (JSON).', 'error')
      }
    }
    reader.readAsText(file)
  }

  function reset() {
    if (!window.confirm('¿Volver a la configuración original? Se pierden los cambios hechos en este panel.')) return
    resetConfig()
    flash('Configuración restablecida.')
  }

  // Servicios y profesionales
  const setService = (i, patch) => updateConfig({ services: config.services.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  const removeService = (i) => updateConfig({ services: config.services.filter((_, j) => j !== i) })
  const addService = () =>
    updateConfig({
      services: [...config.services, { id: `s${Date.now().toString(36)}`, name: 'Nuevo servicio', durationMin: 30, professionalIds: config.professionals.map((p) => p.id) }],
    })
  const toggleServicePro = (i, proId) => {
    const ids = config.services[i].professionalIds
    setService(i, { professionalIds: ids.includes(proId) ? ids.filter((x) => x !== proId) : [...ids, proId] })
  }
  const setPro = (i, patch) => updateConfig({ professionals: config.professionals.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
  const toggleDay = (i, d) => {
    const days = config.professionals[i].workDays
    setPro(i, { workDays: days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort() })
  }

  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in bg-slate-950/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Personaliza tu demo"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md animate-drawer-in flex-col bg-white shadow-pop outline-none sm:inset-y-2 sm:right-2 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
              <Palette className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Personaliza tu demo</h2>
              <p className="text-xs text-slate-500">Los cambios se ven al instante y se guardan.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon btn-ghost" aria-label="Cerrar panel">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {!storageOk && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">Este navegador no permite guardar. Los cambios se perderán al recargar.</p>}

          <Section title="Marca y textos" defaultOpen>
            {TEXT_FIELDS.map(([key, label, note]) => {
              const ph = isPlaceholder(key, config[key])
              return (
                <div key={key}>
                  <label htmlFor={`cz-${key}`} className="label">
                    {label}
                  </label>
                  <input
                    id={`cz-${key}`}
                    className={`input ${ph ? 'italic text-slate-400' : ''}`}
                    value={config[key]}
                    placeholder={PLACEHOLDERS[key]}
                    onFocus={(e) => ph && e.target.select()}
                    onChange={(e) => updateConfig({ [key]: e.target.value })}
                  />
                  {ph && <p className="mt-1 text-xs text-slate-500">{note}</p>}
                </div>
              )
            })}
          </Section>

          <Section title="Logo">
            <div className="flex items-center gap-4">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo actual" className="h-16 w-16 rounded-xl border border-slate-200 object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-900/5">
                  <Logo size="lg" />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-outline" onClick={() => logoRef.current?.click()}>
                  Subir imagen
                </button>
                {config.logoUrl && (
                  <button type="button" className="btn-ghost" onClick={() => updateConfig({ logoUrl: '' })}>
                    Usar la huella
                  </button>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onLogo} />
            </div>
            <p className="text-xs text-slate-500">Suba el logo de su clínica (PNG o JPG, máximo 1 MB). Mientras tanto se muestra una huella.</p>
          </Section>

          <Section title="Foto de fondo">
            <p className="text-sm text-slate-600">Ocupa todo el encabezado, detrás del texto. Use una foto horizontal con las mascotas hacia la derecha. PNG o JPG, máximo 1 MB, o pegue un enlace.</p>
            <HeroImageField label="Foto de fondo" config={config} updateConfig={updateConfig} flash={flash} />
            <button type="button" className="btn-ghost -ml-3 h-9 text-sm" onClick={() => updateConfig({ heroImage: DEFAULT_HERO_IMAGE })}>
              <ImageIcon className="h-4 w-4" aria-hidden="true" /> Usar la foto de ejemplo
            </button>
          </Section>

          <Section title="Colores y tipografía">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['primaryColor', 'Color principal'],
                ['secondaryColor', 'Color de acento'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label htmlFor={`cz-${key}`} className="label">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input id={`cz-${key}`} type="color" className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" value={config[key]} onChange={(e) => updateConfig({ [key]: e.target.value.toUpperCase() })} />
                    <span className="font-mono text-sm text-slate-600">{config[key]}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-900/5">
              <p className="text-xs font-semibold uppercase text-slate-500">Vista previa</p>
              <div className="rounded-lg bg-primary px-3 py-2 font-semibold text-onprimary">Encabezado</div>
              <div className="flex flex-wrap gap-2">
                <span className="btn-primary pointer-events-none">Botón principal</span>
                <span className="btn-secondary pointer-events-none">Secundario</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(STATUSES).map(([k, s]) => (
                  <span key={k} className={`chip ${s.badge}`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Tipografía</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipografía">
                {FONTS.map((font) => (
                  <button
                    key={font}
                    type="button"
                    role="radio"
                    aria-checked={config.fontFamily === font}
                    onClick={() => updateConfig({ fontFamily: font })}
                    style={{ fontFamily: `'${font}', sans-serif` }}
                    className={`option rounded-xl px-2 py-3 text-sm`}
                  >
                    <span className="block text-lg font-semibold">Aa</span>
                    {font}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Canal de recordatorios" defaultOpen>
            <p className="text-sm text-slate-600">Tú decides por dónde le llegan las confirmaciones y recordatorios a tus clientes.</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Canal de recordatorios">
              {[
                ['whatsapp', MessageCircle, 'WhatsApp'],
                ['email', Mail, 'Correo'],
                ['ninguno', BellOff, 'Ninguno'],
              ].map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={config.notificationChannel === key}
                  onClick={() => updateConfig({ notificationChannel: key })}
                  className="option flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-sm font-medium"
                >
                  <Icon className={`h-5 w-5 ${config.notificationChannel === key ? 'text-primary' : 'text-slate-400'}`} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="cz-hours-before" className="label">
                Enviar recordatorio (horas antes)
              </label>
              <select id="cz-hours-before" className="input w-36" value={config.reminderHoursBefore} onChange={(e) => updateConfig({ reminderHoursBefore: Number(e.target.value) })}>
                {[2, 12, 24, 48].map((h) => (
                  <option key={h} value={h}>
                    {h} horas
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Servicios">
            {config.services.map((s, i) => (
              <div key={s.id} className="space-y-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-900/5">
                <div className="flex gap-2">
                  <input className="input flex-1" aria-label={`Nombre del servicio ${i + 1}`} value={s.name} onChange={(e) => setService(i, { name: e.target.value })} />
                  <select className="input w-28" aria-label={`Duración de ${s.name}`} value={s.durationMin} onChange={(e) => setService(i, { durationMin: Number(e.target.value) })}>
                    {[15, 30, 45, 60, 75, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn-ghost px-2 text-red-700" onClick={() => removeService(i)} aria-label={`Quitar ${s.name}`} disabled={config.services.length <= 1}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label={`Quién atiende ${s.name}`}>
                  {config.professionals.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={s.professionalIds.includes(p.id)}
                      onClick={() => toggleServicePro(i, p.id)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs ${s.professionalIds.includes(p.id) ? 'border-primary bg-primary/10 text-slate-900' : 'border-slate-300 text-slate-400'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                {!s.professionalIds.length && <p className="text-xs text-amber-700">Elige al menos un profesional para que se pueda reservar.</p>}
              </div>
            ))}
            <button type="button" className="btn-outline w-full" onClick={addService}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Agregar servicio
            </button>
          </Section>

          <Section title="Profesionales y horarios">
            {config.professionals.map((p, i) => (
              <div key={p.id} className="space-y-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-900/5">
                <input className="input font-medium" aria-label={`Nombre del profesional ${i + 1}`} value={p.name} onChange={(e) => setPro(i, { name: e.target.value })} />
                <input className="input" aria-label={`Especialidad de ${p.name}`} placeholder="Especialidad" value={p.specialty} onChange={(e) => setPro(i, { specialty: e.target.value })} />
                <div className="flex gap-1" role="group" aria-label={`Días de trabajo de ${p.name}`}>
                  {WEEKDAY_LETTERS.map((l, d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={p.workDays.includes(d)}
                      aria-label={WEEKDAY_NAMES[d]}
                      onClick={() => toggleDay(i, d)}
                      className={`h-9 w-9 rounded-full text-sm font-semibold ${p.workDays.includes(d) ? 'bg-primary text-onprimary' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['startTime', 'Entrada'],
                    ['endTime', 'Salida'],
                    ['lunchStart', 'Almuerzo desde'],
                    ['lunchEnd', 'Almuerzo hasta'],
                  ].map(([k, l]) => (
                    <label key={k} className="block">
                      <span className="text-xs text-slate-500">{l}</span>
                      <input type="time" step={900} className="input" value={p[k]} onChange={(e) => setPro(i, { [k]: e.target.value })} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          <Section title="Guardar o cargar configuración">
            <p className="text-sm text-slate-600">Descarga tu versión para guardarla, o carga un archivo que ya tengas.</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-outline" onClick={download}>
                <Download className="h-4 w-4" aria-hidden="true" /> Descargar
              </button>
              <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" aria-hidden="true" /> Cargar
              </button>
            </div>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={upload} />
          </Section>
        </div>

        <div className="space-y-2 border-t border-slate-200 px-5 py-3">
          {msg && (
            <p className={`text-sm font-medium ${msg.tone === 'error' ? 'text-red-600' : 'text-green-700'}`} role="status">
              {msg.text}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost flex-1" onClick={reset} disabled={!hasOverrides}>
              Restablecer a placeholders
            </button>
            <button type="button" className="btn-primary flex-1" onClick={onClose}>
              Listo
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
